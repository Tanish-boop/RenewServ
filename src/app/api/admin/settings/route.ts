import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'settings.json');

const DEFAULT_SETTINGS = {
  companyName: 'RenewServ Solar Solutions',
  gstNumber: '27AAAAA1111A1Z1',
  supportPhone: '+91 9657331331',
  supportEmail: 'support@renewserv.com',
  companyAddress: '123 Solar Street, Shivaji Nagar, Pune, MH, 411005',
  razorpayKeyId: 'rzp_test_mockKeyId12345',
  razorpayKeySecret: 'mockSecretKeyId67890',
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpUser: 'operator@renewserv.com',
  smtpPass: 'mockSmtpPassword123',
  whatsappNumber: '+91 9657331331',
  whatsappApiKey: 'mock_wa_api_key_xyz',
  googleMapsApiKey: 'mock_google_maps_api_key',
  businessHours: '09:00 AM - 06:00 PM',
  serviceAreas: '411001, 411002, 411003, 411004, 411005, 411006, 411007, 411008, 411009, 411014, 411027, 411030, 411038, 411045',
  invoicePrefix: 'RS-2026-',
  taxRatePercent: '18',
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = DEFAULT_SETTINGS;
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fileContent) };
      } catch (e) {
        console.error('Failed to parse settings.json, using defaults:', e);
      }
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error('Get Settings Error:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    // Only ROOT_OWNER can modify settings (as requested: "Modify Permissions / System Settings" is ROOT_OWNER only)
    if (!session || session.role !== 'ROOT_OWNER') {
      return NextResponse.json({ error: 'Unauthorized. Only Root Owner can modify system settings.' }, { status: 403 });
    }

    const body = await req.json();
    let currentSettings = DEFAULT_SETTINGS;
    
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(fileContent) };
      } catch (e) {}
    }

    const updatedSettings = { ...currentSettings, ...body };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updatedSettings, null, 2), 'utf-8');

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATED_SYSTEM_SETTINGS',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
        details: 'System configuration settings updated by Root Owner'
      }
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (err) {
    console.error('Update Settings Error:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
