import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { makeBlindIndex, hashPassword, verifyPassword } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, otpCode, newPassword } = await req.json();
    if (!email || !otpCode || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const emailIndex = makeBlindIndex(email.trim().toLowerCase());
    const user = await prisma.user.findFirst({
      where: { emailIndex, deletedAt: null }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid request or user not found.' }, { status: 400 });
    }

    const otpRecords = await prisma.passwordResetOtp.findMany({
      where: { email: email.trim().toLowerCase() },
      orderBy: { createdAt: 'desc' }
    });

    let isValid = false;
    let matchingRecord = null;

    for (const record of otpRecords) {
      if (record.expiresAt < new Date()) continue;
      if (record.attempts >= 5) continue;

      const isMatch = await verifyPassword(otpCode, record.otpHash);
      if (isMatch) {
        isValid = true;
        matchingRecord = record;
        break;
      } else {
        await prisma.passwordResetOtp.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } }
        });
      }
    }

    if (!isValid || !matchingRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP code.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      }),
      prisma.passwordResetOtp.deleteMany({
        where: { email: email.trim().toLowerCase() }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now log in.'
    });

  } catch (err: any) {
    console.error('Reset password API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
