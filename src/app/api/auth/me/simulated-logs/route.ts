import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const decryptedPhone = user.encryptedPhone ? decrypt(user.encryptedPhone) : '';
    const decryptedEmail = user.encryptedEmail ? decrypt(user.encryptedEmail) : '';

    const smsLogs = await prisma.smsLog.findMany({
      where: {
        to: {
          contains: decryptedPhone ? decryptedPhone.slice(-10) : 'IMPOSSIBLE_MATCH',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const emailLogs = await prisma.emailLog.findMany({
      where: {
        to: decryptedEmail || 'IMPOSSIBLE_MATCH',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      smsLogs,
      emailLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
