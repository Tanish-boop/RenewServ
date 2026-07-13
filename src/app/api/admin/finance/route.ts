import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch pending verification list
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'UNDER_VERIFICATION',
      },
      include: {
        booking: {
          include: {
            customer: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Fetch fraud events logs
    const fraudEvents = await prisma.paymentFraudEvent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // 3. Compute Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const successfulPayments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
      },
    });

    const refundedPayments = await prisma.payment.findMany({
      where: {
        status: 'REFUNDED',
      },
    });

    // Today's Payments
    const todayPayments = successfulPayments.filter((p) => (p.verifiedAt || p.createdAt) >= today);
    const todayRevenue = todayPayments.reduce((acc, p) => acc + p.amount, 0);

    // Monthly Revenue
    const monthlyPayments = successfulPayments.filter((p) => (p.verifiedAt || p.createdAt) >= firstDayOfMonth);
    const monthlyRevenue = monthlyPayments.reduce((acc, p) => acc + p.amount, 0);

    // Refunds
    const totalRefunds = refundedPayments.reduce((acc, p) => acc + p.amount, 0);

    // Method counts
    const methodCounts: Record<string, number> = {};
    successfulPayments.forEach((p) => {
      const provider = p.provider || 'UNKNOWN';
      methodCounts[provider] = (methodCounts[provider] || 0) + 1;
    });

    const topMethods = Object.entries(methodCounts).map(([method, count]) => ({
      method,
      count,
      percentage: Math.round((count / (successfulPayments.length || 1)) * 100),
    }));

    return NextResponse.json({
      pendingPayments,
      fraudEvents,
      stats: {
        todayRevenue,
        todayCount: todayPayments.length,
        pendingCount: pendingPayments.length,
        monthlyRevenue,
        totalRefunds,
        refundsCount: refundedPayments.length,
        topMethods,
      },
    });
  } catch (err: any) {
    console.error('Failed to load admin finance data:', err);
    return NextResponse.json({ error: 'Failed to load finance data' }, { status: 500 });
  }
}
