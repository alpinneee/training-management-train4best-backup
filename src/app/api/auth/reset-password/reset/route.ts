import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { memoryTokens } from "../memoryTokens";
import { sendPasswordResetConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    let userId: string | null = null;
    let resetToken: any = null;
    let isExpired = true;
    let userEmail: string | null = null;
    let username: string | null = null;

    try {
      // Check if Prisma model is available using a safer approach
      const prismaClient = prisma as any;
      
      if (prismaClient.passwordResetToken) {
        // Find the token in the database
        resetToken = await prismaClient.passwordResetToken.findFirst({
          where: {
            token,
            expires: {
              gt: new Date(), // Token must not be expired
            },
          },
          include: {
            user: true,
          },
        });

        if (resetToken) {
          userId = resetToken.userId;
          userEmail = resetToken.user.email;
          username = resetToken.user.username;
          isExpired = false;
        }
      } else {
        // Fallback to in-memory storage if Prisma model isn't available
        // Check if we have this token in memory
        const tokenData = memoryTokens.get(token);
        if (tokenData && tokenData.expires > new Date()) {
          userId = tokenData.userId;
          userEmail = tokenData.email;
          username = tokenData.email.split('@')[0]; // Use email prefix as username
          isExpired = false;
        }
      }
    } catch (error) {
      console.error("Error finding token:", error);
    }

    if (!userId || isExpired) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 10);

    // Update the user's password
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    try {
      // Try to delete the token if using Prisma
      const prismaClient = prisma as any;
      
      if (resetToken && prismaClient.passwordResetToken) {
        await prismaClient.passwordResetToken.delete({
          where: {
            id: resetToken.id,
          },
        });
      } else {
        // Remove from memory map if using that
        memoryTokens.delete(token);
      }
    } catch (error) {
      console.error("Error deleting token:", error);
    }

    // Send confirmation email
    if (userEmail && username) {
      try {
        await sendPasswordResetConfirmationEmail(userEmail, username);
        console.log(`Confirmation email sent to ${userEmail}`);
      } catch (error) {
        console.error("Error sending confirmation email:", error);
        // Don't fail the reset process if email fails
      }
    }

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
} 