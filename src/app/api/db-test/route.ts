import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Try a simple query to test the connection
    const courseTypeCount = await prisma.courseType.count();
    
    return NextResponse.json({
      success: true,
      message: "Database connection is working",
      courseTypeCount
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      env: {
        databaseUrl: process.env.DATABASE_URL || "Not set"
      }
    }, { status: 500 });
  }
}

// Endpoint tambahan untuk menambahkan data dummy untuk dashboard
export async function POST(request: Request) {
  try {
    // Tambahkan beberapa data jika belum ada
    
    // 1. Tambahkan course type jika belum ada
    let courseType = await prisma.courseType.findFirst();
    if (!courseType) {
      courseType = await prisma.courseType.create({
        data: {
          id: "ct-" + Date.now().toString(),
          course_type: "Technical Training"
        }
      });
    }
    
    // 2. Tambahkan course jika belum ada
    let course = await prisma.course.findFirst();
    if (!course) {
      course = await prisma.course.create({
        data: {
          id: "course-" + Date.now().toString(),
          courseTypeId: courseType.id,
          course_name: "Web Development Fundamentals",
          description: "Learn the basics of web development"
        }
      });
    }
    
    // 3. Tambahkan instructure jika belum ada
    let instructor = await prisma.instructure.findFirst();
    if (!instructor) {
      instructor = await prisma.instructure.create({
        data: {
          id: "ins-" + Date.now().toString(),
          full_name: "John Doe",
          phone_number: "123456789",
          address: "Jakarta",
          profiency: "Web Development"
        }
      });
    }
    
    // 4. Tambahkan participant jika belum ada
    let user = await prisma.user.findFirst({
      where: {
        email: "participant@example.com"
      }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: "user-" + Date.now().toString(),
          email: "participant@example.com",
          password: "$2a$10$8r0aATrK3ohxvK2sHwVkXeawegbb4kK7Tq6S.YjbRE6QN2DgvF.n6", // password123
          username: "participant1",
          userTypeId: "usertype-participant" // Pastikan ini ada di database
        }
      });
    }
    
    let participant = await prisma.participant.findFirst();
    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          id: "par-" + Date.now().toString(),
          full_name: "Jane Smith",
          phone_number: "987654321",
          address: "Surabaya",
          birth_date: new Date("1990-01-01"),
          gender: "Female",
          userId: user.id
        }
      });
    }
    
    // 5. Tambahkan class jika belum ada
    let classData = await prisma.class.findFirst();
    if (!classData) {
      classData = await prisma.class.create({
        data: {
          id: "class-" + Date.now().toString(),
          courseId: course.id,
          quota: 20,
          price: 1000000,
          status: "Active",
          start_reg_date: new Date(),
          end_reg_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          duration_day: 5,
          start_date: new Date(),
          end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          location: "Online",
          room: "Zoom Room 1"
        }
      });
    }
    
    // 6. Tambahkan instructor ke class
    const instructorClass = await prisma.instructureClass.findFirst();
    if (!instructorClass) {
      await prisma.instructureClass.create({
        data: {
          id: "insclass-" + Date.now().toString(),
          instructureId: instructor.id,
          classId: classData.id
        }
      });
    }
    
    // 7. Tambahkan certificate jika belum ada
    const certificate = await prisma.certificate.findFirst();
    if (!certificate) {
      await prisma.certificate.create({
        data: {
          id: "cert-" + Date.now().toString(),
          certificateNumber: "CERT-" + Date.now().toString(),
          name: "Web Development Certificate",
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: "Valid",
          courseId: course.id,
          participantId: participant.id
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Dummy data added successfully"
    });
  } catch (error) {
    console.error("Error adding dummy data:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 