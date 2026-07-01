import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { makeBlindIndex } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  try {
    const targetEmail = 'tanish.thakare2005@gmail.com';
    const computedIndex = makeBlindIndex(targetEmail);
    
    // Check database
    const user = await prisma.user.findFirst({
      where: { emailIndex: computedIndex }
    });

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        emailIndex: true
      }
    });

    return NextResponse.json({
      envEncryptionKeyExists: !!process.env.ENCRYPTION_KEY,
      envBlindIndexKeyExists: !!process.env.BLIND_INDEX_KEY,
      computedIndexForTarget: computedIndex,
      targetUserFound: !!user,
      allUsersInDb: allUsers
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
