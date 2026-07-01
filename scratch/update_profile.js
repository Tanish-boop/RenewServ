const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const BLIND_INDEX_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

function makeBlindIndex(text) {
  if (!text) return '';
  return crypto
    .createHmac('sha256', Buffer.from(BLIND_INDEX_KEY, 'hex'))
    .update(text.toLowerCase().trim())
    .digest('hex');
}

async function main() {
  const email = 'tanish.thakare2005@gmail.com';
  const emailIndex = makeBlindIndex(email);
  
  const user = await prisma.user.findFirst({
    where: { emailIndex },
    include: { profile: true }
  });
  
  if (!user) {
    console.log(`User with email ${email} not found.`);
    return;
  }
  
  // Update role to ROOT_OWNER and name to 'Founder Tanish'
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: 'ROOT_OWNER',
      profile: {
        update: {
          name: 'Founder Tanish'
        }
      }
    },
    include: { profile: true }
  });
  
  console.log(`Successfully updated user:`);
  console.log(`ID: ${updatedUser.id}`);
  console.log(`Role: ${updatedUser.role}`);
  console.log(`Name: ${updatedUser.profile ? updatedUser.profile.name : 'No Profile'}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
