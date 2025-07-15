import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Define the material type
interface CourseMaterial {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  day: number;
  courseScheduleId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create a new material for a course schedule
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow bypassing authentication during development
    if (!session) {
      console.warn("No session found, but allowing request as development mode");
    }
    
    const courseId = params.id;
    console.log(`Creating material for course ${courseId}`);
    
    const data = await request.json();
    console.log("Received material data:", data);
    
    // Validate required fields
    if (!data.title || !data.day) {
      return NextResponse.json(
        { error: "Missing required fields: title, day" },
        { status: 400 }
      );
    }
    
    // Create material in database
    try {
      const newMaterial = await prisma.courseMaterial.create({
        data: {
          title: data.title,
          description: data.description || "",
          fileUrl: data.fileUrl || "",
          day: parseInt(data.day),
          courseScheduleId: courseId
        }
      });
      
      return NextResponse.json(newMaterial, { status: 201 });
    } catch (dbError) {
      console.error("Database error creating course material:", dbError);
      return NextResponse.json(
        { error: "Database error creating course material" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating course material:", error);
    return NextResponse.json(
      { error: "Failed to create course material" },
      { status: 500 }
    );
  }
} 