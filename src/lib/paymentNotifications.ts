import prisma from './db';
import { decrypt } from './crypto';
import { sendEmail } from './mailer';
import { sendWhatsappMessage } from './whatsapp';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function getUserContactInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) return null;
    const email = user.encryptedEmail ? decrypt(user.encryptedEmail) : '';
    const phone = user.encryptedPhone ? decrypt(user.encryptedPhone) : '';
    const name = user.profile?.name || 'Customer';
    return { email, phone, name };
  } catch (err) {
    console.error('Failed to get user contact info for notifications:', err);
    return null;
  }
}

export async function sendPaymentInitiatedNotification(userId: string, bookingId: string, amount: number) {
  const contact = await getUserContactInfo(userId);
  if (!contact) return;

  const subject = `Payment Pending: Complete Your Renewserv Booking – ₹${amount}`;
  const body = `Dear ${contact.name},\n\nYour site visit fee of ₹${amount} is pending. Please complete your payment within 30 minutes to reserve your technician slot.\n\nPay Now: ${appUrl}/checkout/${bookingId}\n\nThank you,\nTeam Renewserv`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; color: #334155;">
      <h2 style="color: #0f172a;">Complete Your Booking Payment</h2>
      <p>Dear <strong>${contact.name}</strong>,</p>
      <p>Your site visit scheduling fee of <strong>₹${amount}</strong> is pending payment. Please complete this process within 30 minutes to lock your preferred slot.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/checkout/${bookingId}" style="background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Pay ₹${amount} Now</a>
      </div>
      <p style="font-size: 13px; color: #ef4444; font-weight: bold;">Note: The ₹99 Site Visit Fee covers technician scheduling and site inspection services and is charged separately from the final service quotation.</p>
      <p style="margin-top: 20px; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 10px;">Best regards,<br><strong>Team Renewserv</strong></p>
    </div>
  `;

  if (contact.email) await sendEmail({ to: contact.email, subject, body, html });
  if (contact.phone) {
    const waBody = `⚡ *Renewserv: Payment Pending* ⚡\n\nYour site visit fee of ₹${amount} is pending. Please complete your payment within 30 minutes to lock your booking slot.\n\n👉 Pay Now: ${appUrl}/checkout/${bookingId}`;
    await sendWhatsappMessage({ to: contact.phone, body: waBody, userId });
  }
}

export async function sendPaymentUnderVerificationNotification(userId: string, bookingId: string, amount: number) {
  const contact = await getUserContactInfo(userId);
  if (!contact) return;

  const subject = `Payment Under Verification – Booking #${bookingId.substring(0, 8)}`;
  const body = `Dear ${contact.name},\n\nWe have received your transaction receipt for ₹${amount}. Our finance desk is verifying the details. We will confirm your booking shortly.\n\nTrack booking status: ${appUrl}/checkout/${bookingId}\n\nBest regards,\nTeam Renewserv`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; color: #334155;">
      <h2 style="color: #0f172a; color: #0284c7;">Payment Under Verification</h2>
      <p>Dear <strong>${contact.name}</strong>,</p>
      <p>Thank you for submitting your payment transaction details for <strong>₹${amount}</strong>. Our operations and billing team is verifying the UTR / screenshot receipt.</p>
      <p>We will verify and approve your booking slot within 1–2 hours.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/checkout/${bookingId}" style="background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Track Verification Status</a>
      </div>
      <p style="margin-top: 20px; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 10px;">Best regards,<br><strong>Team Renewserv</strong></p>
    </div>
  `;

  if (contact.email) await sendEmail({ to: contact.email, subject, body, html });
  if (contact.phone) {
    const waBody = `⏳ *Renewserv: Payment Under Verification* ⏳\n\nThank you for submitting your payment transaction details for ₹${amount}. Our team is verifying your receipt. We will confirm your slot shortly!\n\n👉 Track Status: ${appUrl}/checkout/${bookingId}`;
    await sendWhatsappMessage({ to: contact.phone, body: waBody, userId });
  }
}

export async function sendPaymentSuccessfulNotification(userId: string, bookingId: string, amount: number) {
  const contact = await getUserContactInfo(userId);
  if (!contact) return;

  const subject = `Payment Successful! Booking Confirmed – Booking #${bookingId.substring(0, 8)}`;
  const body = `Dear ${contact.name},\n\nYour payment of ₹${amount} is verified successfully. Your booking is now CONFIRMED! Our expert technician is scheduled to visit your site.\n\nManage Booking: ${appUrl}/dashboard\n\nDownload Invoice: ${appUrl}/api/invoices/${bookingId}/download\n\nBest regards,\nTeam Renewserv`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; color: #334155;">
      <h2 style="color: #10b981;">Payment Successful & Booking Confirmed!</h2>
      <p>Dear <strong>${contact.name}</strong>,</p>
      <p>Great news! Your payment of <strong>₹${amount}</strong> was successfully verified.</p>
      <p>Your booking <strong>#${bookingId.substring(0, 8)}</strong> is now officially **CONFIRMED**.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/dashboard" style="background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Open Dashboard</a>
        <a href="${appUrl}/api/invoices/${bookingId}/download" style="background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-left: 10px;">Download Invoice</a>
      </div>
      <p style="margin-top: 20px; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 10px;">Best regards,<br><strong>Team Renewserv</strong></p>
    </div>
  `;

  if (contact.email) await sendEmail({ to: contact.email, subject, body, html });
  if (contact.phone) {
    const waBody = `✅ *Renewserv: Payment Successful!* ✅\n\nYour payment of ₹${amount} is successfully received and verified! Your booking #${bookingId.substring(0,8)} is now CONFIRMED.\n\n👉 Track Service: ${appUrl}/dashboard?track=${bookingId}\n👉 Download Invoice: ${appUrl}/api/invoices/${bookingId}/download`;
    await sendWhatsappMessage({ to: contact.phone, body: waBody, userId });
  }
}

export async function sendPaymentFailedNotification(userId: string, bookingId: string, amount: number, reason = 'Verification Failed') {
  const contact = await getUserContactInfo(userId);
  if (!contact) return;

  const subject = `Payment Transaction Declined – Booking #${bookingId.substring(0, 8)}`;
  const body = `Dear ${contact.name},\n\nWe could not verify your payment of ₹${amount} for booking #${bookingId.substring(0,8)}. Reason: ${reason}.\n\nPlease click below to retry the payment or upload a new transaction receipt.\n\nRetry Payment: ${appUrl}/checkout/${bookingId}\n\nBest regards,\nTeam Renewserv`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; color: #334155;">
      <h2 style="color: #ef4444;">Payment Verification Declined</h2>
      <p>Dear <strong>${contact.name}</strong>,</p>
      <p>We were unable to verify your payment transaction details for <strong>₹${amount}</strong>.</p>
      <p><strong>Reason provided:</strong> ${reason}</p>
      <p>Please click below to retry your payment or upload a valid UTR number / screenshot receipt.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/checkout/${bookingId}" style="background-color: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Retry Payment / Upload Receipt</a>
      </div>
      <p style="margin-top: 20px; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 10px;">Best regards,<br><strong>Team Renewserv</strong></p>
    </div>
  `;

  if (contact.email) await sendEmail({ to: contact.email, subject, body, html });
  if (contact.phone) {
    const waBody = `❌ *Renewserv: Payment Verification Declined* ❌\n\nWe could not verify your payment for booking #${bookingId.substring(0,8)}. Reason: ${reason}.\n\n👉 Retry/Upload Receipt: ${appUrl}/checkout/${bookingId}`;
    await sendWhatsappMessage({ to: contact.phone, body: waBody, userId });
  }
}

export async function sendPaymentExpiredNotification(userId: string, bookingId: string) {
  const contact = await getUserContactInfo(userId);
  if (!contact) return;

  const subject = `Payment Session Expired – Booking #${bookingId.substring(0, 8)}`;
  const body = `Dear ${contact.name},\n\nThe payment session for booking #${bookingId.substring(0,8)} has expired. Your technician slot has been released.\n\nYou can request a new payment session to complete your booking.\n\nRetry Payment: ${appUrl}/checkout/${bookingId}\n\nBest regards,\nTeam Renewserv`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; color: #334155;">
      <h2 style="color: #64748b;">Payment Session Expired</h2>
      <p>Dear <strong>${contact.name}</strong>,</p>
      <p>The 30-minute payment session for your booking reservation <strong>#${bookingId.substring(0, 8)}</strong> has expired. Your reserved slot is released.</p>
      <p>Don't worry, you can easily click the link below to generate a new payment session and confirm your booking!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/checkout/${bookingId}" style="background-color: #64748b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Generate New Payment Session</a>
      </div>
      <p style="margin-top: 20px; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 10px;">Best regards,<br><strong>Team Renewserv</strong></p>
    </div>
  `;

  if (contact.email) await sendEmail({ to: contact.email, subject, body, html });
  if (contact.phone) {
    const waBody = `⚠️ *Renewserv: Payment Session Expired* ⚠️\n\nThe payment session for booking #${bookingId.substring(0,8)} has expired. Your reserved slot is released. You can click below to generate a new session.\n\n👉 Retry Payment: ${appUrl}/checkout/${bookingId}`;
    await sendWhatsappMessage({ to: contact.phone, body: waBody, userId });
  }
}

export async function sendPaymentRefundedNotification(userId: string, bookingId: string, amount: number) {
  const contact = await getUserContactInfo(userId);
  if (!contact) return;

  const subject = `Refund Processed – Booking #${bookingId.substring(0, 8)}`;
  const body = `Dear ${contact.name},\n\nA refund of ₹${amount} has been successfully processed for booking #${bookingId.substring(0,8)}. The amount will be credited back to your account soon.\n\nBest regards,\nTeam Renewserv`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; color: #334155;">
      <h2 style="color: #475569;">Refund Processed</h2>
      <p>Dear <strong>${contact.name}</strong>,</p>
      <p>This is to inform you that a refund of <strong>₹${amount}</strong> has been successfully processed for your booking <strong>#${bookingId.substring(0, 8)}</strong>.</p>
      <p>The refund will reflect in your bank account / source card within 5–7 working days.</p>
      <p style="margin-top: 20px; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 10px;">Best regards,<br><strong>Team Renewserv</strong></p>
    </div>
  `;

  if (contact.email) await sendEmail({ to: contact.email, subject, body, html });
  if (contact.phone) {
    const waBody = `💰 *Renewserv: Refund Processed* 💰\n\nA refund of ₹${amount} has been processed for your booking #${bookingId.substring(0,8)}. The amount will reflect in your account soon.`;
    await sendWhatsappMessage({ to: contact.phone, body: waBody, userId });
  }
}
