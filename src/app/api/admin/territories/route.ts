import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const territories = await prisma.territory.findMany({
      where: { isActive: true },
      include: { city: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(territories);
  } catch (err) {
    console.error('Fetch territories error:', err);
    return NextResponse.json({ error: 'Failed to fetch territories' }, { status: 500 });
  }
}
