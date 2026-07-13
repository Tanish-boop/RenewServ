import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      companyName, 
      contactPerson, 
      phone, 
      email, 
      location, 
      wasteType, 
      quantity, 
      preferredDate, 
      images, 
      message 
    } = body;

    // Contact person or company name is required to create a Lead
    const primaryName = contactPerson ? `${contactPerson} (${companyName || 'Individual'})` : (companyName || 'Anonymous E-Waste Lead');

    if (!primaryName.trim()) {
      return NextResponse.json({ error: 'Name or company name is required' }, { status: 400 });
    }

    // Format notes for the admin dashboard view
    const notesContent = [
      `Company Name: ${companyName || 'N/A'}`,
      `Contact Person: ${contactPerson || 'N/A'}`,
      `Location: ${location || 'N/A'}`,
      `Waste Type: ${wasteType || 'N/A'}`,
      `Estimated Quantity: ${quantity || 'N/A'}`,
      `Preferred Date: ${preferredDate || 'N/A'}`,
      `Message: ${message || 'N/A'}`,
      `Uploaded Images: ${images && images.length > 0 ? images.join(', ') : 'None'}`
    ].join('\n');

    // Create lead record
    const lead = await prisma.lead.create({
      data: {
        name: primaryName.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        serviceInterested: 'E-Waste Management',
        source: 'WEBSITE',
        status: 'NEW',
        notes: notesContent
      }
    });

    return NextResponse.json({ 
      success: true, 
      leadId: lead.id, 
      message: 'Your pickup request has been successfully submitted! An executive will contact you shortly.' 
    });
  } catch (err: any) {
    console.error('E-Waste Lead Submission Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit e-waste lead' }, { status: 500 });
  }
}
