import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Debug instructure API called");
    
    // Get instructure user type
    const instructureUserType = await prisma.userType.findFirst({
      where: { usertype: "Instructure" }
    });

    if (!instructureUserType) {
      return NextResponse.json(
        { error: "Instructure user type not found" },
        { status: 404 }
      );
    }

    // Create instructure
    const instructureId = uuidv4();
    const instructure = await prisma.instructure.create({
      data: {
        id: instructureId,
        full_name: "Debug Instructure",
        phone_number: "123456789",
        address: "Debug Address",
        profiency: "Debug Skills"
      }
    });

    // Create user for instructure
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: "debug.instructure@example.com",
        username: "debug.instructure",
        password: hashedPassword,
        userTypeId: instructureUserType.id,
        instructureId: instructureId
      }
    });

    // Create a class for testing
    const courseTypeId = uuidv4();
    const courseType = await prisma.courseType.create({
      data: {
        id: courseTypeId,
        course_type: "Debug Course Type"
      }
    });

    const courseId = uuidv4();
    const course = await prisma.course.create({
      data: {
        id: courseId,
        course_name: "Debug Course",
        courseTypeId: courseTypeId
      }
    });

    const classId = uuidv4();
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const classData = await prisma.class.create({
      data: {
        id: classId,
        quota: 10,
        price: 1000000,
        status: "Active",
        start_reg_date: today,
        end_reg_date: nextWeek,
        duration_day: 5,
        start_date: nextWeek,
        end_date: nextMonth,
        location: "Debug Location",
        room: "Debug Room",
        courseId: courseId
      }
    });

    // Assign instructure to class
    const instructureClassId = uuidv4();
    const instructureClass = await prisma.instructureClass.create({
      data: {
        id: instructureClassId,
        instructureId: instructureId,
        classId: classId
      }
    });

    return NextResponse.json({
      success: true,
      message: "Debug instructure created successfully",
      data: {
        instructure,
        user,
        class: classData,
        instructureClass
      }
    });
  } catch (error) {
    console.error("Error creating debug instructure:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create debug instructure" },
      { status: 500 }
    );
  }
} 