const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const BLIND_INDEX_KEY = process.env.BLIND_INDEX_KEY || 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
const encKeyBuf = Buffer.from(ENCRYPTION_KEY, 'hex');
const blindKeyBuf = Buffer.from(BLIND_INDEX_KEY, 'hex');

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKeyBuf, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function makeBlindIndex(text) {
  if (!text) return '';
  return crypto
    .createHmac('sha256', blindKeyBuf)
    .update(text.toLowerCase().trim())
    .digest('hex');
}

async function main() {
  const rootEmail = 'tanish.thakare2005@gmail.com';
  const rootPassword = 'GaneshaMoto@1234';

  const emailIndex = makeBlindIndex(rootEmail);
  const encryptedEmail = encrypt(rootEmail);

  // Check if root owner exists
  const existingRoot = await prisma.user.findFirst({
    where: { emailIndex },
  });

  if (existingRoot) {
    console.log('Root owner already exists.');
    return;
  }

  const passwordHash = await argon2.hash(rootPassword, { type: argon2.argon2id });

  await prisma.user.create({
    data: {
      encryptedEmail,
      emailIndex,
      passwordHash,
      role: 'ROOT_OWNER',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        create: {
          name: 'Founder Tanish',
        },
      },
      wallets: {
        create: {
          balance: 0,
        },
      },
    },
  });

  console.log('Root owner created successfully on Live Database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
