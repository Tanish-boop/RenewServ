import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET tickets list
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let tickets;
    if (session.role === 'CLIENT') {
      tickets = await prisma.supportTicket.findMany({
        where: { customerId: session.userId },
        include: {
          messages: true,
          booking: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      tickets = await prisma.supportTicket.findMany({
        include: {
          messages: true,
          booking: true,
          customer: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }
    return NextResponse.json(tickets);
  } catch (err: any) {
    console.error('Fetch tickets error:', err);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

// POST create ticket or message
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { category, subject, message, ticketId } = await req.json();

    if (ticketId) {
      // Adding a message to an existing ticket
      if (!message) {
        return NextResponse.json({ error: 'Message body cannot be empty' }, { status: 400 });
      }

      const ticketMessage = await prisma.$transaction(async (tx) => {
        const msg = await tx.ticketMessage.create({
          data: {
            ticketId,
            senderId: session.userId,
            message,
          },
        });

        // Update ticket updatedAt timestamp
        await tx.supportTicket.update({
          where: { id: ticketId },
          data: { updatedAt: new Date() },
        });

        return msg;
      });

      return NextResponse.json({ success: true, message: ticketMessage });
    } else {
      // Creating a new ticket
      if (!category || !subject || !message) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          customerId: session.userId,
          category,
          subject,
          status: 'OPEN',
          priority: 'MEDIUM',
          messages: {
            create: {
              senderId: session.userId,
              message,
            },
          },
        },
        include: {
          messages: true,
        },
      });

      return NextResponse.json({ success: true, ticket });
    }
  } catch (err: any) {
    console.error('Ticket API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
