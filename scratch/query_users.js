const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const BLIND_INDEX_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
const ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function makeBlindIndex(text) {
  if (!text) return '';
  return crypto
    .createHmac('sha256', Buffer.from(BLIND_INDEX_KEY, 'hex'))
    .update(text.toLowerCase().trim())
    .digest('hex');
}

function decrypt(encryptedText) {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return '';
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return 'Decryption failed: ' + err.message;
  }
}

async function main() {
  const users = await prisma.user.findMany({
    include: { profile: true }
  });
  
  console.log(`Total users found: ${users.length}`);
  for (const u of users) {
    const email = decrypt(u.encryptedEmail);
    const phone = decrypt(u.encryptedPhone);
    console.log(`ID: ${u.id}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`Role: ${u.role}`);
    console.log(`Name: ${u.profile ? u.profile.name : 'No Profile'}`);
    console.log('-----------------------------------');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
