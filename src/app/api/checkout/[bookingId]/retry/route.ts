import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

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
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify ownership or admin access
    if (booking.customerId !== session.userId && !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (booking.bookingFeePaid) {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    // Reset session
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'PENDING',
          createdAt: new Date(), // reset 30-minute window
        },
      });

      // Mark any pending payments as EXPIRED
      await tx.payment.updateMany({
        where: { bookingId, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });

      // Create new payment session placeholder
      const newTxnId = 'TXN-RETRY-' + Math.floor(10000000 + Math.random() * 90000000);
      await tx.payment.create({
        data: {
          bookingId,
          amount: 99.0,
          type: 'BOOKING_FEE',
          status: 'PENDING',
          provider: 'RAZORPAY',
          transactionId: newTxnId,
          idempotencyKey: 'IDEM-' + bookingId + '-retry-' + Date.now(),
        },
      });

      // Timeline log
      await tx.bookingTimeline.create({
        data: {
          bookingId,
          status: 'PENDING',
          notes: 'Customer initiated a payment retry. Expiry window reset to 30 minutes.',
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'PAYMENT_RETRY_INITIATED',
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'unknown',
          details: JSON.stringify({ bookingId }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to retry payment:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
