import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting course seeding...');

  // Create Course Types
  console.log('Creating course types...');
  const courseTypes = [
    {
      id: `coursetype_${Date.now()}_1`,
      course_type: 'Technical Training'
    },
    {
      id: `coursetype_${Date.now()}_2`,
      course_type: 'Management Training'
    },
    {
      id: `coursetype_${Date.now()}_3`,
      course_type: 'Soft Skills Training'
    },
    {
      id: `coursetype_${Date.now()}_4`,
      course_type: 'Leadership Training'
    }
  ];

  for (const courseType of courseTypes) {
    await prisma.courseType.upsert({
      where: { id: courseType.id },
      update: courseType,
      create: courseType
    });
    console.log(`Created course type: ${courseType.course_type}`);
  }

  // Create Courses
  console.log('Creating courses...');
  const courses = [
    {
      id: `course_${Date.now()}_1`,
      courseTypeId: courseTypes[0].id,
      course_name: 'Web Development with React'
    },
    {
      id: `course_${Date.now()}_2`,
      courseTypeId: courseTypes[0].id,
      course_name: 'Mobile App Development with Flutter'
    },
    {
      id: `course_${Date.now()}_3`,
      courseTypeId: courseTypes[1].id,
      course_name: 'Project Management Professional'
    },
    {
      id: `course_${Date.now()}_4`,
      courseTypeId: courseTypes[1].id,
      course_name: 'Agile Scrum Master'
    },
    {
      id: `course_${Date.now()}_5`,
      courseTypeId: courseTypes[2].id,
      course_name: 'Effective Communication Skills'
    },
    {
      id: `course_${Date.now()}_6`,
      courseTypeId: courseTypes[3].id,
      course_name: 'Leadership and Team Building'
    }
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: course,
      create: course
    });
    console.log(`Created course: ${course.course_name}`);
  }

  // Create Course Schedules (Classes)
  console.log('Creating course schedules...');
  const now = new Date();
  
  // Create future dates for classes
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const twoMonthsLater = new Date(now);
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
  
  const threeMonthsLater = new Date(now);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  // Set registration dates (usually before the class starts)
  const regStartNow = new Date();
  const regEndNextMonth = new Date(nextMonth);
  regEndNextMonth.setDate(regEndNextMonth.getDate() - 5); // Registration ends 5 days before class

  const regEndTwoMonths = new Date(twoMonthsLater);
  regEndTwoMonths.setDate(regEndTwoMonths.getDate() - 5);

  const regEndThreeMonths = new Date(threeMonthsLater);
  regEndThreeMonths.setDate(regEndThreeMonths.getDate() - 5);

  const classes = [
    {
      id: `class_${Date.now()}_1`,
      quota: 20,
      price: 2500000,
      status: "Open",
      start_reg_date: regStartNow,
      end_reg_date: regEndNextMonth,
      duration_day: 5,
      start_date: nextMonth,
      end_date: new Date(nextMonth.getTime() + 5 * 24 * 60 * 60 * 1000),
      location: 'Jakarta',
      room: 'Training Room A',
      courseId: courses[0].id
    },
    {
      id: `class_${Date.now()}_2`,
      quota: 15,
      price: 3000000,
      status: "Open",
      start_reg_date: regStartNow,
      end_reg_date: regEndTwoMonths,
      duration_day: 3,
      start_date: twoMonthsLater,
      end_date: new Date(twoMonthsLater.getTime() + 3 * 24 * 60 * 60 * 1000),
      location: 'Bandung',
      room: 'Training Room B',
      courseId: courses[1].id
    },
    {
      id: `class_${Date.now()}_3`,
      quota: 25,
      price: 2000000,
      status: "Open",
      start_reg_date: regStartNow,
      end_reg_date: regEndThreeMonths,
      duration_day: 2,
      start_date: threeMonthsLater,
      end_date: new Date(threeMonthsLater.getTime() + 2 * 24 * 60 * 60 * 1000),
      location: 'Surabaya',
      room: 'Training Room C',
      courseId: courses[2].id
    },
    {
      id: `class_${Date.now()}_4`,
      quota: 30,
      price: 1500000,
      status: "Open",
      start_reg_date: regStartNow,
      end_reg_date: regEndNextMonth,
      duration_day: 4,
      start_date: nextMonth,
      end_date: new Date(nextMonth.getTime() + 4 * 24 * 60 * 60 * 1000),
      location: 'Online',
      room: 'Virtual Room',
      courseId: courses[3].id
    },
    {
      id: `class_${Date.now()}_5`,
      quota: 20,
      price: 1000000,
      status: "Open",
      start_reg_date: regStartNow,
      end_reg_date: regEndTwoMonths,
      duration_day: 1,
      start_date: twoMonthsLater,
      end_date: new Date(twoMonthsLater.getTime() + 1 * 24 * 60 * 60 * 1000),
      location: 'Jakarta',
      room: 'Training Room D',
      courseId: courses[4].id
    },
    {
      id: `class_${Date.now()}_6`,
      quota: 15,
      price: 3500000,
      status: "Open",
      start_reg_date: regStartNow,
      end_reg_date: regEndThreeMonths,
      duration_day: 3,
      start_date: threeMonthsLater,
      end_date: new Date(threeMonthsLater.getTime() + 3 * 24 * 60 * 60 * 1000),
      location: 'Bali',
      room: 'Conference Room',
      courseId: courses[5].id
    }
  ];

  for (const classItem of classes) {
    await prisma.class.upsert({
      where: { id: classItem.id },
      update: classItem,
      create: classItem
    });
    console.log(`Created class for course: ${classItem.courseId} in ${classItem.location}`);
  }

  console.log('✅ Course seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 