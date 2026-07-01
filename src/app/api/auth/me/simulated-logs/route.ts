import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  let decryptedPhone = '';
  let decryptedEmail = '';

  const session = await getSession();
  if (session) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (user) {
        decryptedPhone = user.encryptedPhone ? decrypt(user.encryptedPhone) : '';
        decryptedEmail = user.encryptedEmail ? decrypt(user.encryptedEmail) : '';
      }
    } catch (dbErr) {
      console.error('Failed to load user for logs:', dbErr);
    }
  } else {
    // If not logged in, allow loading logs for an email if running in mock/development mode
    const emailParam = req.nextUrl.searchParams.get('email');
    const isMockMode = !process.env.SMTP_HOST;
    if (emailParam && isMockMode) {
      try {
        const { makeBlindIndex } = require('@/lib/crypto');
        const emailIndex = makeBlindIndex(emailParam.trim().toLowerCase());
        const user = await prisma.user.findFirst({
          where: { emailIndex, deletedAt: null }
        });
        if (user) {
          decryptedPhone = user.encryptedPhone ? decrypt(user.encryptedPhone) : '';
          decryptedEmail = user.encryptedEmail ? decrypt(user.encryptedEmail) : '';
        }
      } catch (lookupErr) {
        console.error('Failed to look up unauthenticated user logs:', lookupErr);
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {

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
