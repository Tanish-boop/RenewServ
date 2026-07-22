import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decrypt, encrypt, getBlindIndex } from '@/lib/crypto';
import { sendOtpSms } from '@/lib/sms';
import redis from '@/lib/redis';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Resolve target phone number
    let rawPhone = body.phone || (user.encryptedPhone ? decrypt(user.encryptedPhone) : '');
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Mobile number must be exactly 10 digits.' }, { status: 400 });
    }

    const phoneIndex = getBlindIndex(cleanPhone);

    if (action === 'SEND_OTP') {
      // 1. Cooldown & Spam Protection
      const otpLimitKey = `otp_cooldown:${phoneIndex}`;
      const requestCountKey = `otp_requests:${phoneIndex}`;

      // Check per-minute cooldown
      const hasCooldown = await redis.get(otpLimitKey);
      if (hasCooldown) {
        return NextResponse.json({ error: 'Please wait 60 seconds before requesting another OTP.' }, { status: 429 });
      }

      // Check request volume limits (max 3 requests in 15 mins)
      let otpReqs = await prisma.otpRequest.findUnique({
        where: { phoneIndex },
      });

      const now = Date.now();
      if (otpReqs) {
        const timeSinceLast = now - new Date(otpReqs.lastAttemptAt).getTime();
        
        if (timeSinceLast < 15 * 60 * 1000 && otpReqs.attemptCount >= 3) {
          return NextResponse.json({ 
            error: 'Too many OTP requests. Verification locked for 15 minutes to prevent spam.' 
          }, { status: 429 });
        }

        // Reset cooldown count if last attempt was > 15 mins ago
        if (timeSinceLast >= 15 * 60 * 1000) {
          otpReqs = await prisma.otpRequest.update({
            where: { phoneIndex },
            data: { attemptCount: 1, lastAttemptAt: new Date() },
          });
        } else {
          otpReqs = await prisma.otpRequest.update({
            where: { phoneIndex },
            data: { attemptCount: otpReqs.attemptCount + 1, lastAttemptAt: new Date() },
          });
        }
      } else {
        otpReqs = await prisma.otpRequest.create({
          data: { phoneIndex, attemptCount: 1, lastAttemptAt: new Date() },
        });
      }

      // 2. Generate 6-Digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      // Save encrypted fields to user (if updated, encrypt phone as well)
      const updateData: any = {};
      if (body.phone) {
        updateData.encryptedPhone = encrypt(cleanPhone);
        updateData.phoneIndex = phoneIndex;
        
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }

      // Hash and store OTP
      const { hashPassword } = require('@/lib/crypto');
      const otpHash = await hashPassword(code);
      await prisma.phoneVerificationOtp.create({
        data: {
          phone: cleanPhone,
          otpHash,
          expiresAt,
        }
      });

      // Set redis lockouts
      await redis.set(otpLimitKey, '1', 60);

      // 3. Send SMS
      await sendOtpSms(cleanPhone, code);

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PHONE_OTP_SENT',
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Unknown',
          details: `OTP dispatched to registered phone number ending in ${cleanPhone.slice(-4)}`,
        },
      });

      return NextResponse.json({ success: true, message: 'OTP sent successfully!' });
    }

    if (action === 'VERIFY_OTP') {
      const { otpCode } = body;
      if (!otpCode || otpCode.length !== 6) {
        return NextResponse.json({ error: 'Please enter a valid 6-digit OTP code.' }, { status: 400 });
      }

      const lockoutKey = `otp_lockout:${user.id}`;
      const failCountStr = await redis.get(lockoutKey);
      const failCount = failCountStr ? parseInt(failCountStr) : 0;

      if (failCount >= 5) {
        return NextResponse.json({ 
          error: 'Too many failed attempts. Verification locked for 15 minutes.' 
        }, { status: 429 });
      }

      const otpRecords = await prisma.phoneVerificationOtp.findMany({
        where: { phone: cleanPhone },
        orderBy: { createdAt: 'desc' }
      });

      if (otpRecords.length === 0) {
        return NextResponse.json({ error: 'No active OTP found. Please request a new code.' }, { status: 400 });
      }

      const { verifyPassword } = require('@/lib/crypto');
      let isValid = false;
      for (const record of otpRecords) {
        if (record.expiresAt < new Date()) continue;
        if (await verifyPassword(otpCode, record.otpHash)) {
          isValid = true;
          await prisma.phoneVerificationOtp.deleteMany({ where: { phone: cleanPhone } });
          break;
        }
      }

      if (!isValid) {
        const newFailCount = failCount + 1;
        await redis.set(lockoutKey, newFailCount.toString(), 15 * 60); // 15 mins block
        
        return NextResponse.json({ 
          error: `Incorrect OTP. ${5 - newFailCount} attempts remaining before temporary lockout.` 
        }, { status: 400 });
      }

      // Successful verification
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });

      // Cleanup rate limits
      await redis.del(lockoutKey);
      try {
        await prisma.otpRequest.delete({ where: { phoneIndex } });
      } catch (e) {}

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PHONE_VERIFIED',
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Unknown',
          details: `Phone verified successfully for number ending in ${cleanPhone.slice(-4)}`,
        },
      });

      const { createSessionToken } = require('@/lib/auth');
      const token = await createSessionToken({
        userId: user.id,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: true,
      });

      const response = NextResponse.json({ success: true, message: 'Mobile number verified successfully!' });
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
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    console.error('Phone verification API error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
