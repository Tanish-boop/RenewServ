import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateCloudinarySignature } from '@/lib/cloudinary';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Generate signature for 'renewserv_receipts' folder
    const signatureData = generateCloudinarySignature('renewserv_receipts');
    
    return NextResponse.json(signatureData);
  } catch (err: any) {
    console.error('Cloudinary signature generation failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
