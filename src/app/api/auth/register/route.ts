import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { encrypt, makeBlindIndex, hashPassword } from '@/lib/crypto';
import { rateLimit } from '@/lib/rateLimit';
import { createSessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const limiter = rateLimit(`ip:${ip}:register`, 15, 15 * 60 * 1000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { name, email, phone, password, role } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Mobile number must be exactly 10 digits.' },
        { status: 400 }
      );
    }

    const emailIndex = makeBlindIndex(email);
    const phoneIndex = makeBlindIndex(cleanPhone);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ emailIndex }, { phoneIndex }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email or phone number is already registered.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const encryptedEmail = encrypt(email);
    const encryptedPhone = encrypt(cleanPhone);
    const assignedRole = 'CLIENT'; // Hardcoded per new security requirements

    const user = await prisma.$transaction(async (tx) => {
      // Seed cities & territories if empty
      const cityCount = await tx.city.count();
      if (cityCount === 0) {
        const pune = await tx.city.create({
          data: { name: 'Pune', state: 'Maharashtra', isActive: true },
        });
        const pcmc = await tx.city.create({
          data: { name: 'PCMC', state: 'Maharashtra', isActive: true },
        });

        await tx.territory.createMany({
          data: [
            { name: 'Kothrud', cityId: pune.id, postalCodes: '411038,411029,411052', isActive: true },
            { name: 'Aundh', cityId: pune.id, postalCodes: '411007,411067', isActive: true },
            { name: 'Hadapsar', cityId: pune.id, postalCodes: '411028,411013', isActive: true },
            { name: 'Wakad', cityId: pcmc.id, postalCodes: '411057', isActive: true },
            { name: 'Hinjawadi', cityId: pcmc.id, postalCodes: '411057,411033', isActive: true },
            { name: 'Pimple Saudagar', cityId: pcmc.id, postalCodes: '411027', isActive: true },
          ],
        });
      }

      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

      // Create user with profile and wallet (with initial ₹100 promo balance)
      const newUser = await tx.user.create({
        data: {
          encryptedEmail,
          emailIndex,
          encryptedPhone,
          phoneIndex,
          passwordHash,
          role: assignedRole,
          emailVerified: false,
          phoneVerified: true,
          profile: {
            create: {
              name,
            },
          },
          wallets: {
            create: {
              balance: 100.0,
              promoBalance: 100.0,
            },
          },
        },
      });

      // Hash and store OTPs in new models
      const emailOtpHash = await hashPassword(verificationToken);

      await tx.emailVerificationOtp.create({
        data: {
          email,
          otpHash: emailOtpHash,
          expiresAt: tenMinutesFromNow,
        }
      });

      return { newUser, verificationToken };
    });

    // Dispatch verification email in background
    try {
      const { sendVerificationEmail } = require('@/lib/mailer');
      await sendVerificationEmail(email, user.verificationToken);
    } catch (mailErr) {
      console.error('Failed to trigger verification email:', mailErr);
    }

    const token = await createSessionToken({ 
      userId: user.newUser.id, 
      role: user.newUser.role,
      emailVerified: false,
      phoneVerified: true
    });

    const response = NextResponse.json({
      success: true,
      userId: user.newUser.id,
      role: user.newUser.role,
    });

    response.cookies.set({
      name: 'greenorbitenergy_session',
      value: token,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60, // 2 hours
    });

    return response;
  } catch (err: any) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
