import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { notificationPref, whatsappOptIn, whatsappNumber } = await req.json();
    const updateData: any = {};

    if (notificationPref !== undefined) {
      if (!['ALL', 'SMS', 'EMAIL', 'WHATSAPP'].includes(notificationPref)) {
        return NextResponse.json({ error: 'Invalid notification preference' }, { status: 400 });
      }
      updateData.notificationPref = notificationPref;
    }

    if (whatsappOptIn !== undefined) {
      updateData.whatsappOptIn = !!whatsappOptIn;
    }

    if (whatsappNumber !== undefined) {
      const cleanWaNum = whatsappNumber.replace(/\D/g, '');
      if (cleanWaNum !== '' && cleanWaNum.length !== 10) {
        return NextResponse.json({ error: 'WhatsApp number must be exactly 10 digits.' }, { status: 400 });
      }
      updateData.whatsappNumber = cleanWaNum || null;
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    // Log the configuration change
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'NOTIFICATION_PREFERENCE_UPDATED',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'Unknown',
        details: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ success: true, message: 'Preferences updated successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update preferences' }, { status: 500 });
  }
}
