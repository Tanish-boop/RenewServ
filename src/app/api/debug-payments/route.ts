import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== 'tanishmigrate123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const diagnostics: any = {};

  try {
    // 1. Check DB Connection
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.dbConnected = true;
  } catch (err: any) {
    diagnostics.dbConnected = false;
    diagnostics.dbError = err.message;
    return NextResponse.json({ success: false, diagnostics }, { status: 500 });
  }

  try {
    // 2. Query booking table schema/count
    diagnostics.bookingsCount = await prisma.booking.count();
    diagnostics.latestBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        bookingFeePaid: true,
        createdAt: true,
      }
    });
  } catch (err: any) {
    diagnostics.bookingsError = err.message;
  }

  try {
    // 3. Query payment table schema/count
    diagnostics.paymentsCount = await prisma.payment.count();
    diagnostics.latestPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bookingId: true,
        amount: true,
        status: true,
        provider: true,
        utr: true,
        screenshotUrl: true,
        fraudScore: true,
        isFlagged: true,
        createdAt: true,
      }
    });
  } catch (err: any) {
    diagnostics.paymentsError = err.message;
  }

  try {
    // 4. Query fraud events count
    diagnostics.fraudEventsCount = await prisma.paymentFraudEvent.count();
    diagnostics.latestFraudEvents = await prisma.paymentFraudEvent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
  } catch (err: any) {
    diagnostics.fraudEventsError = err.message;
  }

  try {
    // 5. Test status value insertions or queries to check if Enum fields are synced
    // Querying enum values from PG system catalog
    const pgBookingStatuses = await prisma.$queryRawUnsafe(
      `SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'BookingStatus'`
    );
    diagnostics.pgBookingStatuses = pgBookingStatuses;

    const pgPaymentStatuses = await prisma.$queryRawUnsafe(
      `SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'PaymentStatus'`
    );
    diagnostics.pgPaymentStatuses = pgPaymentStatuses;
  } catch (err: any) {
    diagnostics.enumQueriesError = err.message;
  }

  return NextResponse.json({ success: true, diagnostics });
}
