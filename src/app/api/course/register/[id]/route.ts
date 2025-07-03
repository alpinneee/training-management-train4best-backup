import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  }
}

// GET /api/course/register/[id] - Get registration details
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Registration ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching course registration with ID: ${id}`);
    
    const registration = await prisma.courseRegistration.findUnique({
      where: { id },
      include: {
        participant: {
          include: {
            user: true
          }
        },
        class: {
          include: {
            course: true
          }
        },
        payments: true
      }
    });
    
    if (!registration) {
      console.log(`Registration with ID ${id} not found`);
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    // Format data to include all necessary fields for the frontend
    const response = {
      registration: {
        id: registration.id,
        registrationDate: registration.reg_date,
        regStatus: registration.reg_status,
        payment: registration.payments,
        paymentStatus: registration.payment_status,
        paymentMethod: registration.payment_method,
        presentDay: registration.present_day,
        classId: registration.classId,
        participantId: registration.participantId,
        class: registration.class ? {
          id: registration.class.id,
          location: registration.class.location,
          startDate: registration.class.start_date,
          endDate: registration.class.end_date,
          price: registration.class.price,
          quota: registration.class.quota,
          course: registration.class.course ? {
            id: registration.class.course.id,
            course_name: registration.class.course.course_name
          } : null
        } : null,
        participant: registration.participant ? {
          id: registration.participant.id,
          full_name: registration.participant.full_name,
          company: registration.participant.company,
          job_title: registration.participant.job_title,
          user: registration.participant.user ? {
            id: registration.participant.user.id,
            email: registration.participant.user.email,
            username: registration.participant.user.username
          } : null
        } : null,
        payments: registration.payments.map(p => ({
          id: p.id,
          date: p.paymentDate,
          amount: p.amount,
          method: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          status: p.status,
          proof: p.paymentProof
        }))
      }
    };
    
    console.log(`Registration data found and formatted`);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Error fetching registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration data" },
      { status: 500 }
    );
  }
} 