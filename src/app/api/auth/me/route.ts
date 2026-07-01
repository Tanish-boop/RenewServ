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
