import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, serviceInterested, notes } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        serviceInterested: serviceInterested || 'Solar Panel Cleaning',
        source: 'WEBSITE',
        status: 'NEW',
        notes: notes || 'Out of coverage area request',
      }
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err: any) {
    console.error('Create public lead error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit request' }, { status: 500 });
  }
}
