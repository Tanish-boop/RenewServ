import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const BLIND_INDEX_KEY = process.env.BLIND_INDEX_KEY || 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

const encKeyBuf = Buffer.from(ENCRYPTION_KEY, 'hex');
const blindKeyBuf = Buffer.from(BLIND_INDEX_KEY, 'hex');

import argon2 from 'argon2';

/**
 * Hash a password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, { type: argon2.argon2id });
}

/**
 * Verify a password against a hash using Argon2id.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    return false;
  }
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns in format iv:authTag:ciphertext.
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKeyBuf, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an encrypted string (iv:authTag:ciphertext) using AES-256-GCM.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return '';
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', encKeyBuf, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '';
  }
}

/**
 * Generate a deterministic search index (blind index) using HMAC-SHA256.
 * Standardizes inputs (trim and lowercase) before indexing.
 */
export function makeBlindIndex(text: string): string {
  if (!text) return '';
  return crypto
    .createHmac('sha256', blindKeyBuf)
    .update(text.toLowerCase().trim())
    .digest('hex');
}

export const getBlindIndex = makeBlindIndex;
