import * as jose from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'greenorbitenergy-enterprise-jwt-super-secret-key-2026-06';
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Sign a session token (expires in 2h).
 */
export async function createSessionToken(payload: { 
  userId: string; 
  role: string; 
  emailVerified?: boolean; 
  phoneVerified?: boolean;
}): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

/**
 * Verify a session token.
 */
export async function verifySessionToken(token: string): Promise<{ 
  userId: string; 
  role: string; 
  emailVerified?: boolean; 
  phoneVerified?: boolean;
} | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      role: payload.role as string,
      emailVerified: payload.emailVerified as boolean | undefined,
      phoneVerified: payload.phoneVerified as boolean | undefined,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Retrieve the current session from Next.js cookies.
 */
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('greenorbitenergy_session')?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch (err) {
    return null;
  }
}

/**
 * Clear the current session cookie.
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('greenorbitenergy_session');
}
