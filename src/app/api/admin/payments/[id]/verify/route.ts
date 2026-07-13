import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resolveSuccessfulPayment } from '@/lib/paymentResolution';

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
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    if (payment.status !== 'UNDER_VERIFICATION') {
      return NextResponse.json({ error: `Payment is not in verification queue (current status: ${payment.status})` }, { status: 400 });
    }

    // Call unified payment resolution helper
    await resolveSuccessfulPayment(payment.bookingId, payment.id, payment.amount, payment.provider || 'UPI');

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PAYMENT_MANUALLY_APPROVED',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
        details: JSON.stringify({ paymentId, bookingId: payment.bookingId }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to verify payment manually:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
