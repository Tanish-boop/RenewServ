import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'greenorbitenergy-enterprise-jwt-super-secret-key-2026-06';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('greenorbitenergy_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/?login=true', request.url));
  }

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    const role = payload.role as string;
    const emailVerified = payload.emailVerified as boolean;



    if (pathname.startsWith('/admin')) {
      const isAdminRole = ['ROOT_OWNER', 'OWNER'].includes(role);
      if (!isAdminRole) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    if (pathname.startsWith('/technician')) {
      if (role !== 'TECHNICIAN') {
        if (['ROOT_OWNER', 'OWNER'].includes(role)) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    if (pathname.startsWith('/dashboard') || pathname === '/book') {
      if (['ROOT_OWNER', 'OWNER'].includes(role)) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      if (role === 'TECHNICIAN') {
        return NextResponse.redirect(new URL('/technician', request.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    const response = NextResponse.redirect(new URL('/?login=true', request.url));
    response.cookies.delete('greenorbitenergy_session');
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/technician/:path*', '/admin/:path*', '/book'],
};
