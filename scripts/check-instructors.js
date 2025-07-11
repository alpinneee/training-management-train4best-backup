const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInstructors() {
  try {
    console.log('🔍 Checking instructor status...');

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

    console.log(`Found ${instructors.length} instructors:\n`);

    instructors.forEach((instructor, index) => {
      console.log(`${index + 1}. ${instructor.full_name} (${instructor.id})`);
      console.log(`   Phone: ${instructor.phone_number}`);
      console.log(`   Proficiency: ${instructor.profiency}`);
      console.log(`   User accounts: ${instructor.user.length}`);
      
      if (instructor.user.length > 0) {
        instructor.user.forEach((user, userIndex) => {
          console.log(`     ${userIndex + 1}. ${user.email} (${user.username})`);
        });
      } else {
        console.log('     ❌ No user account found');
      }
      console.log('');
    });

    // Check direct user relationships
    console.log('🔍 Checking direct user relationships...\n');
    
    for (const instructor of instructors) {
      const directUser = await prisma.user.findFirst({
        where: { instructureId: instructor.id }
      });
      
      if (directUser) {
        console.log(`✅ ${instructor.full_name}: Has direct user (${directUser.email})`);
      } else {
        console.log(`❌ ${instructor.full_name}: No direct user found`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking instructors:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstructors()
  .then(() => {
    console.log('\n🏁 Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }); 