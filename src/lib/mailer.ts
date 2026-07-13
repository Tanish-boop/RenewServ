import nodemailer from 'nodemailer';
import prisma from './db';
import { makeBlindIndex } from './crypto';

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const fromEmail = process.env.SMTP_FROM || 'Renewserv <noreply@renewserv.com>';

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  body,
  html,
}: {
  to: string;
  subject: string;
  body: string;
  html?: string;
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const isRealResend = resendApiKey && !resendApiKey.startsWith('re_mock');
  let status = 'SENT';
  let errorMsg: string | null = null;

  try {
    if (transporter) {
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text: body,
        html: html || body.replace(/\n/g, '<br>'),
      });
    } else if (isRealResend) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          html: html || body.replace(/\n/g, '<br>'),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Resend API returned status ${res.status}`);
      }
    } else {
      status = 'MOCK';
      console.log(`\n========================================`);
      console.log(`[MOCK EMAIL SENT]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      console.log(`========================================\n`);
    }
  } catch (err: any) {
    console.error('Email dispatch failed:', err);
    status = 'FAILED';
    errorMsg = err.message || 'Delivery failed';
  }

  // Persist permanently in EmailLog table
  try {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        body: html || body,
        status,
        errorMsg,
      },
    });
  } catch (dbErr) {
    console.error('Failed to log email transaction:', dbErr);
  }

  return { success: status === 'SENT' || status === 'MOCK', error: errorMsg || undefined };
}

export async function sendVerificationEmail(to: string, token: string) {
  const subject = 'Verify Your Email Address – Renewserv';
  
  let userName = 'Customer';
  try {
    const emailIndex = makeBlindIndex(to);
    const user = await prisma.user.findFirst({
      where: { emailIndex, deletedAt: null },
      include: { profile: true }
    });
    if (user?.profile?.name) {
      userName = user.profile.name;
    }
  } catch (err) {
    console.error('Failed to fetch user name for email:', err);
  }

  const body = `Dear ${userName},\n\nWelcome to Renewserv! Thank you for creating an account with us.\n\nTo complete your registration, please verify your email address using the OTP below:\n\nVerification Code: ${token}\n\nThis code is valid for 10 minutes.\n\nIf you did not create an account with Renewserv, please ignore this email.\n\nBest regards,\n\nTeam Renewserv\nSolar Maintenance & Services\n🌐 https://renewserv.com`;
  
  const html = `
    <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e2e8f0; max-width: 600px; border-radius: 12px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 22px;">Verify Your Email Address</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Renewserv Solar Maintenance & Services</p>
      </div>
      <p style="font-size: 15px;">Dear <strong>${userName}</strong>,</p>
      <p style="font-size: 15px;">Welcome to Renewserv! Thank you for creating an account with us.</p>
      <p style="font-size: 15px;">To complete your registration, please verify your email address using the OTP below:</p>
      <div style="font-size: 32px; font-weight: 800; color: #0284c7; letter-spacing: 5px; padding: 18px; background-color: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 10px; text-align: center; margin: 25px 0; font-family: monospace;">
        ${token}
      </div>
      <p style="font-size: 14px; color: #ef4444; font-weight: 650;">This code is valid for 10 minutes.</p>
      <p style="font-size: 14px; color: #64748b; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px;">If you did not create an account with Renewserv, please ignore this email.</p>
      <p style="font-size: 14px; color: #475569; margin-top: 20px; line-height: 1.5;">
        Best regards,<br>
        <strong>Team Renewserv</strong><br>
        Solar Maintenance & Services<br>
        🌐 <a href="https://renewserv.com" style="color: #0284c7; text-decoration: none;">https://renewserv.com</a>
      </p>
    </div>
  `;

  return await sendEmail({ to, subject, body, html });
}

export async function sendInvoiceEmail(to: string, invoiceNumber: string, amount: number, pdfUrl?: string) {
  const subject = `Your Renewserv Invoice: ${invoiceNumber}`;
  const body = `Dear Customer,\n\nYour solar cleaning invoice is ready.\nInvoice Number: ${invoiceNumber}\nTotal Amount: ₹${amount.toFixed(2)}\n\nView details: ${pdfUrl || '#'}`;
  
  return await sendEmail({ to, subject, body });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const subject = 'Reset Your Renewserv Password';

  let userName = 'Customer';
  try {
    const emailIndex = makeBlindIndex(to);
    const user = await prisma.user.findFirst({
      where: { emailIndex, deletedAt: null },
      include: { profile: true }
    });
    if (user?.profile?.name) {
      userName = user.profile.name;
    }
  } catch (err) {
    console.error('Failed to fetch user name for email:', err);
  }

  const body = `Dear ${userName},\n\nWe received a request to reset your Renewserv account password.\n\nPlease use the following OTP to proceed:\n\nPassword Reset Code: ${token}\n\nThis code is valid for 10 minutes.\n\nIf you did not request a password reset, please ignore this email. Your account remains secure.\n\nBest regards,\n\nTeam Renewserv\nSolar Maintenance & Services\n🌐 https://renewserv.com`;
  
  const html = `
    <div style="font-family: sans-serif; padding: 25px; border: 1px solid #e2e8f0; max-width: 600px; border-radius: 12px; color: #1e293b; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 22px;">Reset Your Password</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Renewserv Solar Maintenance & Services</p>
      </div>
      <p style="font-size: 15px;">Dear <strong>${userName}</strong>,</p>
      <p style="font-size: 15px;">We received a request to reset your Renewserv account password.</p>
      <p style="font-size: 15px;">Please use the following OTP to proceed:</p>
      <div style="font-size: 32px; font-weight: 800; color: #ef4444; letter-spacing: 5px; padding: 18px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; text-align: center; margin: 25px 0; font-family: monospace;">
        ${token}
      </div>
      <p style="font-size: 14px; color: #ef4444; font-weight: 650;">This code is valid for 10 minutes.</p>
      <p style="font-size: 14px; color: #64748b; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px;">If you did not request a password reset, please ignore this email. Your account remains secure.</p>
      <p style="font-size: 14px; color: #475569; margin-top: 20px; line-height: 1.5;">
        Best regards,<br>
        <strong>Team Renewserv</strong><br>
        Solar Maintenance & Services<br>
        🌐 <a href="https://renewserv.com" style="color: #0284c7; text-decoration: none;">https://renewserv.com</a>
      </p>
    </div>
  `;

  return await sendEmail({ to, subject, body, html });
}

