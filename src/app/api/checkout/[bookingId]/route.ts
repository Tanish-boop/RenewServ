import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';
import { sendPaymentExpiredNotification } from '@/lib/paymentNotifications';

export async function GET(
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
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: { profile: true },
        },
        address: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify ownership or admin access
    if (booking.customerId !== session.userId && !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Expiry calculation: 30 minutes from booking creation
    const expiryTime = new Date(booking.createdAt.getTime() + 30 * 60 * 1000);
    const now = new Date();
    const isExpired = now > expiryTime;
    const timeRemaining = Math.max(0, Math.floor((expiryTime.getTime() - now.getTime()) / 1000));

    // Handle Inline Expiry Transition
    if (isExpired && booking.status === 'PAYMENT_PENDING') {
      await prisma.$transaction(async (tx) => {
        // Update booking status
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'PAYMENT_EXPIRED' },
        });

        // Mark pending payments as EXPIRED
        await tx.payment.updateMany({
          where: { bookingId, status: 'PENDING' },
          data: { status: 'EXPIRED' },
        });

        // Release booking slots (delete technician assignments)
        await tx.technicianAssignment.deleteMany({
          where: { bookingId },
        });

        // Log Timeline
        await tx.bookingTimeline.create({
          data: {
            bookingId,
            status: 'PAYMENT_EXPIRED',
            notes: 'Payment time window of 30 minutes expired. Booking slot released.',
          },
        });

        // Log Audit
        await tx.auditLog.create({
          data: {
            userId: booking.customerId,
            action: 'PAYMENT_EXPIRED',
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
            userAgent: req.headers.get('user-agent') || 'unknown',
            details: JSON.stringify({ bookingId }),
          },
        });
      });

      // Send expired notifications
      try {
        await sendPaymentExpiredNotification(booking.customerId, bookingId);
      } catch (notifErr) {
        console.error('Failed to send payment expired notification:', notifErr);
      }

      booking.status = 'PAYMENT_EXPIRED';
    }

    // Decrypt contacts for dashboard view
    const customer = {
      name: booking.customer.profile?.name || 'Customer',
      phone: booking.customer.encryptedPhone ? decrypt(booking.customer.encryptedPhone) : '',
      email: booking.customer.encryptedEmail ? decrypt(booking.customer.encryptedEmail) : '',
    };

    // Secure bank details fetched from server-side environment variables to prevent client-side tampering
    const bankDetails = {
      holder: process.env.BANK_HOLDER_NAME || 'TANISH SHAILESH THAKARE',
      account: process.env.BANK_ACCOUNT_NUMBER || '5012348899',
      ifsc: process.env.BANK_IFSC_CODE || 'KKBK0000811',
      bank: process.env.BANK_NAME || 'Kotak Mahindra Bank',
      upiId: process.env.BANK_UPI_ID || '9765539107@ybl',
    };

    return NextResponse.json({
      booking: {
        id: booking.id,
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        status: booking.status,
        bookingFeePaid: booking.bookingFeePaid,
        createdAt: booking.createdAt,
      },
      customer,
      payments: booking.payments,
      expiry: {
        expiryTime,
        isExpired: booking.status === 'PAYMENT_EXPIRED' || isExpired,
        timeRemaining: booking.status === 'PAYMENT_EXPIRED' ? 0 : timeRemaining,
      },
      bankDetails,
    });
  } catch (err: any) {
    console.error('Failed to fetch checkout details:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
