export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        participant: true
      }
    });

    if (!user || !user.participant || user.participant.length === 0) {
      return NextResponse.json(
        { error: "User not found or has no participant profile" },
        { status: 404 }
      );
    }

    const participantId = user.participant[0].id;

    // Get all registrations, not just pending ones
    const allRegistrations = await prisma.courseRegistration.findMany({
      where: {
        participantId,
      },
      include: {
        class: {
          include: {
            course: true
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1
        }
      }
    });

    // Format data untuk respons
    const formattedRegistrations = allRegistrations.map(reg => {
      // Get payment evidence from related payment if available
      const paymentEvidence = reg.payments.length > 0 ? reg.payments[0].paymentProof : null;
      
      return {
        registrationId: reg.id,
        courseId: reg.class.id,
        courseName: reg.class.course ? reg.class.course.course_name : 'Unknown Course',
        className: `${reg.class.location} - ${new Date(reg.class.start_date).toLocaleDateString()}`,
        status: reg.reg_status,
        paymentStatus: reg.payment_status,
        paymentAmount: reg.payment,
        paymentEvidence: paymentEvidence
      };
    });

    return NextResponse.json({
      registrations: formattedRegistrations
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
} 