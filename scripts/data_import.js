const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runImport() {
  const args = process.argv.slice(2);
  const fileArg = args[0];
  const target = args[1]; // users, bookings, payments

  if (!fileArg || !target) {
    console.error('❌ Error: Please specify import filepath and collection target. Example:\n   node scripts/data_import.js exports/users_export_2026-06-29.json users');
    process.exit(1);
  }

  const importPath = path.isAbsolute(fileArg) ? fileArg : path.join(__dirname, '..', fileArg);

  if (!fs.existsSync(importPath)) {
    console.error(`❌ Error: Import file not found at path: ${importPath}`);
    process.exit(1);
  }

  console.log(`=== STARTING DATA IMPORT [Target: ${target}, Path: ${path.basename(importPath)}] ===\n`);

  try {
    const rawData = fs.readFileSync(importPath, 'utf-8');
    const records = JSON.parse(rawData);

    if (!Array.isArray(records)) {
      throw new Error('Import data must be a JSON array of records');
    }

    let successCount = 0;

    for (const rec of records) {
      if (target === 'users') {
        const emailIndex = rec.emailIndex;
        const exists = await prisma.user.findFirst({ where: { emailIndex } });
        if (exists) {
          console.warn(`User with emailIndex ${emailIndex} already exists, skipping.`);
          continue;
        }

        const parsedRecord = {
          id: rec.id,
          encryptedEmail: rec.encryptedEmail,
          emailIndex: rec.emailIndex,
          encryptedPhone: rec.encryptedPhone,
          phoneIndex: rec.phoneIndex,
          passwordHash: rec.passwordHash,
          role: rec.role,
          emailVerified: rec.emailVerified,
          phoneVerified: rec.phoneVerified,
          createdAt: new Date(rec.createdAt),
          updatedAt: new Date(rec.updatedAt),
        };

        await prisma.user.create({ data: parsedRecord });
        
        if (rec.profile) {
          await prisma.profile.upsert({
            where: { userId: rec.id },
            update: { name: rec.profile.name, avatarUrl: rec.profile.avatarUrl },
            create: { userId: rec.id, name: rec.profile.name, avatarUrl: rec.profile.avatarUrl }
          });
        }
        successCount++;
      }

      if (target === 'bookings') {
        const exists = await prisma.booking.findUnique({ where: { id: rec.id } });
        if (exists) {
          console.warn(`Booking with ID ${rec.id} already exists, skipping.`);
          continue;
        }

        // Ensure associated address exists or create mock address
        let address = await prisma.address.findUnique({ where: { id: rec.addressId } });
        if (!address && rec.address) {
          await prisma.address.create({
            data: {
              id: rec.addressId,
              userId: rec.customerId,
              label: rec.address.label,
              encryptedAddress: rec.address.encryptedAddress,
              postalCode: rec.address.postalCode,
            }
          });
        }

        const parsedRecord = {
          id: rec.id,
          customerId: rec.customerId,
          addressId: rec.addressId,
          serviceType: rec.serviceType,
          scheduledDate: rec.scheduledDate,
          scheduledTime: rec.scheduledTime,
          status: rec.status,
          isEmergency: rec.isEmergency,
          bookingFeePaid: rec.bookingFeePaid,
          advancePaid: rec.advancePaid,
          finalPaid: rec.finalPaid,
          createdAt: new Date(rec.createdAt),
          updatedAt: new Date(rec.updatedAt),
        };

        await prisma.booking.create({ data: parsedRecord });
        successCount++;
      }

      if (target === 'payments') {
        const exists = await prisma.payment.findUnique({ where: { transactionId: rec.transactionId } });
        if (exists) {
          console.warn(`Payment transaction ${rec.transactionId} already exists, skipping.`);
          continue;
        }

        const parsedRecord = {
          id: rec.id,
          bookingId: rec.bookingId,
          amount: rec.amount,
          type: rec.type,
          status: rec.status,
          provider: rec.provider,
          transactionId: rec.transactionId,
          idempotencyKey: rec.idempotencyKey,
          createdAt: new Date(rec.createdAt),
        };

        await prisma.payment.create({ data: parsedRecord });
        successCount++;
      }
    }

    console.log(`\n🎉 Data import completed successfully! Imported ${successCount} records.`);
  } catch (err) {
    console.error('❌ Data import failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runImport();
