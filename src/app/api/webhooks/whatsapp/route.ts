import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getBlindIndex } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  let from = '';
  let bodyText = '';

  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      from = formData.get('From') as string || '';
      bodyText = formData.get('Body') as string || '';
    } else {
      const jsonBody = await req.json();
      from = jsonBody.From || '';
      bodyText = jsonBody.Body || '';
    }

    // Extract 10 digit phone number
    const cleanPhone = from.replace(/\D/g, '').slice(-10);
    const command = bodyText.trim().toLowerCase();

    // Log the inbound WhatsApp message
    await prisma.whatsappMessage.create({
      data: {
        direction: 'INBOUND',
        from: cleanPhone,
        to: 'SYSTEM',
        body: bodyText,
        status: 'RECEIVED',
      },
    });

    let replyMessage = '';
    const phoneIndex = getBlindIndex(cleanPhone);

    // Look up user
    const user = await prisma.user.findUnique({
      where: { phoneIndex },
      include: { profile: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!user) {
      replyMessage = `👋 *Welcome to Renewserv!* ☀️\n\nIt looks like this number is not registered on our portal.\n\nPlease visit ${appUrl} to register and book a professional solar panel health check or cleaning service.`;
    } else {
      const userName = user.profile?.name || 'Customer';

      if (command.includes('hi') || command === 'hello' || command === 'menu') {
        replyMessage = `👋 *Namaste, ${userName}!* Welcome to Renewserv Customer Bot.\n\nReply with one of the commands below:\n\n*Book Service* - Get booking link\n*Track* - Live status & Tech ETA\n*My Booking* - List recent bookings\n*Pay Now* - Settle outstanding bills\n*Invoice* - Download invoice PDF\n*Reschedule* - Reschedule appointment\n*Support* - Open help ticket\n*Talk to Agent* - Chat with support`;
      } 
      else if (command === 'book service' || command.includes('book')) {
        replyMessage = `☀️ *Renewserv Solar Bookings* ☀️\n\nBook premium panel cleaning or system removal/reinstallation in just 2 minutes.\n\n👉 *Book Now:* ${appUrl}/book`;
      } 
      else if (command === 'my booking' || command.includes('bookings')) {
        const bookings = await prisma.booking.findMany({
          where: { customerId: user.id, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 3,
        });

        if (bookings.length === 0) {
          replyMessage = `You don't have any bookings yet. Type *Book Service* to create your first scheduling!`;
        } else {
          replyMessage = `📅 *Your Recent Bookings:* \n`;
          bookings.forEach((b, idx) => {
            replyMessage += `\n*${idx + 1}. RNW-${b.id.slice(0, 8).toUpperCase()}*\n📅 Date: ${b.scheduledDate}\n⚡ Service: ${b.serviceType.replace('_', ' ')}\n🔔 Status: ${b.status}\n`;
          });
          replyMessage += `\n👉 View Dashboard: ${appUrl}/dashboard`;
        }
      } 
      else if (command === 'track' || command.includes('track booking')) {
        // Find latest active booking
        const booking = await prisma.booking.findFirst({
          where: {
            customerId: user.id,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            deletedAt: null,
          },
          orderBy: { updatedAt: 'desc' },
          include: {
            technicianAssignments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                technician: {
                  include: { user: { include: { profile: true } } },
                },
              },
            },
          },
        });

        if (!booking) {
          replyMessage = `🔍 You do not have any active, in-progress bookings to track. Type *Book Service* to start.`;
        } else {
          const assignment = booking.technicianAssignments[0];
          const techName = assignment?.technician?.user?.profile?.name || 'Assigning...';
          const techRating = assignment?.technician?.rating || 5.0;
          
          let eta = 'N/A';
          if (booking.status === 'TECHNICIAN_ON_THE_WAY') {
            eta = '25 minutes';
          } else if (booking.status === 'WORK_STARTED') {
            eta = 'In progress';
          }

          replyMessage = `📦 *Renewserv Live Status Tracker* 📦\n\n*Booking ID:* RNW-${booking.id.slice(0, 8).toUpperCase()}\n\n*Status:*\n${booking.status.replace(/_/g, ' ')}\n\n*Technician:*\n${techName} (${techRating.toFixed(1)} ★)\n\n*ETA:*\n${eta}\n\n👉 *Track Service:* ${appUrl}/dashboard?track=${booking.id}`;
        }
      } 
      else if (command === 'pay now' || command === 'pay') {
        const unpaidQuote = await prisma.quote.findFirst({
          where: {
            booking: { customerId: user.id, deletedAt: null },
            status: 'PENDING',
          },
          include: { booking: true },
        });

        if (!unpaidQuote) {
          replyMessage = `✅ You have no pending invoices or quotes awaiting advance payment. Good job!`;
        } else {
          replyMessage = `💳 *Outstanding Bill Payment* 💳\n\nQuotation is ready for Booking ID: RNW-${unpaidQuote.bookingId.slice(0, 8).toUpperCase()}.\nTotal Payable: ₹${unpaidQuote.totalAmount.toFixed(2)}\n\n👉 *Approve & Pay:* ${appUrl}/dashboard`;
        }
      } 
      else if (command === 'invoice' || command.includes('download invoice')) {
        const invoice = await prisma.invoice.findFirst({
          where: { booking: { customerId: user.id } },
          orderBy: { createdAt: 'desc' },
        });

        if (!invoice) {
          replyMessage = `🔍 No invoices found in your account. Invoices are generated automatically once a technician completes the rooftop restoration.`;
        } else {
          replyMessage = `📄 *Your Latest Invoice* 📄\n\n*Invoice No:* ${invoice.invoiceNumber}\n*Total Amount:* ₹${invoice.totalAmount.toFixed(2)}\n*Status:* ${invoice.status}\n\n👉 *Download Invoice:* ${appUrl}/api/invoices/${invoice.bookingId}/download`;
        }
      } 
      else if (command === 'support' || command === 'help') {
        replyMessage = `🛠️ *Renewserv Support* 🛠️\n\nNeed help with panel scratches, voltage drops, or refund status? We are here!\n\n👉 *Raise Support Ticket:* ${appUrl}/dashboard`;
      } 
      else if (command === 'reschedule') {
        replyMessage = `📅 *Reschedule Service Request* 📅\n\nTo change your preferred cleaning date or time window, please open your dashboard below:\n\n👉 *Reschedule Slot:* ${appUrl}/dashboard`;
      } 
      else if (command === 'cancel booking' || command === 'cancel') {
        replyMessage = `⚠️ *Cancel Booking Request* ⚠️\n\nYou can cancel your booking directly from the dashboard. Your ₹99 fee will be refunded back to your wallet instantly.\n\n👉 *Manage Booking:* ${appUrl}/dashboard`;
      } 
      else if (command === 'talk to agent' || command === 'agent') {
        replyMessage = `🤝 *Transitioning to Support Agent...* 🤝\n\nI have flagged your query. A live Renewserv customer success representative will respond to your WhatsApp messages shortly.`;
      } 
      else {
        replyMessage = `❓ *Unrecognized Command* ❓\n\nSorry, I couldn't understand that. Type *Hi* to see the list of interactive commands.`;
      }
    }

    // Return TwiML XML response format for Twilio WhatsApp API
    const twiml = `<Response><Message>${replyMessage}</Message></Response>`;
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (err: any) {
    console.error('WhatsApp inbound webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
