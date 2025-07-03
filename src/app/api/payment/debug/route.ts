export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    
    // Check database connection
    console.log("Testing database connection...");
    const dbTest = await prisma.$queryRaw`SELECT 1+1 as result`;
    console.log("Database connection test result:", dbTest);
    
    // Get payment information
    let paymentInfo = null;
    let registrationInfo = null;
    
    if (paymentId) {
      console.log(`Getting payment info for ID: ${paymentId}`);
      
      try {
        paymentInfo = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { registration: true }
        });
        
        if (paymentInfo) {
          console.log("Payment found:", {
            id: paymentInfo.id,
            status: paymentInfo.status,
            registrationId: paymentInfo.registrationId
          });
          
          registrationInfo = await prisma.courseRegistration.findUnique({
            where: { id: paymentInfo.registrationId }
          });
          
          console.log("Registration info:", {
            id: registrationInfo?.id,
            status: registrationInfo?.reg_status,
            paymentStatus: registrationInfo?.payment_status
          });
        } else {
          console.log(`No payment found with ID: ${paymentId}`);
        }
      } catch (error) {
        console.error("Error fetching payment info:", error);
      }
    }
    
    // Test transaction
    console.log("Testing database transaction...");
    try {
      const testTransaction = await prisma.$transaction(async (tx) => {
        // Just a read operation for testing
        const count = await tx.payment.count();
        return { count };
      });
      console.log("Transaction test result:", testTransaction);
    } catch (txError) {
      console.error("Transaction test error:", txError);
    }
    
    return NextResponse.json({
      success: true,
      dbConnectionTest: dbTest,
      paymentInfo: paymentInfo ? {
        id: paymentInfo.id,
        status: paymentInfo.status,
        registrationId: paymentInfo.registrationId,
        updatedAt: paymentInfo.updatedAt
      } : null,
      registrationInfo: registrationInfo ? {
        id: registrationInfo.id,
        regStatus: registrationInfo.reg_status,
        paymentStatus: registrationInfo.payment_status
      } : null
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Debug endpoint error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 