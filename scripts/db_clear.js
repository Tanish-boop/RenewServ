const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tablesOrdered = [
  'city',
  'territory',
  'user',
  'profile',
  'address',
  'technician',
  'technicianAttendance',
  'booking',
  'technicianAssignment',
  'payment',
  'quote',
  'inspectionReport',
  'jobImage',
  'review',
  'invoice',
  'wallet',
  'walletTransaction',
  'referral',
  'supportTicket',
  'ticketMessage',
  'notification',
  'auditLog',
  'securityEvent',
  'failedLogin',
  'otpRequest',
  'blogArticle',
  'conversation',
  'message',
  'notificationLog',
  'whatsappMessage',
  'emailLog',
  'smsLog',
  'ledger',
  'paymentAudit',
  'webhookEvent'
];

async function clearDatabase() {
  console.log('🤖 CLEARING ALL DATABASE ENTRIES FOR RENEWSERV...');
  
  try {
    // Truncate tables in reverse order to respect foreign key constraints
    for (let i = tablesOrdered.length - 1; i >= 0; i--) {
      const table = tablesOrdered[i];
      if (typeof prisma[table]?.deleteMany === 'function') {
        console.log(`- Truncating table: ${table}...`);
        await prisma[table].deleteMany({});
      }
    }
    console.log('\n🎉 All database entries cleared successfully! The database is now fresh.');
  } catch (err) {
    console.error('❌ Failed to clear database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
