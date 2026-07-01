import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { encrypt, decrypt, makeBlindIndex, hashPassword } from '@/lib/crypto';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const technicians = await prisma.technician.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        territory: true,
        attendance: {
          orderBy: { checkIn: 'desc' },
          take: 1,
        },
        assignments: {
          include: {
            booking: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get today's date in IST (YYYY-MM-DD)
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayIST = `${year}-${month}-${day}`;

    const decryptedTechs = technicians.map((t: any) => {
      const email = t.user?.encryptedEmail ? decrypt(t.user.encryptedEmail) : '';
      const phone = t.user?.encryptedPhone ? decrypt(t.user.encryptedPhone) : '';
      
      const jobsToday = t.assignments.filter(
        (a: any) => a.booking?.scheduledDate === todayIST
      ).length;
      
      const completedJobs = t.assignments.filter(
        (a: any) => a.booking?.status === 'COMPLETED'
      ).length;

      return {
        id: t.id,
        employeeId: t.employeeId,
        name: t.user?.profile?.name || 'Technician',
        email,
        phone,
        territoryId: t.territoryId,
        territoryName: t.territory?.name || 'Unknown',
        isAvailable: t.isAvailable,
        rating: t.rating,
        lastCheckIn: t.attendance[0]?.checkIn || null,
        lastCheckOut: t.attendance[0]?.checkOut || null,
        lastGps: t.attendance[0] ? `${t.attendance[0].gpsLatitude}, ${t.attendance[0].gpsLongitude}` : null,
        jobsToday,
        completedJobs,
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json(decryptedTechs);
  } catch (err: any) {
    console.error('Fetch Technicians Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only Owners can create Technicians.' }, { status: 403 });
    }

    const { name, email, phone, territoryId } = await req.json();

    if (!name || !email || !phone || !territoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const emailIndex = makeBlindIndex(email);
    const phoneIndex = makeBlindIndex(cleanPhone);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ emailIndex }, { phoneIndex }],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or phone already exists' }, { status: 400 });
    }

    const encryptedEmail = encrypt(email);
    const encryptedPhone = encrypt(cleanPhone);
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(tempPassword);

    const newTechnician = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          encryptedEmail,
          emailIndex,
          encryptedPhone,
          phoneIndex,
          passwordHash,
          role: 'TECHNICIAN',
          emailVerified: true,
          phoneVerified: true,
          profile: {
            create: { name },
          },
          wallets: {
            create: { balance: 0 },
          },
        },
      });

      const employeeId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      
      await tx.technician.create({
        data: {
          userId: user.id,
          employeeId,
          territoryId,
          isAvailable: true,
        },
      });

      return user;
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATED_TECHNICIAN',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
        details: `Created technician: ${newTechnician.id}`,
      }
    });

    return NextResponse.json({ 
      success: true, 
      technicianId: newTechnician.id, 
      tempPassword 
    });

  } catch (err: any) {
    console.error('Create Technician Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { technicianId, isAvailable, disabled } = await req.json();

    if (!technicianId) {
      return NextResponse.json({ error: 'Missing technicianId' }, { status: 400 });
    }

    const data: any = {};
    if (isAvailable !== undefined) {
      data.isAvailable = isAvailable;
    }
    if (disabled !== undefined) {
      data.deletedAt = disabled ? new Date() : null;
    }

    const updatedTech = await prisma.technician.update({
      where: { id: technicianId },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: disabled ? 'DISABLED_TECHNICIAN' : 'UPDATED_TECHNICIAN_AVAILABILITY',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
        details: JSON.stringify({ technicianId, isAvailable, disabled }),
      }
    });

    return NextResponse.json({ success: true, technician: updatedTech });
  } catch (err: any) {
    console.error('Update Technician Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
