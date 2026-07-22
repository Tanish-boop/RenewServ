import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, decrypt } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  // GET verification with just a token is deprecated as OTPs are now hashed.
  // Users must use the POST method via the UI to submit their OTP.
  return new NextResponse(
    `<html>
      <head><title>Invalid Request</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; text-align: center;">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 400px; width: 100%;">
          <div style="color: #ef4444; font-size: 48px; margin-bottom: 16px;">❌</div>
          <h2 style="margin-top: 0; font-weight: 800;">Please verify via Dashboard</h2>
          <p style="color: #64748b; font-size: 14px;">Direct link verification is no longer supported for security reasons. Please enter the 6-digit code in your dashboard.</p>
          <a href="/dashboard" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Go to Dashboard</a>
        </div>
      </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

export async function POST(req: NextRequest) {
  const { getSession } = require('@/lib/auth');
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { otpCode } = await req.json();
    if (!otpCode || otpCode.length !== 6) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit OTP code.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email already verified!' });
    }

    const decryptedEmail = user.encryptedEmail ? decrypt(user.encryptedEmail) : '';
    if (!decryptedEmail) {
      return NextResponse.json({ error: 'No email found for user.' }, { status: 400 });
    }

    const otpRecords = await prisma.emailVerificationOtp.findMany({
      where: { email: decryptedEmail },
      orderBy: { createdAt: 'desc' }
    });

    let isValid = false;
    for (const record of otpRecords) {
      if (record.expiresAt < new Date()) continue;
      if (await verifyPassword(otpCode, record.otpHash)) {
        isValid = true;
        // Clean up OTPs for this email after successful verification
        await prisma.emailVerificationOtp.deleteMany({ where: { email: decryptedEmail } });
        break;
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired email OTP code. Please try again.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    const { createSessionToken } = require('@/lib/auth');
    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      emailVerified: true,
      phoneVerified: user.phoneVerified,
    });

    const response = NextResponse.json({ success: true, message: 'Email verified successfully!' });
    response.cookies.set({
      name: 'greenorbitenergy_session',
      value: token,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
