import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { approved, registrationId } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }
    
    // Verify payment exists
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        registration: true
      }
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }
    
    // Begin transaction to update both payment and registration
    const newStatus = approved ? "Paid" : "Rejected";
    const regStatus = approved ? "Registered" : "Rejected";
    
    const [updatedPayment, updatedRegistration] = await prisma.$transaction([
      // Update payment status
      prisma.payment.update({
        where: { id },
        data: { status: newStatus }
      }),
      
      // Update registration status
      prisma.courseRegistration.update({
        where: { id: registrationId || payment.registrationId },
        data: { 
          reg_status: regStatus,
          payment_status: newStatus
        }
      })
    ]);
    
    return NextResponse.json({
      success: true,
      message: approved ? "Payment has been approved" : "Payment has been rejected",
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        registrationId: updatedPayment.registrationId
      },
      registration: {
        id: updatedRegistration.id,
        status: updatedRegistration.reg_status,
        paymentStatus: updatedRegistration.payment_status
      }
    });
    
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
} 