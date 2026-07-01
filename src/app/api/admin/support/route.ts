import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch support tickets with messages and customer info
    const tickets = await prisma.supportTicket.findMany({
      include: {
        customer: {
          include: { profile: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // 2. Fetch WhatsApp messages
    const whatsappMessages = await prisma.whatsappMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // 3. Fetch Email logs
    const emailLogs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // 4. Fetch SMS logs
    const smsLogs = await prisma.smsLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      tickets,
      whatsappMessages,
      emailLogs,
      smsLogs
    });
  } catch (err) {
    console.error('Fetch Support Error:', err);
    return NextResponse.json({ error: 'Failed to fetch support data' }, { status: 500 });
  }
}
