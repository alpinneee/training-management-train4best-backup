import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

// Helper function to add CORS headers
function corsResponse(body: any, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return corsResponse({});
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    console.log("Payment verification request for ID:", id);
    
    let requestBody;
    try {
      requestBody = await request.json();
      console.log("Request body:", requestBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return corsResponse(
        { error: "Invalid request body" },
        400
      );
    }
    
    const { isApproved } = requestBody;
    
    if (!id) {
      return corsResponse(
        { error: "Payment ID is required" },
        400
      );
    }
    
    // Check if we can execute direct SQL queries for debugging
    try {
      console.log("Executing direct SQL query to check payment status...");
      const paymentQuery = await prisma.$queryRaw`
        SELECT id, status, registrationId, updatedAt 
        FROM payment 
        WHERE id = ${id}
      `;
      console.log("Direct SQL query result for payment:", paymentQuery);

      if (paymentQuery && Array.isArray(paymentQuery) && paymentQuery.length > 0) {
        const regId = paymentQuery[0].registrationId;
        const regQuery = await prisma.$queryRaw`
          SELECT id, reg_status, payment_status 
          FROM courseregistration 
          WHERE id = ${regId}
        `;
        console.log("Direct SQL query result for registration:", regQuery);
      }
    } catch (sqlError) {
      console.error("Error executing direct SQL query:", sqlError);
    }
    
    // Verify payment exists
    console.log("Checking if payment exists in database...");
    let payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        registration: true
      }
    });
    
    // If payment not found by ID, try to find by registration ID (for cases where ID might be registration ID)
    if (!payment && id.includes('_')) {
      const possibleRegistrationId = id.split('_').pop();
      if (possibleRegistrationId) {
        console.log(`Payment not found by ID, trying to find by registration ID: ${possibleRegistrationId}`);
        
        const payments = await prisma.payment.findMany({
          where: { registrationId: possibleRegistrationId },
          include: {
            registration: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        });
        
        if (payments.length > 0) {
          payment = payments[0];
          console.log(`Found payment by registration ID: ${payment.id}`);
        }
      }
    }
    
    if (!payment) {
      console.log(`Payment with ID ${id} not found`);
      return corsResponse(
        { error: "Payment not found" },
        404
      );
    }
    
    console.log("Payment found:", payment);
    console.log("Starting transaction to update payment and registration...");
    
    // Begin transaction to update both payment and registration
    const newStatus = isApproved ? "Paid" : "Rejected";
    const regStatus = isApproved ? "Registered" : "Rejected";
    
    try {
      // Prepare registration update data
      const registrationUpdateData: any = {
        reg_status: regStatus,
        payment_status: newStatus
      };
      
      // Hanya tambahkan payment_detail jika field tersebut ada di model
      try {
        if (payment.registration && 'payment_detail' in payment.registration) {
          registrationUpdateData.payment_detail = `${payment.registration?.payment_detail || ''} Payment ${isApproved ? 'verified and approved' : 'rejected'} on ${new Date().toISOString()}.`;
        }
      } catch (detailError) {
        console.error("Error preparing payment detail:", detailError);
      }

      console.log("Starting database transaction with data:", {
        paymentId: payment.id,
        registrationId: payment.registrationId,
        newStatus,
        regStatus,
        registrationUpdateData
      });

      // Since Fix Status works, let's use the same direct update approach
      let updatedPayment;
      let updatedRegistration;
      
      try {
        // First update payment
        updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: newStatus,
            updatedAt: new Date() // Force update timestamp
          }
        });
        
        console.log("Payment updated successfully:", updatedPayment);
        
        // Then update registration
        updatedRegistration = await prisma.courseRegistration.update({
          where: { id: payment.registrationId },
          data: registrationUpdateData
        });
        
        console.log("Registration updated successfully:", updatedRegistration);
      } catch (error) {
        console.error("Error updating payment and registration:", error);
        throw error; // Re-throw to be caught by outer catch block
      }
      
      console.log("Updated payment:", updatedPayment);
      console.log("Updated registration:", updatedRegistration);
      
      // Double-check the update was successful
      const verifiedPayment = await prisma.payment.findUnique({
        where: { id: payment.id }
      });
      
      console.log("Verified payment after update:", verifiedPayment);
      
      if (verifiedPayment?.status !== newStatus) {
        console.error("Warning: Payment status was not updated correctly");
      }
      
      // Check with direct SQL queries after update
      try {
        console.log("Executing direct SQL query to verify payment status after update...");
        const paymentQuery = await prisma.$queryRaw`
          SELECT id, status, registrationId, updatedAt 
          FROM payment 
          WHERE id = ${payment.id}
        `;
        console.log("Direct SQL query result for payment after update:", paymentQuery);

        const regQuery = await prisma.$queryRaw`
          SELECT id, reg_status, payment_status 
          FROM courseregistration 
          WHERE id = ${payment.registrationId}
        `;
        console.log("Direct SQL query result for registration after update:", regQuery);
      } catch (sqlError) {
        console.error("Error executing direct SQL query after update:", sqlError);
      }
      
      return corsResponse({
        success: true,
        message: isApproved ? "Payment has been approved" : "Payment has been rejected",
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
      return corsResponse(
        { error: `Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}` },
        500
      );
    }
    
  } catch (error) {
    console.error("Error verifying payment:", error);
    return corsResponse(
      { error: `Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}` },
      500
    );
  }
} 