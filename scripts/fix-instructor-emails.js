const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function fixInstructorEmails() {
  try {
    console.log('🔧 Starting instructor email fix process...');

    // Get all instructors
    const instructors = await prisma.instructure.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });

    console.log(`Found ${instructors.length} instructors`);

    // Get instructor user type
    const instructorUserType = await prisma.userType.findFirst({
      where: { usertype: 'Instructure' }
    });

    if (!instructorUserType) {
      console.error('❌ Instructor user type not found');
      return;
    }

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const instructor of instructors) {
      console.log(`\n📋 Processing instructor: ${instructor.full_name} (${instructor.id})`);
      
      // Check if instructor already has user accounts
      const hasUserAccounts = instructor.user && instructor.user.length > 0;
      const directUser = await prisma.user.findFirst({
        where: { instructureId: instructor.id }
      });

      if (hasUserAccounts || directUser) {
        console.log(`   ⏭️  Skipping - already has user account(s)`);
        skippedCount++;
        continue;
      }

      try {
        // Generate email and username
        const baseName = instructor.full_name.toLowerCase().replace(/[^a-z0-9]/g, '.');
        let email = `${baseName}@train4best.com`;
        let username = baseName;
        let counter = 1;

        // Check if email already exists
        while (await prisma.user.findUnique({ where: { email } })) {
          email = `${baseName}${counter}@train4best.com`;
          username = `${baseName}${counter}`;
          counter++;
        }

        // Check if username already exists
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseName}${counter}`;
          counter++;
        }

        // Create user account
        const hashedPassword = await bcrypt.hash('instructor123', 10);
        const newUser = await prisma.user.create({
          data: {
            id: uuidv4(),
            email,
            username,
            password: hashedPassword,
            userTypeId: instructorUserType.id,
            instructureId: instructor.id
          }
        });

        console.log(`   ✅ Created user account: ${email}`);
        fixedCount++;

      } catch (error) {
        console.error(`   ❌ Error creating user for ${instructor.full_name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} instructors`);
    console.log(`   ⏭️  Skipped: ${skippedCount} instructors`);
    console.log(`   ❌ Errors: ${errorCount} instructors`);

    if (fixedCount > 0) {
      console.log('\n🎉 Successfully fixed instructor email issues!');
      console.log('   Default password for new accounts: instructor123');
    }

  } catch (error) {
    console.error('❌ Error in fix process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixInstructorEmails()
  .then(() => {
    console.log('\n🏁 Fix process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  }); 