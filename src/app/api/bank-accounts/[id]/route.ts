import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/bank-accounts/[id] - Get a specific bank account
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // Get bank account by ID
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id }
    });
    
    if (!bankAccount) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: bankAccount
    });
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank account" },
      { status: 500 }
    );
  }
}

// PUT /api/bank-accounts/[id] - Update a bank account (admin only)
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // Temporarily bypass admin check
    /*
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can manage bank accounts." },
        { status: 403 }
      );
    }
    */
    
    // Check if bank account exists
    const existingAccount = await prisma.bankAccount.findUnique({
      where: { id }
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 }
      );
    }
    
    // Get data from request
    const { bankName, accountNumber, accountName, isActive } = await request.json();
    
    // Create update data object
    const updateData: any = {};
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (accountName !== undefined) updateData.accountName = accountName;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Update bank account
    const updatedAccount = await prisma.bankAccount.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      message: "Bank account updated successfully",
      data: updatedAccount
    });
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { error: "Failed to update bank account" },
      { status: 500 }
    );
  }
}

// DELETE /api/bank-accounts/[id] - Delete a bank account (admin only)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // Temporarily bypass admin check
    /*
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can manage bank accounts." },
        { status: 403 }
      );
    }
    */
    
    // Check if bank account exists
    const existingAccount = await prisma.bankAccount.findUnique({
      where: { id }
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 }
      );
    }
    
    // Instead of hard delete, set isActive to false
    await prisma.bankAccount.update({
      where: { id },
      data: { isActive: false }
    });
    
    return NextResponse.json({
      success: true,
      message: "Bank account deactivated successfully"
    });
  } catch (error) {
    console.error("Error deactivating bank account:", error);
    return NextResponse.json(
      { error: "Failed to deactivate bank account" },
      { status: 500 }
    );
  }
} 