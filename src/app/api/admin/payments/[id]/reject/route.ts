import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendPaymentFailedNotification } from '@/lib/paymentNotifications';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const paymentId = resolvedParams.id;

  try {
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Verification failed. The submitted UTR or receipt did not match our bank statement.';

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    if (payment.status !== 'UNDER_VERIFICATION') {
      return NextResponse.json({ error: `Payment is not in verification queue` }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Payment status to FAILED
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          notes: `Rejected by Admin: ${reason}`,
        },
      });

      // 2. Add Payment audit record
      await tx.paymentAudit.create({
        data: {
          bookingId: payment.bookingId,
          action: 'PAYMENT_REJECTED',
          amount: payment.amount,
          details: `Manual UPI payment verification rejected by admin: ${reason}`,
        },
      });

      // 3. Create Timeline log
      await tx.bookingTimeline.create({
        data: {
          bookingId: payment.bookingId,
          status: 'PAYMENT_PENDING',
          notes: `Payment details rejected by admin. Reason: ${reason}. Status remains PAYMENT_PENDING.`,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'PAYMENT_MANUALLY_REJECTED',
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'unknown',
          details: JSON.stringify({ paymentId, bookingId: payment.bookingId, reason }),
        },
      });
    });

    // Notify customer
    try {
      await sendPaymentFailedNotification(payment.booking.customerId, payment.bookingId, payment.amount, reason);
    } catch (notifErr) {
      console.error('Failed to notify customer of payment rejection:', notifErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to reject payment:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
