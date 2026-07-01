const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const databaseUrl = "postgresql://neondb_owner:npg_NbmY3VgTUEi2@ep-orange-bird-atxxjesr-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

const ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const BLIND_INDEX_KEY = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
const encKeyBuf = Buffer.from(ENCRYPTION_KEY, 'hex');
const blindKeyBuf = Buffer.from(BLIND_INDEX_KEY, 'hex');

function decrypt(text) {
  if (!text) return '';
  try {
    const parts = text.split(':');
    if (parts.length !== 3) return text;
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-gcm', encKeyBuf, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return `[Decryption Error: ${err.message}]`;
  }
}

async function main() {
  console.log("Checking Live Neon Database...");
  
  const users = await prisma.user.findMany({
    include: { profile: true }
  });
  console.log(`\n--- Users Count: ${users.length} ---`);
  users.forEach(u => {
    console.log(`ID: ${u.id}, Role: ${u.role}, Email Index: ${u.emailIndex}`);
    console.log(`Decrypted Email: ${decrypt(u.encryptedEmail)}`);
  });

  const emailLogs = await prisma.emailLog.findMany();
  console.log(`\n--- Email Logs Count: ${emailLogs.length} ---`);
  emailLogs.forEach(log => {
    console.log(`ID: ${log.id}, To: ${log.to}, Subject: ${log.subject}, Status: ${log.status}, CreatedAt: ${log.createdAt}`);
    console.log(`Body Snippet: ${log.body.substring(0, 100)}`);
  });

  const resetOtps = await prisma.passwordResetOtp.findMany();
  console.log(`\n--- Password Reset OTPs Count: ${resetOtps.length} ---`);
  resetOtps.forEach(otp => {
    console.log(`ID: ${otp.id}, Email: ${otp.email}, ExpiresAt: ${otp.expiresAt}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
