import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decrypt, hashPassword } from '@/lib/crypto';
import { sendVerificationEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified.' });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const decryptedEmail = user.encryptedEmail ? decrypt(user.encryptedEmail) : '';

    if (!decryptedEmail) {
      return NextResponse.json({ error: 'No email address registered for this account.' }, { status: 400 });
    }

    const otpHash = await hashPassword(token);

    await prisma.emailVerificationOtp.create({
      data: {
        email: decryptedEmail,
        otpHash: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    await sendVerificationEmail(decryptedEmail, token);

    return NextResponse.json({ success: true, message: 'Verification email resent successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to resend verification email' }, { status: 500 });
  }
}
