import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, notes, avatarUrl } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATED_CUSTOMER_NOTES',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
        details: `Updated notes for customer user: ${userId}`
      }
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error('Update Customer Notes Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
