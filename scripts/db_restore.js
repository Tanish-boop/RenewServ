const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

async function runRestore() {
  const args = process.argv.slice(2);
  const fileArg = args[0];

  if (!fileArg) {
    console.error('❌ Error: Please specify a backup file name to restore. Example:\n   node scripts/db_restore.js db_backup_2026-06-29T15-44-48.json');
    process.exit(1);
  }

  const backupPath = path.isAbsolute(fileArg) ? fileArg : path.join(__dirname, '..', 'backups', fileArg);

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Error: Backup file not found at path: ${backupPath}`);
    process.exit(1);
  }

  console.log(`=== STARTING DATABASE RESTORE FROM: ${path.basename(backupPath)} ===\n`);

  try {
    const rawData = fs.readFileSync(backupPath, 'utf-8');
    const backupData = JSON.parse(rawData);

    // Truncate tables in reverse order to respect foreign key constraints
    console.log('Clearing existing database records...');
    for (let i = tablesOrdered.length - 1; i >= 0; i--) {
      const table = tablesOrdered[i];
      if (typeof prisma[table]?.deleteMany === 'function') {
        await prisma[table].deleteMany({});
      }
    }
    console.log('Database cleared.\n');

    // Restore records in chronological order
    for (const table of tablesOrdered) {
      const records = backupData[table] || [];
      if (records.length === 0) continue;

      console.log(`Restoring ${records.length} records into table: ${table}...`);
      
      // We perform bulk inserts or iterate to preserve custom generated fields and keys
      for (const rec of records) {
        // Parse date strings back to Date objects
        const parsedRecord = { ...rec };
        for (const [key, val] of Object.entries(parsedRecord)) {
          if (val && typeof val === 'string' && (key.endsWith('At') || key === 'checkIn' || key === 'checkOut')) {
            parsedRecord[key] = new Date(val);
          }
        }

        await prisma[table].create({
          data: parsedRecord
        });
      }
    }

    console.log(`\n🎉 Database restore completed successfully!`);
  } catch (err) {
    console.error('❌ Database restore failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runRestore();
