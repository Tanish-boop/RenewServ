import nodemailer from 'nodemailer';
import prisma from './db';

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
  let status = 'SENT';
  let errorMsg = null;

  try {
    if (transporter) {
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text: body,
        html: html || body.replace(/\n/g, '<br>'),
      });
    } else {
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
    errorMsg = err.message || 'SMTP delivery failed';
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

  return { success: status === 'SENT', error: errorMsg || undefined };
}

export async function sendVerificationEmail(to: string, token: string) {
  const subject = 'Verify your Renewserv Email Account';
  const body = `Welcome to Renewserv!\n\nYour 6-digit email verification OTP code is: ${token}\n\nEnter this code on the website to verify your email address.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; max-width: 500px; border-radius: 10px;">
      <h2 style="color: #2563eb;">Verify Your Email</h2>
      <p>Thank you for choosing Renewserv. Please enter the following 6-digit verification code to complete your registration:</p>
      <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; padding: 15px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin: 15px 0;">
        ${token}
      </div>
      <p style="margin-top: 20px; font-size: 11px; color: #64748b;">This OTP code is valid for 15 minutes. Do not share it with anyone.</p>
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
  const subject = 'Reset your Renewserv Account Password';
  const body = `Reset your Renewserv Password\n\nYour 6-digit password reset OTP code is: ${token}\n\nEnter this code on the website to reset your password.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; max-width: 500px; border-radius: 10px;">
      <h2 style="color: #ef4444;">Reset Your Password</h2>
      <p>Please enter the following 6-digit verification code to reset your account password:</p>
      <div style="font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 4px; padding: 15px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin: 15px 0;">
        ${token}
      </div>
      <p style="margin-top: 20px; font-size: 11px; color: #64748b;">This OTP code is valid for 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  return await sendEmail({ to, subject, body, html });
}

