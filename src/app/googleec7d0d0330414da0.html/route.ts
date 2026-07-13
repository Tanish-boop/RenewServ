import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('google-site-verification: googleec7d0d0330414da0.html', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
