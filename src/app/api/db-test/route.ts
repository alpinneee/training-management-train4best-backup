import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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