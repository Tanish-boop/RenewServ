import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';

// Helper to decrypt user fields
function decryptUser(user: any) {
  if (!user) return null;
  return {
    ...user,
    email: user.encryptedEmail ? decrypt(user.encryptedEmail) : 'No email provided',
    phone: user.encryptedPhone ? decrypt(user.encryptedPhone) : 'No phone provided',
  };
}

// Helper to decrypt address fields
function decryptAddress(address: any) {
  if (!address) return null;
  return {
    ...address,
    addressLine: address.encryptedAddress ? decrypt(address.encryptedAddress) : 'No address provided',
    gpsCoords: address.encryptedGps ? decrypt(address.encryptedGps) : '',
  };
}

// GET booking details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const bookingId = resolvedParams.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        address: true,
        customer: {
          include: {
            profile: true,
          },
        },
        quote: true,
        review: true,
        invoice: true,
        inspectionReport: true,
        technicianAssignments: {
          include: {
            technician: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        jobImages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Decrypt main booking contact fields
    const decryptedBooking = {
      ...booking,
      customer: decryptUser(booking.customer),
      address: decryptAddress(booking.address),
    };

    // Fetch customer's full booking history
    const rawHistory = await prisma.booking.findMany({
      where: { customerId: booking.customerId },
      include: {
        address: true,
        quote: true,
        invoice: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const customerHistory = rawHistory.map((b: any) => ({
      ...b,
      address: decryptAddress(b.address),
    }));

    // Fetch all technicians to populate quick assign
    const rawTechs = await prisma.technician.findMany({
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        territory: true,
      },
    });

    const techniciansList = rawTechs.map((t: any) => ({
      id: t.id,
      name: t.user.profile?.name || 'Technician',
      employeeId: t.employeeId,
      phone: t.user.encryptedPhone ? decrypt(t.user.encryptedPhone) : 'N/A',
      email: t.user.encryptedEmail ? decrypt(t.user.encryptedEmail) : 'N/A',
      isAvailable: t.isAvailable,
      rating: t.rating,
      territoryName: t.territory?.name || 'Pune',
    }));

    return NextResponse.json({
      booking: decryptedBooking,
      customerHistory,
      techniciansList,
    });
  } catch (err: any) {
    console.error('Fetch booking admin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update booking properties
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const bookingId = resolvedParams.id;

  try {
    const body = await req.json();
    const {
      status,
      paymentStatus,
      technicianId,
      scheduledDate,
      scheduledTime,
      notes,
      invoice,
    } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        technicianAssignments: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Handle Status updates
      if (status && status !== booking.status) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status },
        });

        // Add timeline
        await tx.bookingTimeline.create({
          data: {
            bookingId,
            status: status,
            notes: `Status manually updated to ${status} by Administrator.`,
          },
        });

        // Add Audit Log
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: `STATUS_UPDATED_${status}`,
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
            userAgent: req.headers.get('user-agent') || 'unknown',
            details: JSON.stringify({ bookingId, status }),
          },
        });

        // If completed, make sure final paid is set and log revenue movement
        if (status === 'WORK_COMPLETED' || status === 'COMPLETED') {
          await tx.booking.update({
            where: { id: bookingId },
            data: { finalPaid: true, paymentStatus: 'PAID' },
          });

          // Create mock final payment if missing
          const existingFinal = await tx.payment.findFirst({
            where: { bookingId, type: 'FINAL' },
          });

          if (!existingFinal) {
            const finalPay = await tx.payment.create({
              data: {
                bookingId,
                amount: 900.0, // mock standard
                type: 'FINAL',
                status: 'SUCCESS',
                transactionId: 'TXN-FIN-' + Math.floor(100000 + Math.random() * 900000),
                idempotencyKey: 'IDEM-ADMIN-FIN-' + bookingId,
              },
            });

            // Ledger Release
            await tx.ledger.create({
              data: {
                sourceAccount: 'RAZORPAY_GATEWAY',
                destinationAccount: 'RENEWSERV_ESCROW',
                amount: 900.0,
                referenceId: finalPay.id,
                description: `Admin manual completion final fee for Booking: ${bookingId}`,
              },
            });

            await tx.ledger.create({
              data: {
                sourceAccount: 'RENEWSERV_ESCROW',
                destinationAccount: 'RENEWSERV_REVENUE',
                amount: 999.0, // Deposit + final
                referenceId: bookingId,
                description: `Admin manual escrow release for completed Booking: ${bookingId}`,
              },
            });
          }
        }
      }

      // 2. Handle Payment Status updates
      if (paymentStatus) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { paymentStatus },
        });

        // Sync booleans
        if (paymentStatus === 'PAID') {
          await tx.booking.update({
            where: { id: bookingId },
            data: { bookingFeePaid: true, advancePaid: true, finalPaid: true },
          });
        } else if (paymentStatus === 'UNPAID') {
          await tx.booking.update({
            where: { id: bookingId },
            data: { bookingFeePaid: false, advancePaid: false, finalPaid: false },
          });
        } else if (paymentStatus === 'ADVANCE_PAID') {
          await tx.booking.update({
            where: { id: bookingId },
            data: { bookingFeePaid: true, advancePaid: true, finalPaid: false },
          });
        }

        // Add timeline
        await tx.bookingTimeline.create({
          data: {
            bookingId,
            status: status || booking.status,
            notes: `Payment status manually updated to ${paymentStatus} by Administrator.`,
          },
        });

        // Add Audit Log
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: `PAYMENT_STATUS_UPDATED_${paymentStatus}`,
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
            userAgent: req.headers.get('user-agent') || 'unknown',
            details: JSON.stringify({ bookingId, paymentStatus }),
          },
        });
      }

      // 3. Handle Rescheduling
      if (scheduledDate || scheduledTime) {
        const updateData: any = {};
        if (scheduledDate) updateData.scheduledDate = scheduledDate;
        if (scheduledTime) updateData.scheduledTime = scheduledTime;

        await tx.booking.update({
          where: { id: bookingId },
          data: updateData,
        });

        // Add timeline
        await tx.bookingTimeline.create({
          data: {
            bookingId,
            status: status || booking.status,
            notes: `Booking rescheduled to ${scheduledDate || booking.scheduledDate} (${scheduledTime || booking.scheduledTime}) by Administrator.`,
          },
        });
      }

      // 4. Handle Technician Assignment/Reassignment/Removal
      if (technicianId !== undefined) {
        // Delete existing assignments
        await tx.technicianAssignment.deleteMany({
          where: { bookingId },
        });

        if (technicianId) {
          // Create new assignment
          await tx.technicianAssignment.create({
            data: {
              bookingId,
              technicianId,
              status: 'ASSIGNED',
            },
          });

          // Update booking status
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'TECHNICIAN_ASSIGNED' },
          });

          const tech = await tx.technician.findUnique({
            where: { id: technicianId },
            include: { user: { include: { profile: true } } },
          });

          // Add timeline
          await tx.bookingTimeline.create({
            data: {
              bookingId,
              status: 'TECHNICIAN_ASSIGNED',
              notes: `Technician ${tech?.user.profile?.name || 'Staff'} assigned to this service.`,
            },
          });
        } else {
          // Removed assignment
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'PENDING' },
          });

          // Add timeline
          await tx.bookingTimeline.create({
            data: {
              bookingId,
              status: 'PENDING',
              notes: `Technician assignment removed by Administrator. Status reset to PENDING.`,
            },
          });
        }
      }

      // 5. Save Internal Customer Notes
      if (notes !== undefined) {
        await tx.profile.update({
          where: { userId: booking.customerId },
          data: { notes },
        });
      }

      // 6. Generate/Update Invoice
      if (invoice) {
        const { tax, discount, totalAmount } = invoice;
        const taxVal = parseFloat(tax) || 0;
        const discVal = parseFloat(discount) || 0;
        const total = parseFloat(totalAmount) || 999.0;
        const invNum = 'INV-' + bookingId.substring(0, 8).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

        await tx.invoice.upsert({
          where: { bookingId },
          update: {
            amount: total - taxVal + discVal,
            tax: taxVal,
            discount: discVal,
            totalAmount: total,
            status: paymentStatus || booking.paymentStatus || 'UNPAID',
          },
          create: {
            bookingId,
            invoiceNumber: invNum,
            amount: total - taxVal + discVal,
            tax: taxVal,
            discount: discVal,
            totalAmount: total,
            status: paymentStatus || 'UNPAID',
          },
        });

        // Add timeline
        await tx.bookingTimeline.create({
          data: {
            bookingId,
            status: status || booking.status,
            notes: `Invoice ${invNum} generated for ₹${total}.`,
          },
        });
      }

      // 7. Add Job Image attachment
      if (body.jobImage) {
        const { url, type } = body.jobImage;
        await tx.jobImage.create({
          data: {
            bookingId,
            url,
            type: type || 'Inspection Image',
            uploadedBy: session.userId,
          },
        });
        
        await tx.bookingTimeline.create({
          data: {
            bookingId,
            status: status || booking.status,
            notes: `Attached service image: ${type || 'Inspection Image'}.`,
          },
        });
      }

      return true;
    });

    // Simulated Outbound Notification Dispatch
    try {
      if (status && booking.customer.encryptedPhone) {
        const { sendWhatsappMessage } = require('@/lib/whatsapp');
        const decryptedPhone = decrypt(booking.customer.encryptedPhone);
        
        let messageBody = '';
        if (status === 'CONFIRMED') {
          messageBody = `⚡ *RenewServ Update:* Your booking #${bookingId.substring(0, 8)} is CONFIRMED! Our technician will visit on ${scheduledDate || booking.scheduledDate}.`;
        } else if (status === 'ON_THE_WAY') {
          messageBody = `⚡ *RenewServ Update:* Our technician is ON THE WAY to your solar panels!`;
        } else if (status === 'ARRIVED') {
          messageBody = `⚡ *RenewServ Update:* Our technician has ARRIVED at your location. Starting inspection shortly.`;
        } else if (status === 'WORK_STARTED') {
          messageBody = `⚡ *RenewServ Update:* Solar panel cleaning has STARTED! Restoring peak panel efficiency.`;
        } else if (status === 'WORK_COMPLETED') {
          messageBody = `⚡ *RenewServ Update:* Work COMPLETED successfully! Thank you for choosing RenewServ.`;
        }

        if (messageBody) {
          await sendWhatsappMessage({
            to: decryptedPhone,
            body: messageBody,
            userId: booking.customerId,
          });
        }
      }
    } catch (err) {
      console.error('Failed to trigger simulated status WA webhook notification:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update booking admin error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
