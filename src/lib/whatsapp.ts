import prisma from './db';

const twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
const twilioAuth = process.env.TWILIO_AUTH_TOKEN || '';
const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox number

export async function sendWhatsappMessage({
  to,
  body,
  mediaUrl,
  userId,
}: {
  to: string;
  body: string;
  mediaUrl?: string;
  userId?: string;
}): Promise<{ success: boolean; error?: string }> {
  let status = 'DELIVERED';
  let errorMsg = null;

  const cleanTo = to.startsWith('+') ? to : `+91${to}`;
  const formattedTo = cleanTo.startsWith('whatsapp:') ? cleanTo : `whatsapp:${cleanTo}`;

  try {
    if (twilioSid && twilioAuth) {
      const payload: any = {
        From: twilioFrom,
        To: formattedTo,
        Body: body,
      };
      if (mediaUrl) payload.MediaUrl = mediaUrl;

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Twilio WhatsApp API error');
      }
    } else {
      console.log(`\n========================================`);
      console.log(`[MOCK WHATSAPP OUTBOUND]`);
      console.log(`To: ${formattedTo}`);
      console.log(`Body: ${body}`);
      if (mediaUrl) console.log(`Media: ${mediaUrl}`);
      console.log(`========================================\n`);
    }
  } catch (err: any) {
    console.error('WhatsApp message dispatch failed:', err);
    status = 'FAILED';
    errorMsg = err.message || 'Twilio WhatsApp service error';
  }

  // Save to WhatsappMessage
  try {
    await prisma.whatsappMessage.create({
      data: {
        direction: 'OUTBOUND',
        from: twilioFrom.replace('whatsapp:', ''),
        to: cleanTo.replace('whatsapp:', ''),
        body,
        mediaUrl,
        status,
      },
    });
  } catch (dbErr) {
    console.error('Failed to log WhatsappMessage:', dbErr);
  }

  // Save to NotificationLog
  if (userId) {
    try {
      await prisma.notificationLog.create({
        data: {
          userId,
          channel: 'WHATSAPP',
          recipient: cleanTo,
          content: body,
          status: status === 'DELIVERED' ? 'SENT' : 'FAILED',
          errorMsg,
        },
      });
    } catch (logErr) {
      console.error('Failed to log notification status:', logErr);
    }
  }

  return { success: status === 'DELIVERED', error: errorMsg || undefined };
}

// WhatsApp Template Dispatches
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendBookingConfirmedWA(to: string, userId: string, bookingId: string) {
  const body = `⚡ *Renewserv: Booking Confirmed!* ⚡\n\nYour solar health check is scheduled successfully.\nBooking Reference: ${bookingId}\n\n👉 Track Service: ${appUrl}/dashboard?track=${bookingId}\n👉 Open Dashboard: ${appUrl}/dashboard`;
  return await sendWhatsappMessage({ to, body, userId });
}

export async function sendTechnicianAssignedWA(to: string, userId: string, bookingId: string, techName: string, rating: number) {
  const body = `👤 *Renewserv: Technician Assigned* 👤\n\nOur solar specialist *${techName}* (${rating.toFixed(1)} ★) will service your panels.\n\n👉 View Tech Details: ${appUrl}/dashboard`;
  return await sendWhatsappMessage({ to, body, userId });
}

export async function sendTechnicianOnTheWayWA(to: string, userId: string, bookingId: string, techName: string, etaMinutes: number) {
  const body = `🚚 *Renewserv: Expert is On the Way!* 🚚\n\n${techName} is traveling to your rooftop installation.\nETA: ${etaMinutes} minutes.\n\n👉 Track Service: ${appUrl}/dashboard?track=${bookingId}`;
  return await sendWhatsappMessage({ to, body, userId });
}

export async function sendInspectionCompletedWA(to: string, userId: string, bookingId: string) {
  const body = `📋 *Renewserv: Health Check Complete* 📋\n\nOur diagnostic report has been filed. Please check pricing quote to approve.\n\n👉 View Report & Quote: ${appUrl}/dashboard`;
  return await sendWhatsappMessage({ to, body, userId });
}

export async function sendQuoteGeneratedWA(to: string, userId: string, bookingId: string, amount: number) {
  const body = `💰 *Renewserv: Pricing Quote Generated* 💰\n\nItemized solar panel cleaning quote is ready for ₹${amount.toFixed(2)}.\n\n👉 View & Approve Quote: ${appUrl}/dashboard`;
  return await sendWhatsappMessage({ to, body, userId });
}

export async function sendPaymentReminderWA(to: string, userId: string, bookingId: string, amount: number) {
  const body = `⚠️ *Renewserv: Payment Pending* ⚠️\n\nPlease pay the outstanding balance of ₹${amount.toFixed(2)} to clear service dues.\n\n👉 Pay Now: ${appUrl}/dashboard`;
  return await sendWhatsappMessage({ to, body, userId });
}

export async function sendInvoiceSentWA(to: string, userId: string, bookingId: string, invoiceNumber: string, amount: number) {
  const body = `📄 *Renewserv: Invoice Generated* 📄\n\nInvoice ${invoiceNumber} for ₹${amount.toFixed(2)} has been cleared.\n\n👉 View Invoice: ${appUrl}/api/invoices/${bookingId}/download`;
  return await sendWhatsappMessage({ to, body, userId });
}

export async function sendServiceCompletedWA(to: string, userId: string, bookingId: string) {
  const body = `🎉 *Renewserv: Cleaning Done!* 🎉\n\nYour solar panels are washed and output metrics restored. Thank you for choosing Renewserv!\n\n👉 View Inverter Stats: ${appUrl}/dashboard`;
  return await sendWhatsappMessage({ to, body, userId });
}

export async function sendAmcReminderWA(to: string, userId: string) {
  const body = `📅 *Renewserv: Solar Panel Care Alert* 📅\n\nIt has been 6 months since your last panel cleaning! Protect your solar generation output with our Annual Maintenance Contract (AMC).\n\n👉 Subscribe: ${appUrl}/dashboard`;
  return await sendWhatsappMessage({ to, body, userId });
}
