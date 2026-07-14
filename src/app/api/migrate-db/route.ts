import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== 'tanishmigrate123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any[] = [];

  try {
    // 1. Alter enums
    // PostgreSQL ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block.
    // So we run them individually.
    const addEnumValues = [
      `ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING'`,
      `ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS'`,
      `ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_EXPIRED'`,
      `ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'UNDER_VERIFICATION'`,
      `ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'EXPIRED'`,
    ];

    for (const sql of addEnumValues) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push({ query: sql, status: 'SUCCESS' });
      } catch (err: any) {
        results.push({ query: sql, status: 'FAILED', error: err.message });
      }
    }

    // 2. Alter tables and create new table
    const tableQueries = [
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "utr" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "screenshotUrl" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "screenshotHash" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "screenshotPublicId" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "screenshotUploadedAt" TIMESTAMP(3)`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3)`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "fraudScore" INTEGER DEFAULT 0`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "isFlagged" BOOLEAN DEFAULT false`,
      `ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "notes" TEXT`,
      `CREATE TABLE IF NOT EXISTS "PaymentFraudEvent" (
        "id" TEXT NOT NULL,
        "bookingId" TEXT NOT NULL,
        "utr" TEXT,
        "screenshotHash" TEXT,
        "eventType" TEXT NOT NULL,
        "ipAddress" TEXT NOT NULL,
        "userAgent" TEXT NOT NULL,
        "details" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PaymentFraudEvent_pkey" PRIMARY KEY ("id")
      )`
    ];

    for (const sql of tableQueries) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push({ query: sql, status: 'SUCCESS' });
      } catch (err: any) {
        results.push({ query: sql, status: 'FAILED', error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, results }, { status: 500 });
  }
}
