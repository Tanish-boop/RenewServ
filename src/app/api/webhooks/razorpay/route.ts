import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { resolveSuccessfulPayment } from '@/lib/paymentResolution';
import { sendPaymentFailedNotification, sendPaymentRefundedNotification } from '@/lib/paymentNotifications';

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';

  // 1. Verify Webhook Signature in Production
  // In development, if secret is mock or keys are not provided, we can bypass or log warning
  const isValid = verifyRazorpaySignature(bodyText, signature, webhookSecret);
  
  if (!isValid && process.env.NODE_ENV === 'production') {
    console.error('Invalid Razorpay Webhook Signature received!');
    return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyText);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const eventId = payload.id || `evt_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // 2. Webhook Idempotency Check
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    
    if (existingEvent) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    // Save event to prevent duplicates
    await prisma.webhookEvent.create({
      data: {
        provider: 'RAZORPAY',
        eventId,
        payload: bodyText,
        status: 'PENDING',
      },
    });

    const eventType = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    
    if (!paymentEntity) {
      // Not a payment event we process directly
      await prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'SKIPPED', processedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    // Extract identifiers from metadata notes
    const bookingId = paymentEntity.notes?.bookingId || paymentEntity.description;
    let paymentId = paymentEntity.notes?.paymentId;
    const rawAmount = paymentEntity.amount; // in paise
    const amount = rawAmount / 100;

    if (!bookingId) {
      await prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'FAILED', processedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: 'Booking ID missing in notes' });
    }

    // Load payment attempt or create one if missing
    if (!paymentId) {
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId, status: 'PENDING' },
      });
      paymentId = existingPayment?.id;
    }

    // Process event types
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      let finalPaymentId = paymentId;
      
      if (!finalPaymentId) {
        // Create matching payment record if webhook arrives out of order
        const createdPayment = await prisma.payment.create({
          data: {
            bookingId,
            amount,
            type: 'BOOKING_FEE',
            status: 'PENDING',
            provider: 'RAZORPAY',
            transactionId: paymentEntity.id,
            idempotencyKey: `IDEM-${bookingId}-captured-${Date.now()}`,
          },
        });
        finalPaymentId = createdPayment.id;
      }

      // Resolve the payment successfully
      await resolveSuccessfulPayment(bookingId, finalPaymentId, amount, 'RAZORPAY');

      // Update webhook log
      await prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    } 
    
    else if (eventType === 'payment.failed') {
      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'FAILED', notes: 'Razorpay reported payment failure.' },
        });

        // Log audit
        await prisma.paymentAudit.create({
          data: {
            bookingId,
            action: 'PAYMENT_FAILED',
            amount,
            details: `Razorpay transaction failed. Webhook event: ${eventId}`,
          },
        });

        // Notify client
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking) {
          await sendPaymentFailedNotification(booking.customerId, bookingId, amount, 'Transaction declined by bank/gateway.');
        }
      }

      await prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    } 
    
    else if (eventType === 'refund.processed') {
      const refundEntity = payload.payload?.refund?.entity;
      const originalPaymentId = refundEntity?.payment_id;

      const targetPayment = await prisma.payment.findFirst({
        where: {
          bookingId,
          OR: [
            { id: paymentId },
            { transactionId: originalPaymentId },
          ],
        },
      });

      if (targetPayment) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: targetPayment.id },
            data: { status: 'REFUNDED' },
          });

          // Debit Escrow, credit back gateway
          await tx.ledger.create({
            data: {
              sourceAccount: 'RENEWSERV_ESCROW',
              destinationAccount: 'RAZORPAY_GATEWAY',
              amount,
              referenceId: targetPayment.id,
              description: `Refund processed for booking ${bookingId}`,
            },
          });

          await tx.paymentAudit.create({
            data: {
              bookingId,
              action: 'PAYMENT_REFUNDED',
              amount,
              details: `Refund processed. original txn: ${targetPayment.transactionId}`,
            },
          });
        });

        // Notify customer
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking) {
          await sendPaymentRefundedNotification(booking.customerId, bookingId, amount);
        }
      }

      await prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook execution failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
