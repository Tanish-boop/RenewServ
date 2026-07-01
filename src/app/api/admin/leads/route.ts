import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(leads);
  } catch (err) {
    console.error('Fetch leads error:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, serviceInterested, source, status, notes, followUpDate, assignedOwner } = body;

    if (!name || !serviceInterested) {
      return NextResponse.json({ error: 'Name and interested service are required' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        serviceInterested,
        source: source || 'WEBSITE',
        status: status || 'NEW',
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        assignedOwner,
      }
    });

    return NextResponse.json({ success: true, lead });
  } catch (err) {
    console.error('Create lead error:', err);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, phone, serviceInterested, source, status, notes, followUpDate, assignedOwner } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        serviceInterested,
        source,
        status,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        assignedOwner,
      }
    });

    return NextResponse.json({ success: true, lead });
  } catch (err) {
    console.error('Update lead error:', err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    await prisma.lead.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete lead error:', err);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
