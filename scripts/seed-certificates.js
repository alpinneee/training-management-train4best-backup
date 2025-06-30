const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get some participants for linking
    const participants = await prisma.participant.findMany({
      take: 5,
    });

    // Get some courses for linking
    const courses = await prisma.course.findMany({
      take: 3,
    });

    // Sample certificate data
    const certificates = [
      {
        certificateNumber: 'CERT-2023-001',
        name: 'Ilham Ramadhan',
        issueDate: new Date('2023-03-20'),
        expiryDate: new Date('2024-03-20'),
        status: 'Expired',
        participantId: participants[0]?.id,
        courseId: courses[0]?.id,
      },
      {
        certificateNumber: 'CERT-2023-002',
        name: 'Risky Febriana',
        issueDate: new Date('2023-01-26'),
        expiryDate: new Date('2024-01-26'),
        status: 'Expired',
        participantId: participants[1]?.id,
        courseId: courses[0]?.id,
      },
      {
        certificateNumber: 'CERT-2023-003',
        name: 'Alfine Makarizo',
        issueDate: new Date('2023-03-21'),
        expiryDate: new Date('2024-03-21'),
        status: 'Expired',
        participantId: participants[2]?.id,
        courseId: courses[1]?.id,
      },
      {
        certificateNumber: 'CERT-2023-004',
        name: 'Cyntia Febiola',
        issueDate: new Date('2023-05-08'),
        expiryDate: new Date('2024-05-08'),
        status: 'Expired',
        participantId: participants[3]?.id,
        courseId: courses[1]?.id,
      },
      {
        certificateNumber: 'CERT-2023-005',
        name: 'Saska Khairani',
        issueDate: new Date('2023-12-20'),
        expiryDate: new Date('2024-12-20'),
        status: 'Valid',
        participantId: participants[4]?.id,
        courseId: courses[2]?.id,
      },
      {
        certificateNumber: 'CERT-2024-001',
        name: 'Bayu Prasetyo',
        issueDate: new Date('2024-01-15'),
        expiryDate: new Date('2025-01-15'),
        status: 'Valid',
        participantId: null,
        courseId: courses[0]?.id,
      },
      {
        certificateNumber: 'CERT-2024-002',
        name: 'Diana Putri',
        issueDate: new Date('2024-02-10'),
        expiryDate: new Date('2025-02-10'),
        status: 'Valid',
        participantId: null,
        courseId: courses[1]?.id,
      },
    ];

    // Insert certificates
    for (const cert of certificates) {
      await prisma.certificate.create({
        data: cert,
      });
    }

    console.log(`Created ${certificates.length} certificates`);
  } catch (error) {
    console.error('Error seeding certificates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Certificates seed completed'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 