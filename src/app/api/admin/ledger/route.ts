import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAuthorized = ['ROOT_OWNER', 'OWNER'].includes(session.role);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 1. Fetch all ledger transactions
    const ledger = await prisma.ledger.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // 2. Compute balances dynamically for each account
    const accounts = [
      'CUSTOMER_WALLET',
      'RENEWSERV_ESCROW',
      'RENEWSERV_REVENUE',
      'RAZORPAY_GATEWAY',
      'REFERRAL_POOL',
    ];

    const balances: Record<string, number> = {};
    for (const acc of accounts) {
      // Inflow
      const inflow = await prisma.ledger.aggregate({
        where: { destinationAccount: acc as any },
        _sum: { amount: true },
      });

      // Outflow
      const outflow = await prisma.ledger.aggregate({
        where: { sourceAccount: acc as any },
        _sum: { amount: true },
      });

      const totalIn = inflow._sum.amount || 0;
      const totalOut = outflow._sum.amount || 0;

      // For Gateway, cash flows are outgoing to Escrow/Wallet.
      // Net balance is basically In - Out.
      balances[acc] = Math.round((totalIn - totalOut) * 100) / 100;
    }

    return NextResponse.json({
      ledger,
      balances,
    });
  } catch (err: any) {
    console.error('Ledger API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
