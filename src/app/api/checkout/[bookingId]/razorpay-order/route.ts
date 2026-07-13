import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getRazorpayInstance } from '@/lib/razorpay';

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

    if (booking.bookingFeePaid) {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    // Expiry Check
    const expiryTime = new Date(booking.createdAt.getTime() + 30 * 60 * 1000);
    if (new Date() > expiryTime) {
      return NextResponse.json({ error: 'Payment session expired. Please retry payment.' }, { status: 400 });
    }

    const amountInINR = 99.0;
    const amountInPaise = Math.round(amountInINR * 100);

    // Initialize Razorpay client
    const razorpay = getRazorpayInstance();
    
    // Create Secure Order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${bookingId.substring(0, 8)}`,
      notes: {
        bookingId,
      },
    });

    // Save PENDING payment session with Razorpay order ID as transaction ID
    const newTxnId = order.id;
    const newIdemKey = `IDEM-${bookingId}-razorpay-${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: amountInINR,
        type: 'BOOKING_FEE',
        status: 'PENDING',
        provider: 'RAZORPAY',
        transactionId: newTxnId,
        idempotencyKey: newIdemKey,
      },
    });

    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345',
      amount: order.amount,
      currency: order.currency,
      orderId: order.id,
      paymentId: payment.id,
      bookingId,
    });
  } catch (err: any) {
    console.error('Failed to create Razorpay secure order:', err);
    return NextResponse.json({ error: 'Failed to create payment gateway session' }, { status: 500 });
  }
}
