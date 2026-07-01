import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { encrypt, decrypt, makeBlindIndex, hashPassword } from '@/lib/crypto';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const owners = await prisma.user.findMany({
      where: {
        role: { in: ['OWNER', 'ROOT_OWNER'] },
        deletedAt: null,
      },
      include: {
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const decryptedOwners = owners.map((o: any) => ({
      id: o.id,
      email: o.encryptedEmail ? decrypt(o.encryptedEmail) : '',
      phone: o.encryptedPhone ? decrypt(o.encryptedPhone) : '',
      role: o.role,
      name: o.profile?.name || 'Owner',
      createdAt: o.createdAt,
    }));

    return NextResponse.json(decryptedOwners);
  } catch (err: any) {
    console.error('Fetch Owners Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ROOT_OWNER') {
      return NextResponse.json({ error: 'Unauthorized. Only Root Owner can create Owners.' }, { status: 403 });
    }

    const { name, email, phone } = await req.json();

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const emailIndex = makeBlindIndex(email);
    const phoneIndex = makeBlindIndex(cleanPhone);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ emailIndex }, { phoneIndex }],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or phone already exists' }, { status: 400 });
    }

    const encryptedEmail = encrypt(email);
    const encryptedPhone = encrypt(cleanPhone);
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(tempPassword);

    const newOwner = await prisma.user.create({
      data: {
        encryptedEmail,
        emailIndex,
        encryptedPhone,
        phoneIndex,
        passwordHash,
        role: 'OWNER',
        emailVerified: true,
        phoneVerified: true,
        profile: {
          create: { name },
        },
        wallets: {
          create: { balance: 0 },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATED_OWNER',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
        details: `Created owner: ${newOwner.id}`,
      }
    });

    return NextResponse.json({ 
      success: true, 
      ownerId: newOwner.id, 
      tempPassword 
    });

  } catch (err: any) {
    console.error('Create Owner Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ROOT_OWNER') {
      return NextResponse.json({ error: 'Unauthorized. Only Root Owner can delete/suspend Owners.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing owner ID' }, { status: 400 });
    }

    // Don't let root owner delete themselves
    if (id === session.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // We can soft delete the user
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETED_OWNER',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
        details: `Suspended/Deleted owner: ${id}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete Owner Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
