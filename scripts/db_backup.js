const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runBackup() {
  console.log('=== STARTING DATABASE BACKUP ===');
  
  const tables = [
    'user',
    'profile',
    'city',
    'territory',
    'address',
    'booking',
    'technician',
    'technicianAttendance',
    'technicianAssignment',
    'payment',
    'ledger',
    'paymentAudit',
    'webhookEvent',
    'quote',
    'inspectionReport',
    'jobImage',
    'review',
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
    'invoice',
    'conversation',
    'message',
    'notificationLog',
    'whatsappMessage',
    'emailLog',
    'smsLog'
  ];

  const backupData = {};

  try {
    for (const table of tables) {
      if (typeof prisma[table]?.findMany === 'function') {
        console.log(`Backing up table: ${table}...`);
        backupData[table] = await prisma[table].findMany();
      } else {
        console.warn(`Prisma model handler not found for: ${table}`);
      }
    }

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `db_backup_${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    console.log(`\n🎉 Backup completed successfully!`);
    console.log(`Backup saved to: ${filePath}`);
    console.log(`Total tables backed up: ${Object.keys(backupData).length}`);
  } catch (err) {
    console.error('❌ Database backup failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
