import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
        wallets: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const email = user.encryptedEmail ? decrypt(user.encryptedEmail) : '';
    const phone = user.encryptedPhone ? decrypt(user.encryptedPhone) : '';

    return NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        name: user.profile?.name || 'User',
        email,
        phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        whatsappVerified: user.whatsappVerified,
        whatsappOptIn: user.whatsappOptIn,
        whatsappNumber: user.whatsappNumber,
        notificationPref: user.notificationPref,
        wallet: user.wallets
          ? {
              balance: user.wallets.balance,
              promoBalance: user.wallets.promoBalance,
              refundBalance: user.wallets.refundBalance,
              referralBalance: user.wallets.referralBalance,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('Session details fetch failed:', err);
    return NextResponse.json({ user: null });
  }
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, phone } = await req.json();
    const updateData: any = {};

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
      }
    }

    if (phone !== undefined) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ error: 'Mobile number must be exactly 10 digits.' }, { status: 400 });
      }
      
      const { encrypt, makeBlindIndex } = require('@/lib/crypto');
      const phoneIndex = makeBlindIndex(cleanPhone);

      // Check if another user has this phone number
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneIndex,
          NOT: { id: session.userId }
        }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'This phone number is already registered by another account.' }, { status: 400 });
      }

      updateData.encryptedPhone = encrypt(cleanPhone);
      updateData.phoneIndex = phoneIndex;
    }

    await prisma.$transaction(async (tx) => {
      if (name !== undefined) {
        await tx.profile.update({
          where: { userId: session.userId },
          data: { name: name.trim() }
        });
      }

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: session.userId },
          data: updateData
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Profile updated successfully!' });
  } catch (err: any) {
    console.error('Update profile API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
