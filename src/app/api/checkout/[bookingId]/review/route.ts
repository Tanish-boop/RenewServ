import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const bookingId = resolvedParams.bookingId;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        review: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify booking belongs to client (or caller is admin)
    if (booking.customerId !== session.userId && !['ROOT_OWNER', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Must be completed and paid
    const isCompleted = booking.status === 'COMPLETED' || booking.status === 'WORK_COMPLETED';
    const isPaid = booking.bookingFeePaid || booking.paymentStatus === 'PAID';
    
    if (!isCompleted || !isPaid) {
      return NextResponse.json({ 
        error: 'Reviews can only be submitted for completed and fully paid solar services.' 
      }, { status: 400 });
    }

    if (booking.review) {
      return NextResponse.json({ error: 'Review already submitted for this booking' }, { status: 400 });
    }

    const body = await req.json();
    const { ratingTechnician, ratingService, comment } = body;

    if (typeof ratingTechnician !== 'number' || typeof ratingService !== 'number') {
      return NextResponse.json({ error: 'Ratings are required' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        ratingTechnician,
        ratingService,
        comment: comment || '',
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    console.error('Failed to submit review:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
