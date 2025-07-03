const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get some course registrations for linking
    const registrations = await prisma.courseRegistration.findMany({
      take: 5,
      include: {
        participant: true,
      },
    });

    if (registrations.length === 0) {
      console.log("No course registrations found to link payments to.");
      return;
    }

    console.log(`Found ${registrations.length} course registrations for seeding payments.`);

    // Sample payment data
    const payments = [
      {
        paymentDate: new Date('2024-01-02'),
        amount: 1000000,
        paymentMethod: "Transfer Bank",
        referenceNumber: "TRF-20240102-001",
        status: "Paid",
        registrationId: registrations[0]?.id,
      },
      {
        paymentDate: new Date('2024-01-10'),
        amount: 1000000,
        paymentMethod: "E-Wallet",
        referenceNumber: "EWL-20240110-001",
        status: "Unpaid",
        registrationId: registrations[1]?.id,
      },
      {
        paymentDate: new Date('2024-01-05'),
        amount: 1500000,
        paymentMethod: "Kartu Kredit",
        referenceNumber: "CC-20240105-002",
        status: "Unpaid",
        registrationId: registrations[2]?.id,
      },
      {
        paymentDate: new Date('2024-02-12'),
        amount: 2000000,
        paymentMethod: "Transfer Bank",
        referenceNumber: "TRF-20240212-002",
        status: "Paid",
        registrationId: registrations[3]?.id,
      },
      {
        paymentDate: new Date('2024-02-03'),
        amount: 2000000,
        paymentMethod: "E-Wallet",
        referenceNumber: "EWL-20240203-002",
        status: "Paid",
        registrationId: registrations[4]?.id,
      },
      {
        paymentDate: new Date('2024-03-10'),
        amount: 1750000,
        paymentMethod: "Transfer Bank",
        referenceNumber: "TRF-20240310-003",
        status: "Unpaid",
        registrationId: registrations[0]?.id,
      },
      {
        paymentDate: new Date('2024-03-15'),
        amount: 2500000,
        paymentMethod: "Kartu Kredit",
        referenceNumber: "CC-20240315-001",
        status: "Paid",
        registrationId: registrations[1]?.id,
      },
    ];

    // Insert payments
    let inserted = 0;
    for (const payment of payments) {
      try {
        // Check if reference number already exists
        const existing = await prisma.payment.findUnique({
          where: { referenceNumber: payment.referenceNumber },
        });
        
        if (!existing) {
          await prisma.payment.create({
            data: payment,
          });
          inserted++;
          console.log(`Created payment with reference ${payment.referenceNumber}`);
        } else {
          console.log(`Payment with reference ${payment.referenceNumber} already exists, skipping.`);
        }
      } catch (error) {
        console.error(`Error inserting payment ${payment.referenceNumber}:`, error);
      }
    }

    console.log(`Successfully created ${inserted} payments`);
  } catch (error) {
    console.error('Error seeding payments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Payments seed completed'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 