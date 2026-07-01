import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { makeBlindIndex, hashPassword } from '@/lib/crypto';
import { sendPasswordResetEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const emailIndex = makeBlindIndex(email.trim().toLowerCase());
    const user = await prisma.user.findFirst({
      where: { emailIndex, deletedAt: null }
    });

    if (user) {
      // Generate 6 digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await hashPassword(otpCode);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      await prisma.passwordResetOtp.create({
        data: {
          email: email.trim().toLowerCase(),
          otpHash,
          expiresAt
        }
      });

      // Dispatch Email
      try {
        await sendPasswordResetEmail(email.trim().toLowerCase(), otpCode);
      } catch (mailErr) {
        console.error('Failed to send password reset email:', mailErr);
      }
    }

    // Generic success message for security (don't reveal user existence)
    return NextResponse.json({
      success: true,
      message: 'If the email exists in our system, a password reset code has been sent.'
    });

  } catch (err: any) {
    console.error('Forgot password API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
