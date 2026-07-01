import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { makeBlindIndex, verifyPassword } from '@/lib/crypto';
import { createSessionToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const limiter = rateLimit(`ip:${ip}:login`, 10, 15 * 60 * 1000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Please enter both your email/phone and password.' },
        { status: 400 }
      );
    }

    let cleanedIdentifier = identifier.trim();
    if (!cleanedIdentifier.includes('@')) {
      const digits = cleanedIdentifier.replace(/\D/g, '');
      if (digits.length !== 10) {
        return NextResponse.json(
          { error: 'Mobile number must be exactly 10 digits.' },
          { status: 400 }
        );
      }
      cleanedIdentifier = digits;
    }

    const index = makeBlindIndex(cleanedIdentifier);

    // Find the user by email index or phone index
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ emailIndex: index }, { phoneIndex: index }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'This identifier is not registered. Please register first.' },
        { status: 401 }
      );
    }

    // Check account locking
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        { error: `Account is temporarily locked. Try again in ${minutesLeft} minutes.` },
        { status: 403 }
      );
    }

    // Verify Password
    const isValid = await verifyPassword(password, user.passwordHash || '');

    if (!isValid) {
      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;
      let errorMsg = 'Password wrong, try again.';

      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins lock per requirements
        errorMsg = 'Too many failed login attempts. Your account has been locked for 30 minutes.';
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts >= 5 ? 0 : newAttempts,
          lockedUntil,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          ipAddress: ip,
          userAgent: req.headers.get('user-agent') || 'unknown',
          details: JSON.stringify({ attempts: newAttempts, locked: !!lockedUntil }),
        },
      });

      // FailedLogin Log for tracking
      await prisma.failedLogin.upsert({
        where: { loginIdentifier: cleanedIdentifier },
        update: { attemptCount: { increment: 1 }, lastAttemptAt: new Date() },
        create: { loginIdentifier: cleanedIdentifier, attemptCount: 1, lastAttemptAt: new Date() },
      });

      return NextResponse.json({ error: errorMsg }, { status: 401 });
    }

    // Reset lock counters on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Create session token (JWT Access Token)
    const token = await createSessionToken({ userId: user.id, role: user.role });
    
    // Create Refresh Token / DB Session (Valid for 7 days)
    const crypto = require('crypto');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: refreshToken,
        deviceInfo: req.headers.get('user-agent') || 'unknown',
        ipAddress: ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      role: user.role,
      userId: user.id,
    });

    // Access Token Cookie (15 mins as requested)
    response.cookies.set({
      name: 'renewserv_session',
      value: token,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
    });

    // Refresh Token Cookie (7 days)
    response.cookies.set({
      name: 'renewserv_refresh',
      value: refreshToken,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        details: JSON.stringify({ role: user.role }),
      },
    });

    // Security Event Log
    await prisma.securityEvent.create({
      data: {
        severity: 'LOW',
        type: 'LOGIN',
        details: `User ${user.id} logged in from IP ${ip}`,
        ipAddress: ip,
      }
    });

    return response;
  } catch (err: any) {
    console.error('Login API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('renewserv_session');
  return response;
}
