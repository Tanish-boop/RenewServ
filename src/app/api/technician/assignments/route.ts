import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isTechnician = session.role === 'TECHNICIAN';
  const isAdmin = ['ROOT_OWNER', 'OWNER'].includes(session.role);

  if (!isTechnician && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { bookingId, status, findings, panelCondition, outputVoltage, efficiencyBefore, efficiencyAfter } = await req.json();

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        quote: true,
        technicianAssignments: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update status in database
    await prisma.$transaction(async (tx) => {
      // 1. If moving to INSPECTION_COMPLETED, create the Inspection Report
      if (status === 'INSPECTION_COMPLETED') {
        const technician = await tx.technician.findUnique({
          where: { userId: session.userId },
        });
        const techId = technician?.id || booking.technicianAssignments[0]?.technicianId;

        if (!techId) {
          throw new Error('No technician associated with this assignment');
        }

        const lat = parseFloat(outputVoltage) || 230;
        const effBefore = parseFloat(efficiencyBefore) || 60.0;
        const effAfter = parseFloat(efficiencyAfter) || 95.0;

        await tx.inspectionReport.upsert({
          where: { bookingId },
          update: {
            technicianId: techId,
            panelCondition: panelCondition || 'DIRTY_DEGRADED',
            outputVoltage: lat,
            efficiencyBefore: effBefore,
            efficiencyAfter: effAfter,
            findings: findings || 'Inspection completed successfully. Needs cleaning.',
            carbonSavedKg: (effAfter - effBefore) * 0.15, // Simple formula for CO2 impact
          },
          create: {
            bookingId,
            technicianId: techId,
            panelCondition: panelCondition || 'DIRTY_DEGRADED',
            outputVoltage: lat,
            efficiencyBefore: effBefore,
            efficiencyAfter: effAfter,
            findings: findings || 'Inspection completed successfully. Needs cleaning.',
            carbonSavedKg: (effAfter - effBefore) * 0.15,
          },
        });
      }

      // 2. If moving to COMPLETED, process final payments and ledger movement
      if (status === 'COMPLETED') {
        const totalAmount = booking.quote?.totalAmount || 199.0;
        const finalAmount = Math.round((totalAmount / 2) * 100) / 100;
        const transactionId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
        const idempotencyKey = 'IDEM-' + bookingId + '-final';

        // Record simulated final payment
        const payment = await tx.payment.create({
          data: {
            bookingId,
            amount: finalAmount,
            type: 'FINAL',
            status: 'SUCCESS',
            transactionId,
            idempotencyKey,
          },
        });

        // Update booking completion & payments paid
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'COMPLETED',
            finalPaid: true,
          },
        });

        // Ledger: final payment RAZORPAY_GATEWAY -> RENEWSERV_ESCROW
        await tx.ledger.create({
          data: {
            sourceAccount: 'RAZORPAY_GATEWAY',
            destinationAccount: 'RENEWSERV_ESCROW',
            amount: finalAmount,
            referenceId: payment.id,
            description: `Final 50% Payment for Booking ID: ${bookingId}`,
          },
        });

        // Ledger Release: Release all funds from ESCROW to REVENUE
        // Total funds = ₹99 (booking fee) + 50% advance + 50% final = totalAmount + ₹99
        const totalEarned = totalAmount + 99.0;
        await tx.ledger.create({
          data: {
            sourceAccount: 'RENEWSERV_ESCROW',
            destinationAccount: 'RENEWSERV_REVENUE',
            amount: totalEarned,
            referenceId: bookingId,
            description: `Release Escrow to Revenue for completed Booking ID: ${bookingId}`,
          },
        });
      } else {
        // Just update status for non-COMPLETED updates
        await tx.booking.update({
          where: { id: bookingId },
          data: { status },
        });
      }

      // Log Audit
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: `STATUS_UPDATED_${status}`,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'unknown',
          details: JSON.stringify({ bookingId, status }),
        },
      });
    });

    // Outbound WhatsApp notifications
    try {
      const { decrypt } = require('@/lib/crypto');
      const { 
        sendTechnicianOnTheWayWA, 
        sendInspectionCompletedWA, 
        sendServiceCompletedWA,
        sendWhatsappMessage 
      } = require('@/lib/whatsapp');
      
      const fullBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          technicianAssignments: {
            include: {
              technician: {
                include: { user: { include: { profile: true } } }
              }
            }
          }
        }
      });
      
      if (fullBooking && fullBooking.customer.encryptedPhone) {
        const customerPhone = decrypt(fullBooking.customer.encryptedPhone);
        const customerId = fullBooking.customerId;
        
        const assignment = fullBooking.technicianAssignments[0];
        const techName = assignment?.technician?.user?.profile?.name || 'Technician';
        
        if (status === 'TECHNICIAN_ON_THE_WAY') {
          await sendTechnicianOnTheWayWA(customerPhone, customerId, bookingId, techName, 25);
        } else if (status === 'INSPECTION_COMPLETED') {
          await sendInspectionCompletedWA(customerPhone, customerId, bookingId);
        } else if (status === 'WORK_STARTED') {
          await sendWhatsappMessage({
            to: customerPhone,
            body: `⚡ *Green Orbit Energy: Work Started!* ⚡\n\n${techName} has started washing your panels using RO soft water. Restoring peak output!`,
            userId: customerId
          });
        } else if (status === 'COMPLETED') {
          await sendServiceCompletedWA(customerPhone, customerId, bookingId);
        }
      }
    } catch (waErr) {
      console.error('Failed to dispatch status update WhatsApp notification:', waErr);
    }

    return NextResponse.json({ success: true, newStatus: status });
  } catch (err: any) {
    console.error('Update booking status API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId, technicianId } = await req.json();

    if (!bookingId || !technicianId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const technician = await prisma.technician.findUnique({ where: { id: technicianId } });
    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    const assignment = await prisma.$transaction(async (tx) => {
      // Delete any existing assignments for this booking
      await tx.technicianAssignment.deleteMany({
        where: { bookingId },
      });

      // Create new assignment
      const newAssign = await tx.technicianAssignment.create({
        data: {
          bookingId,
          technicianId,
          status: 'ASSIGNED',
        },
      });

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'ASSIGNED' },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'MANUAL_ASSIGNMENT',
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'unknown',
          details: JSON.stringify({ bookingId, technicianId }),
        },
      });

      return newAssign;
    });

    return NextResponse.json({ success: true, assignment });
  } catch (err: any) {
    console.error('Manual assign error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
