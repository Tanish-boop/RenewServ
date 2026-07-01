import { NextRequest } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const bookingId = resolvedParams.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Stream might have been closed/cancelled
        }
      };

      let lastStatus = '';

      // Set up periodic status polling (simulated SSE from DB)
      const interval = setInterval(async () => {
        try {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
              technicianAssignments: {
                include: {
                  technician: {
                    include: {
                      user: {
                        include: {
                          profile: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          if (!booking) {
            sendEvent({ error: 'Booking not found' });
            clearInterval(interval);
            controller.close();
            return;
          }

          if (booking.status !== lastStatus) {
            lastStatus = booking.status;
            const techName = booking.technicianAssignments[0]?.technician?.user?.profile?.name || null;
            const techRating = booking.technicianAssignments[0]?.technician?.rating || 5.0;

            sendEvent({
              bookingId: booking.id,
              status: booking.status,
              updatedAt: booking.updatedAt,
              technician: techName,
              rating: techRating,
            });
          }

          if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
            clearInterval(interval);
            controller.close();
          }
        } catch (err) {
          console.error('SSE polling error:', err);
          clearInterval(interval);
          try {
            controller.close();
          } catch (e) {}
        }
      }, 3000); // check every 3s

      // Close cleanly if the user cancels or closes the tab
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
