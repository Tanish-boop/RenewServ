import prisma from './db';
import { sendPaymentSuccessfulNotification } from './paymentNotifications';
import { sendTechnicianAssignedWA } from './whatsapp';

export async function resolveSuccessfulPayment(
  bookingId: string,
  paymentId: string,
  amount: number,
  provider = 'RAZORPAY'
) {
  // Execute database actions within transactional isolation
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch booking details with customer info
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: { profile: true },
        },
        address: true,
      },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (booking.bookingFeePaid) {
      // Idempotency: return early if already processed
      return { booking, tech: null, amount };
    }

    // 2. Update payment status to SUCCESS
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCESS',
        verifiedAt: new Date(),
      },
    });

    // 3. Update booking fee status and booking status to CONFIRMED
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        bookingFeePaid: true,
        status: 'CONFIRMED',
      },
    });

    // 4. Double-entry ledger audit
    await tx.ledger.create({
      data: {
        sourceAccount: provider === 'UPI' ? 'CUSTOMER_WALLET' : 'RAZORPAY_GATEWAY',
        destinationAccount: 'RENEWSERV_ESCROW',
        amount,
        referenceId: paymentId,
        description: `Booking fee of ₹${amount} cleared for Booking: ${bookingId}`,
      },
    });

    // 5. System Audit Log
    await tx.auditLog.create({
      data: {
        userId: booking.customerId,
        action: 'PAYMENT_VERIFIED',
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        details: JSON.stringify({ bookingId, paymentId, amount, provider }),
      },
    });

    // 6. Generate Invoice placeholder
    const invNum = 'INV-' + bookingId.substring(0, 8).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    
    // Tax calculation (18% GST)
    const baseAmount = amount / 1.18;
    const tax = amount - baseAmount;

    await tx.invoice.upsert({
      where: { bookingId },
      update: {
        amount: baseAmount,
        tax: tax,
        discount: 0,
        totalAmount: amount,
        status: 'PAID',
      },
      create: {
        bookingId,
        invoiceNumber: invNum,
        amount: baseAmount,
        tax: tax,
        discount: 0,
        totalAmount: amount,
        status: 'PAID',
      },
    });

    // 7. Timeline event
    await tx.bookingTimeline.create({
      data: {
        bookingId,
        status: 'CONFIRMED',
        notes: `Payment verified. Booking fee ₹${amount} received. Booking status: CONFIRMED. Invoice ${invNum} generated.`,
      },
    });

    // 8. Dispatch technician assignment
    const territory = await tx.territory.findFirst({
      where: { isActive: true },
    });

    let tech = await tx.technician.findFirst({
      where: {
        territoryId: territory?.id,
        isAvailable: true,
      },
      include: {
        user: { include: { profile: true } }
      }
    });

    if (!tech) {
      tech = await tx.technician.findFirst({
        where: { isAvailable: true },
        include: {
          user: { include: { profile: true } }
        }
      });
    }

    if (tech) {
      // Create new assignment
      await tx.technicianAssignment.create({
        data: {
          bookingId,
          technicianId: tech.id,
          status: 'ASSIGNED',
        },
      });

      // Update booking status to TECHNICIAN_ASSIGNED
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'TECHNICIAN_ASSIGNED' },
      });

      // Timeline log
      await tx.bookingTimeline.create({
        data: {
          bookingId,
          status: 'TECHNICIAN_ASSIGNED',
          notes: `Technician ${tech.user.profile?.name || 'Staff'} assigned to this service.`,
        },
      });
    }

    return { booking, tech, amount };
  });

  // 9. Dispatch notifications asynchronously outside the db transaction
  if (result) {
    try {
      const { decrypt } = require('./crypto');
      const phone = result.booking.customer.encryptedPhone ? decrypt(result.booking.customer.encryptedPhone) : '';

      // Notify customer payment cleared
      await sendPaymentSuccessfulNotification(result.booking.customerId, bookingId, result.amount);

      // Notify customer technician dispatched
      if (result.tech && phone) {
        const techName = result.tech.user.profile?.name || 'Technician';
        const rating = result.tech.rating || 5.0;
        await sendTechnicianAssignedWA(phone, result.booking.customerId, bookingId, techName, rating);
      }
    } catch (err) {
      console.error('Async payment notifications failed to dispatch:', err);
    }
  }

  return result;
}
