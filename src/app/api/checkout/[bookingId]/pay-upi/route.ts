import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';
import { sendPaymentUnderVerificationNotification } from '@/lib/paymentNotifications';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const bookingId = resolvedParams.bookingId;

  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 1. Rate Limiting Check: Max 5 submissions per hour per IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSubmissionsCount = await prisma.paymentFraudEvent.count({
      where: {
        ipAddress: ip,
        createdAt: { gte: oneHourAgo },
      },
    });

    const recentPaymentsCount = await prisma.payment.count({
      where: {
        booking: { customerId: session.userId },
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentSubmissionsCount + recentPaymentsCount >= 5) {
      await prisma.paymentFraudEvent.create({
        data: {
          bookingId,
          eventType: 'EXCESSIVE_ATTEMPTS',
          ipAddress: ip,
          userAgent,
          details: 'Rate limit of 5 submissions per hour exceeded by this IP address.',
        },
      });
      return NextResponse.json({ error: 'Rate limit exceeded. You can only make 5 payment attempts per hour.' }, { status: 429 });
    }

    // 2. Fetch booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify ownership
    if (booking.customerId !== session.userId && !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (booking.bookingFeePaid) {
      return NextResponse.json({ error: 'This booking has already been paid.' }, { status: 400 });
    }

    // 3. Expiry Check
    const expiryTime = new Date(booking.createdAt.getTime() + 30 * 60 * 1000);
    const now = new Date();
    const isExpired = now > expiryTime;

    if (isExpired && booking.status !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
        });
        await tx.payment.updateMany({
          where: { bookingId, status: 'PENDING' },
          data: { status: 'EXPIRED' },
        });
        await tx.technicianAssignment.deleteMany({
          where: { bookingId },
        });
      });
      return NextResponse.json({ error: 'Payment session expired. Please retry payment to request a new session.' }, { status: 400 });
    }

    // 4. Handle request body
    const body = await req.json();
    const { utr: rawUtr, screenshotUrl, screenshotPublicId } = body;

    if (!rawUtr && !screenshotUrl) {
      return NextResponse.json({ error: 'Please submit a UTR number or upload a payment receipt screenshot.' }, { status: 400 });
    }

    // 5. UTR Normalization and Validation
    let normalizedUtr = '';
    if (rawUtr) {
      normalizedUtr = rawUtr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (normalizedUtr.length < 8 || normalizedUtr.length > 18) {
        return NextResponse.json({ error: 'Invalid UTR. It must be between 8 and 18 alphanumeric characters.' }, { status: 400 });
      }
    }

    // 6. Screenshot Hash Generation
    let screenshotHash = '';
    if (screenshotUrl) {
      screenshotHash = crypto.createHash('sha256').update(screenshotPublicId || screenshotUrl).digest('hex');
    }

    // 7. Fraud Scoring Engine
    let fraudScore = 0;
    const fraudDetails: string[] = [];

    // Check duplicate UTR
    if (normalizedUtr) {
      const duplicateUtrPayment = await prisma.payment.findFirst({
        where: {
          utr: normalizedUtr,
          status: { in: ['SUCCESS', 'UNDER_VERIFICATION'] },
        },
      });
      if (duplicateUtrPayment) {
        fraudScore += 70;
        fraudDetails.push(`Duplicate UTR ${normalizedUtr} detected`);
      }
    }

    // Check duplicate Screenshot Hash
    if (screenshotHash) {
      const duplicateHashPayment = await prisma.payment.findFirst({
        where: {
          screenshotHash,
          status: { in: ['SUCCESS', 'UNDER_VERIFICATION'] },
        },
      });
      if (duplicateHashPayment) {
        fraudScore += 50;
        fraudDetails.push(`Duplicate screenshot hash detected`);
      }
    }

    // Multiple failed/expired payment attempts on this booking
    const previousAttemptsCount = booking.payments.length;
    if (previousAttemptsCount >= 3) {
      fraudScore += 20;
      fraudDetails.push(`Multiple attempts logged (${previousAttemptsCount})`);
    }

    // Check repeated IP submissions
    const recentIpEvents = await prisma.paymentFraudEvent.count({
      where: {
        ipAddress: ip,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentIpEvents > 0) {
      fraudScore += 20;
      fraudDetails.push(`Repeated IP activity (${recentIpEvents} events)`);
    }

    const isFlagged = fraudScore >= 50;

    // Log Fraud Event if flagged
    if (isFlagged) {
      await prisma.paymentFraudEvent.create({
        data: {
          bookingId,
          utr: normalizedUtr || null,
          screenshotHash: screenshotHash || null,
          eventType: normalizedUtr && fraudScore >= 70 ? 'DUPLICATE_UTR' : 'DUPLICATE_SCREENSHOT',
          ipAddress: ip,
          userAgent,
          details: fraudDetails.join(', '),
        },
      });
    }

    // 8. Create Payment Attempt with status UNDER_VERIFICATION
    const newTxnId = 'TXN-UPI-' + Math.floor(10000000 + Math.random() * 90000000);
    const newIdemKey = 'IDEM-' + bookingId + '-upi-' + Date.now();

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: 99.0,
        type: 'BOOKING_FEE',
        status: 'UNDER_VERIFICATION',
        provider: 'UPI',
        transactionId: newTxnId,
        idempotencyKey: newIdemKey,
        utr: normalizedUtr || null,
        screenshotUrl: screenshotUrl || null,
        screenshotHash: screenshotHash || null,
        screenshotPublicId: screenshotPublicId || null,
        screenshotUploadedAt: screenshotUrl ? new Date() : null,
        fraudScore,
        isFlagged,
        notes: isFlagged ? `Flagged automatically by fraud engine. Score: ${fraudScore}. Details: ${fraudDetails.join(', ')}` : null,
      },
    });

    // Create Booking Timeline Milestone
    await prisma.bookingTimeline.create({
      data: {
        bookingId,
        status: 'PENDING',
        notes: `Customer submitted direct UPI payment details. UTR: ${normalizedUtr || 'N/A'}. Status: UNDER_VERIFICATION.`,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PAYMENT_SUBMITTED',
        ipAddress: ip,
        userAgent,
        details: JSON.stringify({
          bookingId,
          paymentId: payment.id,
          utr: normalizedUtr,
          fraudScore,
          isFlagged,
        }),
      },
    });

    // Send customer notification: Payment Under Verification
    try {
      await sendPaymentUnderVerificationNotification(booking.customerId, bookingId, 99.0);
    } catch (notifErr) {
      console.error('Failed to send notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      status: payment.status,
      isFlagged,
    });
  } catch (err: any) {
    console.error('Failed to submit direct UPI payment:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
