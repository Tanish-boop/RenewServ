import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';

// GET bookings list based on role
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let bookings;

    if (session.role === 'CLIENT') {
      bookings = await prisma.booking.findMany({
        where: { customerId: session.userId },
        include: {
          address: true,
          customer: {
            include: {
              profile: true,
            },
          },
          quote: true,
          review: true,
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
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (session.role === 'TECHNICIAN') {
      const technician = await prisma.technician.findUnique({
        where: { userId: session.userId },
      });

      if (!technician) {
        return NextResponse.json({ error: 'Technician profile not found' }, { status: 404 });
      }

      bookings = await prisma.booking.findMany({
        where: {
          technicianAssignments: {
            some: {
              technicianId: technician.id,
            },
          },
        },
        include: {
          address: true,
          customer: {
            include: {
              profile: true,
            },
          },
          quote: true,
          inspectionReport: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Admins get everything
      bookings = await prisma.booking.findMany({
        include: {
          address: true,
          customer: {
            include: {
              profile: true,
            },
          },
          quote: true,
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
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Map over bookings and decrypt address/customer fields
    const decryptedBookings = bookings.map((b: any) => {
      const decryptedAddress = b.address ? {
        ...b.address,
        addressLine: b.address.encryptedAddress ? decrypt(b.address.encryptedAddress) : '',
        gpsCoords: b.address.encryptedGps ? decrypt(b.address.encryptedGps) : '',
      } : null;
      
      const decryptedCustomer = b.customer ? {
        ...b.customer,
        email: b.customer.encryptedEmail ? decrypt(b.customer.encryptedEmail) : '',
        phone: b.customer.encryptedPhone ? decrypt(b.customer.encryptedPhone) : '',
      } : null;

      return {
        ...b,
        address: decryptedAddress,
        customer: decryptedCustomer,
      };
    });

    return NextResponse.json(decryptedBookings);
  } catch (err: any) {
    console.error('Fetch bookings error:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST create booking
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.emailVerified || !user.phoneVerified) {
      return NextResponse.json(
        { error: 'Your account is not service-verified yet. Please verify your email and mobile number to place bookings.' },
        { status: 403 }
      );
    }

    const {
      serviceType,
      scheduledDate,
      scheduledTime,
      addressLabel,
      addressLine,
      postalCode,
      gpsCoords,
      isEmergency,
    } = await req.json();

    if (!serviceType || !scheduledDate || !scheduledTime || !addressLine || !postalCode) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Verify coverage area by postal code
    const trimmedPin = postalCode.trim();
    const isPunePin = ['411', '412', '410'].some(prefix => trimmedPin.startsWith(prefix)) && trimmedPin.length === 6;

    if (!isPunePin) {
      return NextResponse.json(
        { error: 'Sorry, we do not service this area yet. Only Pune + surrounding Pune areas (starting with 411, 412, 410) are eligible.' },
        { status: 400 }
      );
    }

    // Find if we have an explicit territory, otherwise fall back to first active territory
    let territory = await prisma.territory.findFirst({
      where: {
        postalCodes: {
          contains: trimmedPin,
        },
        isActive: true,
      },
    });

    if (!territory) {
      territory = await prisma.territory.findFirst({
        where: { isActive: true }
      });
    }

    if (!territory) {
      return NextResponse.json(
        { error: 'No active service territories configured on the server. Please contact support.' },
        { status: 500 }
      );
    }

    // 2. Encrypt address and GPS coordinates
    const encryptedAddress = encrypt(addressLine);
    const encryptedGps = gpsCoords ? encrypt(gpsCoords) : null;

    // 3. Create Booking with transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create Address
      const address = await tx.address.create({
        data: {
          userId: session.userId,
          label: addressLabel || 'Home',
          encryptedAddress,
          postalCode,
          encryptedGps,
        },
      });

      // Create Booking
      const newBooking = await tx.booking.create({
        data: {
          customerId: session.userId,
          addressId: address.id,
          serviceType,
          scheduledDate,
          scheduledTime,
          status: 'PENDING',
          isEmergency: !!isEmergency,
          bookingFeePaid: true, // Simulated paid during booking stepper
        },
      });

      // Generate random transaction ID
      const transactionId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
      const idempotencyKey = 'IDEM-' + newBooking.id + '-booking-fee';

      // Record simulated payment
      const payment = await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          amount: 99.0,
          type: 'BOOKING_FEE',
          status: 'SUCCESS',
          transactionId,
          idempotencyKey,
        },
      });

      // Double-entry ledger audit
      await tx.ledger.create({
        data: {
          sourceAccount: 'RAZORPAY_GATEWAY',
          destinationAccount: 'RENEWSERV_ESCROW',
          amount: 99.0,
          referenceId: payment.id,
          description: `Booking Fee of ₹99 for Booking ID: ${newBooking.id}`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'BOOKING_CREATED',
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'unknown',
          details: JSON.stringify({ bookingId: newBooking.id, amount: 99.0 }),
        },
      });

      // 4. Automated Technician Dispatching
      // Find a technician in this territory
      let tech = await tx.technician.findFirst({
        where: {
          territoryId: territory.id,
          isAvailable: true,
        },
      });

      // Fallback: any available technician if none found in territory
      if (!tech) {
        tech = await tx.technician.findFirst({
          where: { isAvailable: true },
        });
      }

      if (tech) {
        // Create technician assignment
        await tx.technicianAssignment.create({
          data: {
            bookingId: newBooking.id,
            technicianId: tech.id,
            status: 'ASSIGNED',
          },
        });

        // Update booking status to ASSIGNED
        return await tx.booking.update({
          where: { id: newBooking.id },
          data: { status: 'ASSIGNED' },
        });
      }

      return newBooking;
    });

    // Outbound WhatsApp notifications
    try {
      const { decrypt } = require('@/lib/crypto');
      const { sendBookingConfirmedWA, sendTechnicianAssignedWA } = require('@/lib/whatsapp');
      
      const customerPhone = decrypt(user.encryptedPhone);
      
      await sendBookingConfirmedWA(customerPhone, user.id, booking.id);
      
      if (booking.status === 'ASSIGNED') {
        const assignment = await prisma.technicianAssignment.findFirst({
          where: { bookingId: booking.id },
          include: {
            technician: {
              include: { user: { include: { profile: true } } }
            }
          }
        });
        
        if (assignment) {
          const techName = assignment.technician.user.profile?.name || 'Technician';
          const rating = assignment.technician.rating || 5.0;
          await sendTechnicianAssignedWA(customerPhone, user.id, booking.id, techName, rating);
        }
      }
    } catch (waErr) {
      console.error('Failed to send WhatsApp booking notification:', waErr);
    }

    return NextResponse.json({ success: true, bookingId: booking.id, status: booking.status });
  } catch (err: any) {
    console.error('Create booking API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
