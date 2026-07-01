const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const argon2 = require('argon2');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      process.env[key] = val;
    }
  });
}

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

async function seed() {
  console.log("Seeding RenewServ data with correct models...");
  const passwordHash = await argon2.hash("Password123", { type: argon2.argon2id });

  try {
    // 1. Delete all existing data to start clean
    await prisma.technicianAssignment.deleteMany();
    await prisma.ledger.deleteMany();
    await prisma.ticketMessage.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.task.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.technician.deleteMany();
    await prisma.address.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.user.deleteMany();
    await prisma.territory.deleteMany();
    await prisma.city.deleteMany();

    // 2. Create City & Territories
    const city = await prisma.city.create({
      data: { name: 'Pune', state: 'Maharashtra', isActive: true }
    });

    const terr1 = await prisma.territory.create({
      data: { name: 'Kothrud', cityId: city.id, postalCodes: '411038,411029', isActive: true }
    });
    const terr2 = await prisma.territory.create({
      data: { name: 'Shivaji Nagar', cityId: city.id, postalCodes: '411005,411001', isActive: true }
    });

    // 3. Create Root Owner (Tanish)
    const tanishEmail = 'tanish.thakare2005@gmail.com';
    const tanishPhone = '9657331331';
    await prisma.user.create({
      data: {
        encryptedEmail: encrypt(tanishEmail),
        emailIndex: makeBlindIndex(tanishEmail),
        encryptedPhone: encrypt(tanishPhone),
        phoneIndex: makeBlindIndex(tanishPhone),
        passwordHash,
        role: 'ROOT_OWNER',
        emailVerified: true,
        phoneVerified: true,
        profile: { create: { name: 'Founder Tanish' } },
        wallets: { create: { balance: 5000, promoBalance: 0 } }
      }
    });
    console.log("Root Owner created!");

    // 4. Create Standard Owner
    const ownerEmail = 'operator@renewserv.com';
    const ownerPhone = '9823456789';
    await prisma.user.create({
      data: {
        encryptedEmail: encrypt(ownerEmail),
        emailIndex: makeBlindIndex(ownerEmail),
        encryptedPhone: encrypt(ownerPhone),
        phoneIndex: makeBlindIndex(ownerPhone),
        passwordHash,
        role: 'OWNER',
        emailVerified: true,
        phoneVerified: true,
        profile: { create: { name: 'Operator Rohan' } },
        wallets: { create: { balance: 0, promoBalance: 0 } }
      }
    });
    console.log("Owner Operator created!");

    // 5. Create Technician
    const techEmail = 'ramesh@renewserv.com';
    const techPhone = '9123456780';
    const techUser = await prisma.user.create({
      data: {
        encryptedEmail: encrypt(techEmail),
        emailIndex: makeBlindIndex(techEmail),
        encryptedPhone: encrypt(techPhone),
        phoneIndex: makeBlindIndex(techPhone),
        passwordHash,
        role: 'TECHNICIAN',
        emailVerified: true,
        phoneVerified: true,
        profile: { create: { name: 'Ramesh Pawar' } }
      }
    });

    const technician = await prisma.technician.create({
      data: {
        userId: techUser.id,
        employeeId: 'EMP-001',
        isAvailable: true,
        territoryId: terr2.id
      }
    });
    console.log("Technician created!");

    // 6. Create Customer (Amit)
    const custEmail = 'amit@gmail.com';
    const custPhone = '9988776655';
    const custUser = await prisma.user.create({
      data: {
        encryptedEmail: encrypt(custEmail),
        emailIndex: makeBlindIndex(custEmail),
        encryptedPhone: encrypt(custPhone),
        phoneIndex: makeBlindIndex(custPhone),
        passwordHash,
        role: 'CLIENT',
        emailVerified: true,
        phoneVerified: true,
        profile: { create: { name: 'Amit Kumar', notes: 'Prefers morning cleaning services. Large 5kW setup.' } },
        wallets: { create: { balance: 450.0, promoBalance: 100.0 } }
      }
    });
    console.log("Customer created!");

    // 7. Create Addresses
    const addr1 = await prisma.address.create({
      data: {
        userId: custUser.id,
        label: 'Home Roof',
        encryptedAddress: encrypt('Flat 402, Sunshine Towers, Shivaji Nagar'),
        postalCode: '411005',
        encryptedGps: encrypt('18.5312, 73.8445')
      }
    });

    const addr2 = await prisma.address.create({
      data: {
        userId: custUser.id,
        label: 'Office Setup',
        encryptedAddress: encrypt('RenewServ Hub, Kothrud'),
        postalCode: '411038',
        encryptedGps: encrypt('18.5018, 73.8016')
      }
    });

    // 8. Create Bookings
    // Booking 1: Completed
    const b1 = await prisma.booking.create({
      data: {
        customerId: custUser.id,
        serviceType: 'PANEL_CLEANING',
        scheduledDate: '2026-06-28',
        scheduledTime: '10:00 AM',
        status: 'COMPLETED',
        addressId: addr1.id,
        bookingFeePaid: true,
        advancePaid: true,
        finalPaid: true,
        quote: {
          create: {
            panelCount: 12,
            systemSizeKw: 3.5,
            cleaningCost: 900,
            dismantlingCost: 0,
            partsCost: 0,
            tax: 162,
            discount: 0,
            totalAmount: 1062,
            notes: 'Standard wash package',
            status: 'APPROVED'
          }
        }
      }
    });

    // Booking 2: Pending Quote
    const b2 = await prisma.booking.create({
      data: {
        customerId: custUser.id,
        serviceType: 'PANEL_CLEANING',
        scheduledDate: '2026-07-02',
        scheduledTime: '11:00 AM',
        status: 'PENDING',
        addressId: addr2.id,
        bookingFeePaid: true,
        advancePaid: false,
        finalPaid: false
      }
    });

    // Booking 3: Assigned to Technician
    const b3 = await prisma.booking.create({
      data: {
        customerId: custUser.id,
        serviceType: 'SOLAR_PANEL_REMOVAL_REINSTALLATION',
        scheduledDate: '2026-07-03',
        scheduledTime: '02:00 PM',
        status: 'ASSIGNED',
        addressId: addr1.id,
        bookingFeePaid: true,
        advancePaid: false,
        finalPaid: false,
        quote: {
          create: {
            panelCount: 16,
            systemSizeKw: 5.0,
            cleaningCost: 1200,
            dismantlingCost: 1500,
            partsCost: 300,
            tax: 540,
            discount: 100,
            totalAmount: 3440,
            notes: 'Dismantling for structural roof repairs',
            status: 'APPROVED'
          }
        }
      }
    });

    await prisma.technicianAssignment.create({
      data: {
        bookingId: b3.id,
        technicianId: technician.id,
        status: 'ASSIGNED'
      }
    });

    console.log("Bookings created!");

    // 9. Create Support Tickets
    const ticket = await prisma.supportTicket.create({
      data: {
        customerId: custUser.id,
        category: 'GENERAL',
        subject: 'Inquiry on AMC Package',
        status: 'OPEN',
        priority: 'MEDIUM',
        messages: {
          create: {
            senderId: custUser.id,
            message: 'Hello, I want to sign up my residential panels for a 1-year clean subscription. Please call me back.'
          }
        }
      }
    });
    console.log("Support Ticket created!");

    // 10. Create Leads
    await prisma.lead.createMany({
      data: [
        {
          name: 'Milind Soni',
          phone: '9566778899',
          email: 'milind@soni.com',
          serviceInterested: 'Solar Panel Cleaning',
          source: 'GOOGLE',
          status: 'NEW',
          notes: 'Has a warehouse roof in Shivaji Nagar. 45 panels.'
        },
        {
          name: 'Kiran Mane',
          phone: '9844332211',
          email: 'kiran@mane.com',
          serviceInterested: 'Solar Panel Removal & Reinstallation',
          source: 'WHATSAPP',
          status: 'INTERESTED',
          notes: 'Wants to clear panels for waterproofing repairs.'
        }
      ]
    });
    console.log("Leads created!");

    // 11. Create Tasks
    await prisma.task.createMany({
      data: [
        {
          title: 'Call Milind Soni about warehouse quote',
          description: 'Calculate discount for bulk cleaning (45 panels)',
          status: 'PENDING',
          priority: 'HIGH',
          assignedTo: 'Founder Tanish'
        },
        {
          title: 'Review double entry logs for June matching',
          description: 'Reconcile Razorpay test deposits with ledger accounts',
          status: 'PENDING',
          priority: 'MEDIUM',
          assignedTo: 'Founder Tanish'
        }
      ]
    });
    console.log("Tasks created!");

    // 12. Create Ledger Entries
    await prisma.ledger.createMany({
      data: [
        {
          sourceAccount: 'RAZORPAY_GATEWAY',
          destinationAccount: 'RENEWSERV_ESCROW',
          amount: 99.0,
          referenceId: b1.id,
          description: '99rs deposit hold for completed wash'
        },
        {
          sourceAccount: 'RENEWSERV_ESCROW',
          destinationAccount: 'RENEWSERV_REVENUE',
          amount: 900.0,
          referenceId: b1.id,
          description: 'Final payment clearing upon clean success'
        }
      ]
    });
    console.log("Ledger items created!");

    console.log("=== SEEDING COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
