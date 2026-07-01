import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'TECHNICIAN' && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { action, gpsLatitude, gpsLongitude } = await req.json();

    if (!action || gpsLatitude === undefined || gpsLongitude === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Find technician profile
    const technician = await prisma.technician.findUnique({
      where: { userId: session.userId },
    });

    if (!technician) {
      return NextResponse.json({ error: 'Technician profile not found' }, { status: 404 });
    }

    const lat = parseFloat(gpsLatitude);
    const lng = parseFloat(gpsLongitude);

    if (action === 'CHECK_IN') {
      const attendance = await prisma.technicianAttendance.create({
        data: {
          technicianId: technician.id,
          checkIn: new Date(),
          gpsLatitude: lat,
          gpsLongitude: lng,
        },
      });

      await prisma.technician.update({
        where: { id: technician.id },
        data: { isAvailable: true },
      });

      return NextResponse.json({ success: true, attendanceId: attendance.id });
    } else if (action === 'CHECK_OUT') {
      // Find latest check-in that doesn't have check-out
      const latestAttendance = await prisma.technicianAttendance.findFirst({
        where: {
          technicianId: technician.id,
          checkOut: null,
        },
        orderBy: { checkIn: 'desc' },
      });

      if (latestAttendance) {
        await prisma.technicianAttendance.update({
          where: { id: latestAttendance.id },
          data: {
            checkOut: new Date(),
          },
        });
      } else {
        // Just create checkout log
        await prisma.technicianAttendance.create({
          data: {
            technicianId: technician.id,
            checkIn: new Date(), // fallback
            checkOut: new Date(),
            gpsLatitude: lat,
            gpsLongitude: lng,
          },
        });
      }

      await prisma.technician.update({
        where: { id: technician.id },
        data: { isAvailable: false },
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Technician attendance API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
