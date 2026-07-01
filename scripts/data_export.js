const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runExport() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all'; // users, bookings, payments, all
  const format = args[1] || 'json'; // json, csv

  console.log(`=== STARTING DATA EXPORT [Target: ${target}, Format: ${format}] ===\n`);

  try {
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (target === 'users' || target === 'all') {
      console.log('Exporting users...');
      const users = await prisma.user.findMany({
        include: { profile: true },
        where: { deletedAt: null }
      });

      if (format === 'csv') {
        let csv = 'ID,Role,Name,CreatedAt\n';
        users.forEach(u => {
          csv += `"${u.id}","${u.role}","${u.profile?.name || ''}","${u.createdAt.toISOString()}"\n`;
        });
        const filepath = path.join(exportsDir, `users_export_${timestamp}.csv`);
        fs.writeFileSync(filepath, csv, 'utf-8');
        console.log(`Saved users CSV to: ${filepath}`);
      } else {
        const filepath = path.join(exportsDir, `users_export_${timestamp}.json`);
        fs.writeFileSync(filepath, JSON.stringify(users, null, 2), 'utf-8');
        console.log(`Saved users JSON to: ${filepath}`);
      }
    }

    if (target === 'bookings' || target === 'all') {
      console.log('Exporting bookings...');
      const bookings = await prisma.booking.findMany({
        include: { address: true },
        where: { deletedAt: null }
      });

      if (format === 'csv') {
        let csv = 'ID,CustomerID,ServiceType,ScheduledDate,ScheduledTime,Status,Emergency,CreatedAt\n';
        bookings.forEach(b => {
          csv += `"${b.id}","${b.customerId}","${b.serviceType}","${b.scheduledDate}","${b.scheduledTime}","${b.status}",${b.isEmergency},"${b.createdAt.toISOString()}"\n`;
        });
        const filepath = path.join(exportsDir, `bookings_export_${timestamp}.csv`);
        fs.writeFileSync(filepath, csv, 'utf-8');
        console.log(`Saved bookings CSV to: ${filepath}`);
      } else {
        const filepath = path.join(exportsDir, `bookings_export_${timestamp}.json`);
        fs.writeFileSync(filepath, JSON.stringify(bookings, null, 2), 'utf-8');
        console.log(`Saved bookings JSON to: ${filepath}`);
      }
    }

    if (target === 'payments' || target === 'all') {
      console.log('Exporting payments...');
      const payments = await prisma.payment.findMany();

      if (format === 'csv') {
        let csv = 'ID,BookingID,Amount,Type,Status,TransactionID,CreatedAt\n';
        payments.forEach(p => {
          csv += `"${p.id}","${p.bookingId}",${p.amount},"${p.type}","${p.status}","${p.transactionId}","${p.createdAt.toISOString()}"\n`;
        });
        const filepath = path.join(exportsDir, `payments_export_${timestamp}.csv`);
        fs.writeFileSync(filepath, csv, 'utf-8');
        console.log(`Saved payments CSV to: ${filepath}`);
      } else {
        const filepath = path.join(exportsDir, `payments_export_${timestamp}.json`);
        fs.writeFileSync(filepath, JSON.stringify(payments, null, 2), 'utf-8');
        console.log(`Saved payments JSON to: ${filepath}`);
      }
    }

    console.log('\n🎉 Data export finished successfully!');
  } catch (err) {
    console.error('❌ Data export failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runExport();
