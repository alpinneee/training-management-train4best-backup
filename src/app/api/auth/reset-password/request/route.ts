import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { addDays } from "date-fns";
import { memoryTokens } from "../memoryTokens";
import { sendResetPasswordEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Return error if user doesn't exist
    if (!user) {
      return NextResponse.json(
        { 
          message: "Email tidak terdaftar dalam sistem kami", 
          code: "not_found" 
        },
        { status: 404 }
      );
    }

    // Generate a random token
    const token = randomBytes(32).toString("hex");
    const expires = addDays(new Date(), 1); // Token expires in 1 day
    
    try {
      // Try to use Prisma model if available
      const prismaClient = prisma as any;
      
      if (prismaClient.passwordResetToken) {
        // Store the token in the database
        await prismaClient.passwordResetToken.upsert({
          where: { userId: user.id },
          update: {
            token,
            expires,
          },
          create: {
            userId: user.id,
            token,
            expires,
          },
        });
      } else {
        // Fallback to in-memory storage if Prisma model isn't available
        memoryTokens.set(token, {
          token,
          expires,
          email: user.email,
          userId: user.id
        });
      }
    } catch (error) {
      console.error("Error storing token:", error);
      // Fallback to in-memory storage
      memoryTokens.set(token, {
        token,
        expires,
        email: user.email,
        userId: user.id
      });
    }

    // Create reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Send email with reset link
    const emailResult = await sendResetPasswordEmail(
      user.email,
      resetLink,
      user.username
    );

    if (!emailResult?.success) {
      console.error("Failed to send email:", emailResult?.error);
      
      // Return error if email sending fails
      return NextResponse.json(
        { 
          message: "Failed to send reset password email. Please try again later.",
          success: false
        },
        { status: 500 }
      );
    }

    console.log(`Reset password email sent to ${user.email}`);

    return NextResponse.json(
      { 
        message: "Reset password link has been sent to your email",
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
} 