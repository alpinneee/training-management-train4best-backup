import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
export const dynamic = "force-dynamic";

/**
 * Generate a secure random string for use as NextAuth secret
 * @returns A secure random string
 */
function generateSecureSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    // Generate a secure secret
    const secret = generateSecureSecret();
    
    // Return the generated secret
    return NextResponse.json({
      success: true,
      secret: secret,
      instructions: "Add this to your .env.local file as NEXTAUTH_SECRET=your_generated_secret"
    });
  } catch (error) {
    console.error("Error generating secret:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate secret",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get length from request body if provided
    const body = await request.json();
    const length = body.length || 32; // Default to 32 bytes
    
    // Generate a secure secret with specified length
    const secret = crypto.randomBytes(length).toString('hex');
    
    // Return the generated secret
    return NextResponse.json({
      success: true,
      secret: secret,
      length: length,
      instructions: "Add this to your .env.local file as NEXTAUTH_SECRET=your_generated_secret"
    });
  } catch (error) {
    console.error("Error generating secret:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate secret",
      },
      { status: 500 }
    );
  }
} 