import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    
    // Return mock data for now
    const mockMaterial = {
      id: materialId,
      title: "Mock Material",
      description: "This is a mock material for development",
      fileUrl: "https://drive.google.com/file/d/example",
      day: 1,
      courseScheduleId: courseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(mockMaterial);
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
    
    // In production, you would update the database
    // For now, return updated mock data
    
    const updatedMaterial = {
      id: materialId,
      title: data.title,
      description: data.description || "",
      fileUrl: data.fileUrl || "",
      day: parseInt(data.day),
      courseScheduleId: courseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(updatedMaterial);
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
    
    // In production, you would delete from the database
    // For now, just return success response
    
    return NextResponse.json({ success: true, message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
} 