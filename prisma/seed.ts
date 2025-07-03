import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create user types
  console.log('Creating user types...');
  
  const userTypes = [
    { id: uuidv4(), usertype: 'Admin', description: 'Administrator with full access', status: 'Active' },
    { id: uuidv4(), usertype: 'Instructure', description: 'Training instructure', status: 'Active' },
    { id: uuidv4(), usertype: 'Participant', description: 'Training participant/student', status: 'Active' },
    { id: uuidv4(), usertype: 'Staff', description: 'Administrative staff', status: 'Active' }
  ];

  for (const userType of userTypes) {
    // Check if user type already exists to avoid duplicates
    const existingUserType = await prisma.userType.findFirst({
      where: { usertype: userType.usertype }
    });

    if (!existingUserType) {
      await prisma.userType.create({
        data: userType
      });
      console.log(`Created user type: ${userType.usertype}`);
    } else {
      console.log(`User type ${userType.usertype} already exists, skipping...`);
    }
  }

  // Get the admin user type ID
  const adminUserType = await prisma.userType.findFirst({
    where: { usertype: 'Admin' }
  });

  if (!adminUserType) {
    throw new Error('Admin user type not found, cannot create admin user');
  }

  // Create admin user
  console.log('Creating admin user...');
  const adminId = uuidv4();
  const adminEmail = 'admin@train4best.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create the admin user
    await prisma.user.create({
      data: {
        id: adminId,
        email: adminEmail,
        username: 'admin',
        password: hashedPassword,
        userTypeId: adminUserType.id,
      }
    });
    console.log(`Created admin user with email: ${adminEmail}`);
  } else {
    console.log(`Admin user with email ${adminEmail} already exists, skipping...`);
  }

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 