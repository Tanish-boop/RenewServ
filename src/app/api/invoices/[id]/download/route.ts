import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const bookingId = resolvedParams.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { include: { profile: true } },
        address: true,
        invoice: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify ownership or administrative access
    if (booking.customerId !== session.userId && !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = booking.invoice;
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not generated yet. Please clear payment first.' }, { status: 404 });
    }

    // Decrypt customer contact properties
    const customerName = booking.customer.profile?.name || 'Valued Customer';
    const customerEmail = booking.customer.encryptedEmail ? decrypt(booking.customer.encryptedEmail) : 'N/A';
    const customerPhone = booking.customer.encryptedPhone ? decrypt(booking.customer.encryptedPhone) : 'N/A';
    const addressLine = booking.address?.encryptedAddress ? decrypt(booking.address.encryptedAddress) : 'N/A';
    const postalCode = booking.address?.postalCode || '';

    // Render invoice receipt
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #334155;
            margin: 0;
            padding: 40px;
            background-color: #f8fafc;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 40px;
            border: 1px solid #e2e8f0;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 24px;
            margin-bottom: 24px;
          }
          .company-logo {
            font-size: 24px;
            font-weight: 800;
            color: #0284c7;
          }
          .company-logo span {
            color: #0f172a;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: 700;
            color: #0f172a;
            text-align: right;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
          }
          .meta-block h3 {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin: 0 0 8px 0;
          }
          .meta-block p {
            margin: 0 0 4px 0;
            font-size: 15px;
            line-height: 1.5;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
          }
          .table th {
            background-color: #f8fafc;
            color: #64748b;
            font-size: 13px;
            text-transform: uppercase;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
          }
          .table td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 15px;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 32px;
          }
          .totals-table {
            width: 300px;
            font-size: 15px;
          }
          .totals-table tr td {
            padding: 8px 0;
          }
          .totals-table tr td:last-child {
            text-align: right;
            font-weight: 600;
            color: #0f172a;
          }
          .totals-table tr.grand-total td {
            border-top: 2px solid #e2e8f0;
            font-size: 18px;
            font-weight: 700;
            color: #0284c7;
            padding-top: 16px;
          }
          .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .badge-paid {
            background-color: #dcfce7;
            color: #15803d;
          }
          .badge-unpaid {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          .footer {
            text-align: center;
            font-size: 13px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 24px;
            margin-top: 40px;
          }
          @media print {
            body {
              background-color: #ffffff;
              padding: 0;
            }
            .invoice-box {
              border: none;
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="company-logo">Renew<span>serv</span></div>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Solar Maintenance & Cleaning Services</p>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b; text-align: right;">
                No: ${invoice.invoiceNumber}<br>
                Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-block">
              <h3>Billed To</h3>
              <p><strong>${customerName}</strong></p>
              <p>Email: ${customerEmail}</p>
              <p>Phone: ${customerPhone}</p>
              <p>${addressLine}</p>
              <p>Postal Code: ${postalCode}</p>
            </div>
            <div class="meta-block" style="text-align: right;">
              <h3>Payment Status</h3>
              <div style="margin-bottom: 12px;">
                <span class="badge ${invoice.status === 'PAID' ? 'badge-paid' : 'badge-unpaid'}">
                  ${invoice.status === 'PAID' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <p><strong>Renewserv Solar Solutions</strong></p>
              <p>GSTIN: 27AABCR9999P1Z8 (Clean Energy Code)</p>
              <p>Pune, Maharashtra, India</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 60%;">Description</th>
                <th style="text-align: right;">Base Amount</th>
                <th style="text-align: right;">GST (18%)</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Solar Panel Site Visit & Scheduling Fee</strong><br>
                  <span style="font-size: 13px; color: #64748b;">
                    One-time inspection charges for rooftop diagnostics and technical evaluation mapping.
                  </span>
                </td>
                <td style="text-align: right;">₹${invoice.amount.toFixed(2)}</td>
                <td style="text-align: right;">₹${invoice.tax.toFixed(2)}</td>
                <td style="text-align: right;">₹${invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td>₹${invoice.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Tax (GST 18%):</td>
                <td>₹${invoice.tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Discount:</td>
                <td>₹${invoice.discount.toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td>Total Paid:</td>
                <td>₹${invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for choosing Renewserv. Let's power the future cleanly!</p>
            <p style="font-size: 11px; margin-top: 8px; color: #cbd5e1;">This is a computer-generated invoice. No physical signature is required.</p>
          </div>
        </div>
        <script>
          if (new URLSearchParams(window.location.search).get('print') === 'true') {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err: any) {
    console.error('Failed to generate invoice printout:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
