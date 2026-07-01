const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Lead table connection...');
  try {
    const lead = await prisma.lead.create({
      data: {
        name: 'Test Lead via Script',
        email: 'test_lead_script@example.com',
        phone: '1234567890',
        serviceInterested: 'Solar Panel Cleaning',
        source: 'WEBSITE',
        status: 'NEW',
        notes: 'Pincode 123456 out of coverage check',
      }
    });
    console.log('Successfully created lead:', lead);
    
    // Cleanup the test lead
    await prisma.lead.delete({
      where: { id: lead.id }
    });
    console.log('Cleaned up the test lead successfully!');
  } catch (err) {
    console.error('Error testing Lead table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
