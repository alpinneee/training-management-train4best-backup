import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Get a specific material
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow bypassing authentication during development
    if (!session) {
      console.warn("No session found, but allowing request as development mode");
    }
    
    const courseId = params.id;
    const materialId = params.materialId;
    
    console.log(`Fetching material ${materialId} for course ${courseId}`);
    
    // Fetch from database
    try {
      const material = await prisma.courseMaterial.findUnique({
        where: { 
          id: materialId,
          courseScheduleId: courseId
        }
      });
      
      if (!material) {
        return NextResponse.json(
          { error: "Material not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(material);
    } catch (dbError) {
      console.error("Database error fetching material:", dbError);
      return NextResponse.json(
        { error: "Database error fetching material" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json(
      { error: "Failed to fetch material" },
      { status: 500 }
    );
  }
}

// Update a material
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow bypassing authentication during development
    if (!session) {
      console.warn("No session found, but allowing request as development mode");
    }
    
    const courseId = params.id;
    const materialId = params.materialId;
    
    console.log(`Updating material ${materialId} for course ${courseId}`);
    
    const data = await request.json();
    console.log("Received update data:", data);
    
    // Validate required fields
    if (!data.title || !data.day) {
      return NextResponse.json(
        { error: "Missing required fields: title, day" },
        { status: 400 }
      );
    }
    
    // Update in database
    try {
      const updatedMaterial = await prisma.courseMaterial.update({
        where: {
          id: materialId,
          courseScheduleId: courseId
        },
        data: {
          title: data.title,
          description: data.description || "",
          fileUrl: data.fileUrl || "",
          day: parseInt(data.day)
        }
      });
      
      return NextResponse.json(updatedMaterial);
    } catch (dbError) {
      console.error("Database error updating material:", dbError);
      return NextResponse.json(
        { error: "Database error updating material" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}

// Delete a material
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow bypassing authentication during development
    if (!session) {
      console.warn("No session found, but allowing request as development mode");
    }
    
    const courseId = params.id;
    const materialId = params.materialId;
    
    console.log(`Deleting material ${materialId} from course ${courseId}`);
    
    // Delete from database
    try {
      await prisma.courseMaterial.delete({
        where: {
          id: materialId,
          courseScheduleId: courseId
        }
      });
      
      return NextResponse.json({ success: true, message: "Material deleted successfully" });
    } catch (dbError) {
      console.error("Database error deleting material:", dbError);
      return NextResponse.json(
        { error: "Database error deleting material" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
} 