import prisma from './db';

const fast2smsKey = process.env.FAST2SMS_API_KEY || '';
const twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
const twilioAuth = process.env.TWILIO_AUTH_TOKEN || '';
const twilioFrom = process.env.TWILIO_PHONE_NUMBER || '';

export async function sendSms({
  to,
  body,
}: {
  to: string;
  body: string;
}): Promise<{ success: boolean; error?: string }> {
  let status = 'SENT';
  let errorMsg = null;

  try {
    if (twilioSid && twilioAuth && twilioFrom) {
      // Twilio SMS Integration
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: to.startsWith('+') ? to : `+91${to}`,
          Body: body,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Twilio API error');
      }
    } else if (fast2smsKey) {
      // Fast2SMS Integration
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: body,
          numbers: to.replace(/\D/g, ''),
        }),
      });

      const data = await res.json();
      if (!data.return) {
        throw new Error(data.message || 'Fast2SMS returned failure');
      }
    } else {
      // Mock Console Fallback
      console.log(`\n========================================`);
      console.log(`[MOCK SMS SENT]`);
      console.log(`To: ${to}`);
      console.log(`Body: ${body}`);
      console.log(`========================================\n`);
    }
  } catch (err: any) {
    console.error('SMS dispatch failed:', err);
    status = 'FAILED';
    errorMsg = err.message || 'SMS service unreachable';
  }

  // Log permanently in SmsLog
  try {
    await prisma.smsLog.create({
      data: {
        to,
        body,
        status,
        errorMsg,
      },
    });
  } catch (dbErr) {
    console.error('Failed to log SMS transaction:', dbErr);
  }

  return { success: status === 'SENT', error: errorMsg || undefined };
}

export async function sendOtpSms(to: string, code: string) {
  const body = `Your Green Orbit Energy solar OTP is: ${code}. Do not share this code with anyone. Valid for 5 minutes.`;
  return await sendSms({ to, body });
}
