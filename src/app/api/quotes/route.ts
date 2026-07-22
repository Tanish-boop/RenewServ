import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST: Admin generates a quote
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAuthorized = ['ROOT_OWNER', 'OWNER'].includes(session.role);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const {
      bookingId,
      panelCount,
      systemSizeKw,
      cleaningCostInput,
      dismantlingCostInput,
      partsCostInput,
      discountInput,
      notes,
    } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const pCount = parseInt(panelCount) || 0;
    const sysSize = parseFloat(systemSizeKw) || 0.0;

    // AI Quote suggestion calculations
    const cleaningCost = cleaningCostInput !== undefined ? parseFloat(cleaningCostInput) : pCount * 75;
    const dismantlingCost = dismantlingCostInput !== undefined ? parseFloat(dismantlingCostInput) : sysSize * 1500;
    const partsCost = partsCostInput !== undefined ? parseFloat(partsCostInput) : sysSize * 500;
    const discount = discountInput !== undefined ? parseFloat(discountInput) : 0;

    const subtotal = cleaningCost + dismantlingCost + partsCost;
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const totalAmount = Math.round((subtotal + tax - discount) * 100) / 100;

    const quote = await prisma.$transaction(async (tx) => {
      const q = await tx.quote.upsert({
        where: { bookingId },
        update: {
          panelCount: pCount,
          systemSizeKw: sysSize,
          cleaningCost,
          dismantlingCost,
          partsCost,
          tax,
          discount,
          totalAmount,
          notes,
          status: 'PENDING',
        },
        create: {
          bookingId,
          panelCount: pCount,
          systemSizeKw: sysSize,
          cleaningCost,
          dismantlingCost,
          partsCost,
          tax,
          discount,
          totalAmount,
          notes,
          status: 'PENDING',
        },
      });

      // Update Booking status to QUOTE_SENT
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'QUOTE_SENT' },
      });

      // Log Audit Event
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'QUOTE_GENERATED',
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'unknown',
          details: JSON.stringify({ bookingId, quoteId: q.id, totalAmount }),
        },
      });

      return q;
    });

    // Outbound WhatsApp notification
    try {
      const { decrypt } = require('@/lib/crypto');
      const { sendQuoteGeneratedWA } = require('@/lib/whatsapp');
      
      const fullBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true }
      });
      
      if (fullBooking && fullBooking.customer.encryptedPhone) {
        const customerPhone = decrypt(fullBooking.customer.encryptedPhone);
        await sendQuoteGeneratedWA(customerPhone, fullBooking.customerId, bookingId, totalAmount);
      }
    } catch (waErr) {
      console.error('Failed to send quote generation WhatsApp notification:', waErr);
    }

    return NextResponse.json({ success: true, quote });
  } catch (err: any) {
    console.error('Quote generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Customer approves or rejects a quote
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId, action } = await req.json();

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { quote: true },
    });

    if (!booking || !booking.quote) {
      return NextResponse.json({ error: 'Booking or quote not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const advanceAmount = Math.round((booking.quote.totalAmount / 2) * 100) / 100;

      await prisma.$transaction(async (tx) => {
        // Update Quote status
        await tx.quote.update({
          where: { bookingId },
          data: { status: 'APPROVED' },
        });

        // Update Booking status to APPROVED and advancePaid = true
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'APPROVED',
            advancePaid: true,
          },
        });

        const transactionId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
        const idempotencyKey = 'IDEM-' + bookingId + '-advance';

        // Record simulated payment
        const payment = await tx.payment.create({
          data: {
            bookingId,
            amount: advanceAmount,
            type: 'ADVANCE',
            status: 'SUCCESS',
            transactionId,
            idempotencyKey,
          },
        });

        // Double-entry ledger audit: RAZORPAY_GATEWAY -> RENEWSERV_ESCROW
        await tx.ledger.create({
          data: {
            sourceAccount: 'RAZORPAY_GATEWAY',
            destinationAccount: 'RENEWSERV_ESCROW',
            amount: advanceAmount,
            referenceId: payment.id,
            description: `50% Advance Payment for Quote on Booking ID: ${bookingId}`,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: 'QUOTE_APPROVED',
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
            userAgent: req.headers.get('user-agent') || 'unknown',
            details: JSON.stringify({ bookingId, advanceAmount }),
          },
        });
      });

      // Outbound WhatsApp notifications
      try {
        const { decrypt } = require('@/lib/crypto');
        const { sendWhatsappMessage } = require('@/lib/whatsapp');
        
        const fullBooking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { customer: true }
        });
        
        if (fullBooking && fullBooking.customer.encryptedPhone) {
          const customerPhone = decrypt(fullBooking.customer.encryptedPhone);
          await sendWhatsappMessage({
            to: customerPhone,
            body: `💳 *Green Orbit Energy: Advance Paid!* 💳\n\nWe have received your 50% advance payment of ₹${advanceAmount.toFixed(2)}.\n\nTechnician is authorized to start cleaning.`,
            userId: fullBooking.customerId
          });
        }
      } catch (waErr) {
        console.error('Failed to send advance payment WhatsApp notification:', waErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Quote approved and advance paid successfully!',
      });
    } else {
      // Rejection
      await prisma.$transaction(async (tx) => {
        await tx.quote.update({
          where: { bookingId },
          data: { status: 'REJECTED' },
        });
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'PENDING' },
        });
      });

      return NextResponse.json({ success: true, message: 'Quote rejected.' });
    }
  } catch (err: any) {
    console.error('Quote action error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
