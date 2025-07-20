import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Get all pending registrations with payment evidence
    const pendingRegistrations = await prisma.courseRegistration.findMany({
      where: {
        payment_status: "Pending",
      },
      include: {
        participant: true,
        class: {
          include: {
            course: true
          }
        },
        payments: true
      }
    });

    // Filter registrations that have payments with evidence
    const registrationsWithEvidence = pendingRegistrations.filter(registration => {
      return registration.payments.some(payment => payment.paymentProof !== null);
    });

    // Format the response
    const payments = registrationsWithEvidence.map(registration => {
      // Get the latest payment record if exists
      const paymentRecord = registration.payments.length > 0 ? registration.payments[0] : null;
      
      return {
        id: registration.id,
        registrationId: registration.id,
        participantName: registration.participant.full_name,
        courseName: registration.class.course.course_name,
        amount: paymentRecord?.amount || 0,
        paymentDate: paymentRecord?.paymentDate || new Date().toISOString(),
        paymentMethod: paymentRecord?.paymentMethod || "Transfer Bank",
        paymentEvidence: paymentRecord?.paymentProof || null,
        status: registration.payment_status,
        courseDetails: {
          id: registration.class.id,
          name: registration.class.course.course_name,
          location: registration.class.location,
          startDate: registration.class.start_date,
          endDate: registration.class.end_date
        },
        paymentDetails: {
          referenceNumber: paymentRecord ? paymentRecord.referenceNumber : null,
          amount: paymentRecord?.amount || 0,
          status: registration.payment_status
        }
      };
    });

    return NextResponse.json({
      success: true,
      payments
    });
    
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending payments" },
      { status: 500 }
    );
  }
} 