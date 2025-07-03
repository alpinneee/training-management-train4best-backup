export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit')) || 10;
    const page = Number(url.searchParams.get('page')) || 1;
    const search = url.searchParams.get('search') || '';
    const skip = (page - 1) * limit;
    
    // Dapatkan tanggal saat ini
    const currentDate = new Date();
    
    try {
      // Cari kelas yang masih bisa didaftar (end_reg_date >= currentDate)
      const availableClasses = await prisma.class.findMany({
        where: {
          end_reg_date: {
            gte: currentDate
          },
          ...(search ? {
            OR: [
              { location: { contains: search } },
              { course: { course_name: { contains: search } } }
            ]
          } : {})
        },
        include: {
          course: {
            include: {
              courseType: true
            }
          },
          courseregistration: true
        },
        skip,
        take: limit,
        orderBy: {
          start_date: 'asc'
        }
      });
      
      console.log("Available classes found:", availableClasses.length);
      
      // Format respons
      const classesWithAvailability = availableClasses.map(classItem => {
        const registeredCount = classItem.courseregistration.length;
        const availableSlots = classItem.quota - registeredCount;
        
        // Hilangkan data registrasi peserta dari response
        const { courseregistration, ...classData } = classItem;
        
        // Ensure course data has image field
        const updatedCourse = {
          ...classData.course,
          image: classData.course.image || '/default-course.jpg'
        };
        
        return {
          ...classData,
          course: updatedCourse, // Include the complete course object with image
          availableSlots,
          isFull: availableSlots <= 0
        };
      });
      
      // Log the output for debugging
      console.log("Formatted response:", {
        total: classesWithAvailability.length,
        sample: classesWithAvailability.length > 0 ? {
          id: classesWithAvailability[0].id,
          courseName: classesWithAvailability[0].course.course_name, 
          courseImage: classesWithAvailability[0].course.image
        } : "No classes available"
      });
      
      // Perkirakan total dengan kueri yang sama
      const totalCount = await prisma.class.count({
        where: {
          end_reg_date: {
            gte: currentDate
          },
          ...(search ? {
            OR: [
              { location: { contains: search } },
              { course: { course_name: { contains: search } } }
            ]
          } : {})
        }
      });
      
      // Debug check for image fields
      console.log("Course images check:", classesWithAvailability.map(item => ({
        id: item.id, 
        courseName: item.course.course_name, 
        courseImage: item.course.image
      })));
      
      return NextResponse.json({
        data: classesWithAvailability,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      
      // Jika terjadi error database, kembalikan response kosong tapi valid
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          error: "Database error, no courses available"
        }
      });
    }
  } catch (error) {
    console.error("Fatal error fetching available courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch available courses", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 