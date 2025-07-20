import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    console.log("Creating sample courses with images...");

    // 1. Get course types
    const courseTypes = await prisma.courseType.findMany();
    if (courseTypes.length === 0) {
      console.log("No course types found. Creating default course types...");
      
      await prisma.courseType.createMany({
        data: [
          { id: uuidv4(), course_type: "Technical" },
          { id: uuidv4(), course_type: "Soft Skills" },
          { id: uuidv4(), course_type: "Management" },
          { id: uuidv4(), course_type: "Leadership" }
        ]
      });
    }

    // Get course types again after potentially creating them
    const refreshedCourseTypes = await prisma.courseType.findMany();
    
    // Create sample courses with images
    const technicalType = refreshedCourseTypes.find(t => t.course_type === "Technical") || refreshedCourseTypes[0];
    const softSkillsType = refreshedCourseTypes.find(t => t.course_type === "Soft Skills") || refreshedCourseTypes[0];
    const managementType = refreshedCourseTypes.find(t => t.course_type === "Management") || refreshedCourseTypes[0];
    
    // Create sample courses with descriptions and images
    const sampleCourses = [
      {
        id: `course_${Date.now()}1`,
        course_name: "Junior Web Programming",
        description: "Learn the basics of web development including HTML, CSS, and JavaScript.",
        courseTypeId: technicalType.id,
        image: "/default-course.jpg"
      },
      {
        id: `course_${Date.now()}2`,
        course_name: "Perencanaan Jaringan",
        description: "Memahami konsep dasar dan perencanaan jaringan komputer dalam organisasi.",
        courseTypeId: technicalType.id,
        image: "/default-course.jpg"
      },
      {
        id: `course_${Date.now()}3`,
        course_name: "Business Communication",
        description: "Develop effective communication skills essential for business environments.",
        courseTypeId: softSkillsType.id,
        image: "/default-course.jpg"
      },
      {
        id: `course_${Date.now()}4`,
        course_name: "Project Management Professional",
        description: "Learn methodologies and best practices for successful project management.",
        courseTypeId: managementType.id,
        image: "/default-course.jpg"
      }
    ];
    
    const createdCourses = [];
    
    for (const course of sampleCourses) {
      // Check if a similar course exists
      const existingCourse = await prisma.course.findFirst({
        where: {
          course_name: course.course_name
        }
      });
      
      if (existingCourse) {
        console.log(`Course "${course.course_name}" already exists, skipping...`);
        createdCourses.push(existingCourse);
      } else {
        const newCourse = await prisma.course.create({
          data: course
        });
        console.log(`Created course: ${newCourse.course_name}`);
        createdCourses.push(newCourse);
      }
    }

    // Create course schedules (classes) for the courses
    const now = new Date();
    
    // Create a function to add days to a date
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    const sampleSchedules = [
      {
        id: `class_${Date.now()}1`,
        courseId: createdCourses[0].id,
        quota: 4,
        price: 1000000,
        status: "Active",
        start_reg_date: now,
        end_reg_date: addDays(now, 30),
        duration_day: 3,
        start_date: addDays(now, 7),
        end_date: addDays(now, 10),
        location: "train4best",
        room: "room 1"
      },
      {
        id: `class_${Date.now()}2`,
        courseId: createdCourses[1].id,
        quota: 4,
        price: 1000000,
        status: "Active",
        start_reg_date: now,
        end_reg_date: addDays(now, 14),
        duration_day: 5,
        start_date: addDays(now, 8),
        end_date: addDays(now, 13),
        location: "train4best",
        room: "room 2"
      },
      {
        id: `class_${Date.now()}3`,
        courseId: createdCourses[2].id,
        quota: 4,
        price: 1000000,
        status: "Active",
        start_reg_date: now,
        end_reg_date: addDays(now, 20),
        duration_day: 2,
        start_date: addDays(now, 10),
        end_date: addDays(now, 12),
        location: "train4best",
        room: "room 1"
      },
      {
        id: `class_${Date.now()}4`,
        courseId: createdCourses[3].id,
        quota: 4,
        price: 1000000,
        status: "Active",
        start_reg_date: now,
        end_reg_date: addDays(now, 25),
        duration_day: 4,
        start_date: addDays(now, 12),
        end_date: addDays(now, 16),
        location: "train4best",
        room: "room 3"
      }
    ];

    const createdSchedules = [];
    
    for (const schedule of sampleSchedules) {
      // Check if a similar schedule exists
      const existingSchedule = await prisma.class.findFirst({
        where: {
          courseId: schedule.courseId,
          start_date: {
            gte: addDays(now, -1),
            lte: addDays(now, 20)
          }
        }
      });
      
      if (existingSchedule) {
        console.log(`Schedule for course ID ${schedule.courseId} already exists, skipping...`);
        createdSchedules.push(existingSchedule);
      } else {
        const newSchedule = await prisma.class.create({
          data: schedule
        });
        console.log(`Created schedule for course: ${schedule.courseId}`);
        createdSchedules.push(newSchedule);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sample courses and schedules created successfully",
      data: {
        courses: createdCourses,
        schedules: createdSchedules
      }
    });
  } catch (error) {
    console.error("Error creating sample courses:", error);
    return NextResponse.json(
      { error: "Failed to create sample courses", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Find existing courses
    const existingCourses = await prisma.course.findMany({
      take: 3
    });
    
    if (existingCourses.length > 0) {
      // Update existing courses with images
      const sampleImages = [
        '/img/courses/programming.jpg',
        '/img/courses/management.jpg', 
        '/img/courses/network.jpg'
      ];
      
      for (let i = 0; i < Math.min(existingCourses.length, sampleImages.length); i++) {
        await prisma.course.update({
          where: { id: existingCourses[i].id },
          data: {
            image: sampleImages[i],
            description: `Sample description for ${existingCourses[i].course_name}`
          }
        });
      }
      
      console.log('Sample courses updated with images');
      
      return NextResponse.json({
        success: true,
        message: 'Sample images added to courses',
        coursesUpdated: existingCourses.length
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No courses found to update'
      });
    }
  } catch (error) {
    console.error('Error creating sample courses:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to add sample images to courses', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 