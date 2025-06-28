const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Simple payments data without relying on other tables
    const payments = [
      {
        id: "payment-001",
        paymentDate: new Date('2024-01-02'),
        amount: 1000000,
        paymentMethod: "Transfer Bank",
        referenceNumber: "TRF-20240102-001",
        status: "Paid",
        registrationId: "registration-001",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "payment-002",
        paymentDate: new Date('2024-01-10'),
        amount: 1000000,
        paymentMethod: "E-Wallet",
        referenceNumber: "EWL-20240110-001",
        status: "Unpaid",
        registrationId: "registration-002",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "payment-003",
        paymentDate: new Date('2024-01-05'),
        amount: 1500000,
        paymentMethod: "Kartu Kredit",
        referenceNumber: "CC-20240105-002",
        status: "Unpaid",
        registrationId: "registration-003",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "payment-004",
        paymentDate: new Date('2024-02-12'),
        amount: 2000000,
        paymentMethod: "Transfer Bank",
        referenceNumber: "TRF-20240212-002",
        status: "Paid",
        registrationId: "registration-004",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "payment-005",
        paymentDate: new Date('2024-02-03'),
        amount: 2000000,
        paymentMethod: "E-Wallet",
        referenceNumber: "EWL-20240203-002",
        status: "Paid",
        registrationId: "registration-005",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    console.log("Attempting to seed payments directly to the database...");

    // Insert payments directly using prisma.$executeRaw to bypass foreign key constraints
    // This is just for testing and should not be used in production
    for (const payment of payments) {
      try {
        await prisma.$executeRaw`
          INSERT INTO payment (id, paymentDate, amount, paymentMethod, referenceNumber, status, registrationId, createdAt, updatedAt)
          VALUES (
            ${payment.id},
            ${payment.paymentDate},
            ${payment.amount},
            ${payment.paymentMethod},
            ${payment.referenceNumber},
            ${payment.status},
            ${payment.registrationId},
            ${payment.createdAt},
            ${payment.updatedAt}
          )
          ON DUPLICATE KEY UPDATE
            id = id
        `;
        console.log(`Added payment: ${payment.referenceNumber}`);
      } catch (error) {
        console.error(`Error adding payment ${payment.referenceNumber}:`, error);
      }
    }

    // Verify payments were added
    const count = await prisma.payment.count();
    console.log(`Total payments in database: ${count}`);

  } catch (error) {
    console.error('Error seeding payments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Simple payments seed completed'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 