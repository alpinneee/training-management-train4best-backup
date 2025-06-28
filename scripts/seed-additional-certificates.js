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

    // Sample certificate data with unique certificate numbers
    const certificates = [
      {
        certificateNumber: 'CERT-2024-101',
        name: 'Ahmad Fauzi',
        issueDate: new Date('2024-01-15'),
        expiryDate: new Date('2025-01-15'),
        status: 'Valid',
        participantId: participants[0]?.id,
        courseId: courses[0]?.id,
      },
      {
        certificateNumber: 'CERT-2024-102',
        name: 'Dian Sastro',
        issueDate: new Date('2024-02-10'),
        expiryDate: new Date('2025-02-10'),
        status: 'Valid',
        participantId: participants[1]?.id,
        courseId: courses[0]?.id,
      },
      {
        certificateNumber: 'CERT-2024-103',
        name: 'Reza Rahadian',
        issueDate: new Date('2024-03-05'),
        expiryDate: new Date('2025-03-05'),
        status: 'Valid',
        participantId: participants[2]?.id,
        courseId: courses[1]?.id,
      },
      {
        certificateNumber: 'CERT-2023-104',
        name: 'Bunga Citra',
        issueDate: new Date('2023-06-20'),
        expiryDate: new Date('2024-06-20'),
        status: 'Valid',
        participantId: participants[3]?.id,
        courseId: courses[1]?.id,
      },
      {
        certificateNumber: 'CERT-2023-105',
        name: 'Rizky Febian',
        issueDate: new Date('2023-08-15'),
        expiryDate: new Date('2024-08-15'),
        status: 'Valid',
        participantId: participants[4]?.id,
        courseId: courses[2]?.id,
      },
      {
        certificateNumber: 'CERT-2023-106',
        name: 'Raisa Andriana',
        issueDate: new Date('2023-10-05'),
        expiryDate: new Date('2024-02-05'),
        status: 'Expired',
        participantId: null,
        courseId: courses[0]?.id,
      },
      {
        certificateNumber: 'CERT-2023-107',
        name: 'Aliando Syarief',
        issueDate: new Date('2023-04-12'),
        expiryDate: new Date('2024-04-12'),
        status: 'Expired',
        participantId: null,
        courseId: courses[2]?.id,
      },
      {
        certificateNumber: 'CERT-2023-108',
        name: 'Maudy Ayunda',
        issueDate: new Date('2023-05-22'),
        expiryDate: new Date('2024-05-22'),
        status: 'Valid',
        participantId: null,
        courseId: courses[1]?.id,
      },
      {
        certificateNumber: 'CERT-2022-109',
        name: 'Nicholas Saputra',
        issueDate: new Date('2022-11-30'),
        expiryDate: new Date('2023-11-30'),
        status: 'Expired',
        participantId: null,
        courseId: courses[0]?.id,
      },
      {
        certificateNumber: 'CERT-2022-110',
        name: 'Chelsea Islan',
        issueDate: new Date('2022-12-15'),
        expiryDate: new Date('2023-12-15'),
        status: 'Expired',
        participantId: null,
        courseId: courses[2]?.id,
      },
    ];

    // Insert certificates
    let inserted = 0;
    for (const cert of certificates) {
      try {
        // Check if certificate number already exists
        const existing = await prisma.certificate.findUnique({
          where: { certificateNumber: cert.certificateNumber },
        });
        
        if (!existing) {
          await prisma.certificate.create({
            data: cert,
          });
          inserted++;
        } else {
          console.log(`Certificate ${cert.certificateNumber} already exists, skipping.`);
        }
      } catch (error) {
        console.error(`Error inserting certificate ${cert.certificateNumber}:`, error);
      }
    }

    console.log(`Successfully created ${inserted} certificates`);
  } catch (error) {
    console.error('Error seeding certificates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Additional certificates seed completed'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 