import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;  // classId
  };
}

// POST /api/course-schedule/[id]/participant/registration - Update registration details for a participant
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { 
      participantId, 
      registrationDate, 
      paymentMethod, 
      payment, 
      presentDay
    } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classExists) {
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    // Check if registration exists
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        classId,
        participantId
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Participant is not registered for this course' },
        { status: 404 }
      );
    }

    // Calculate payment status based on payment amount
    let paymentStatus = registration.payment_status;
    if (payment !== undefined) {
      const paymentAmount = Number(payment);
      if (paymentAmount >= classExists.price) {
        paymentStatus = 'Paid';
      } else if (paymentAmount > 0) {
        paymentStatus = 'Partial';
      } else {
        paymentStatus = 'Unpaid';
      }
    }

    // Update registration
    const updatedRegistration = await prisma.courseRegistration.update({
      where: {
        id: registration.id
      },
      data: {
        reg_date: registrationDate ? new Date(registrationDate) : registration.reg_date,
        payment_method: paymentMethod || registration.payment_method,
        payment: payment !== undefined ? Number(payment) : registration.payment,
        present_day: presentDay !== undefined ? Number(presentDay) : registration.present_day,
        payment_status: paymentStatus
      },
      include: {
        participant: {
          select: {
            full_name: true
          }
        }
      }
    });

    // Create payment record if needed
    if (payment !== undefined && Number(payment) > 0) {
      // Check if there's a payment record for this registration
      const existingPayment = await prisma.payment.findFirst({
        where: { registrationId: registration.id }
      });

      if (existingPayment) {
        // Update existing payment
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: Number(payment),
            status: paymentStatus
          }
        });
      } else {
        // Create new payment
        await prisma.payment.create({
          data: {
            paymentDate: new Date(),
            amount: Number(payment),
            paymentMethod: paymentMethod || 'Unknown',
            referenceNumber: `PAY-${Date.now()}`,
            status: paymentStatus,
            registrationId: registration.id
          }
        });
      }
    }

    return NextResponse.json({
      id: updatedRegistration.id,
      participantId: updatedRegistration.participantId,
      name: updatedRegistration.participant.full_name,
      registrationDate: updatedRegistration.reg_date,
      paymentMethod: updatedRegistration.payment_method,
      payment: updatedRegistration.payment,
      presentDay: updatedRegistration.present_day,
      paymentStatus: updatedRegistration.payment_status,
      message: 'Registration updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating registration:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update registration: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

// GET /api/course-schedule/[id]/participant/registration?participantId=XXX - Get registration details for a participant
export async function GET(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Find registration
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        classId,
        participantId
      },
      include: {
        participant: {
          select: {
            full_name: true
          }
        },
        class: {
          select: {
            price: true
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

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    // Get payment details from the related payment record if available
    const latestPayment = registration.payments[0];
    const paymentDate = latestPayment ? latestPayment.paymentDate : null;

    return NextResponse.json({
      id: registration.id,
      participantId: registration.participantId,
      name: registration.participant.full_name,
      registrationDate: registration.reg_date,
      paymentDate: paymentDate,
      paymentMethod: registration.payment_method,
      payment: registration.payment,
      presentDay: registration.present_day,
      paymentStatus: registration.payment_status,
      totalPrice: registration.class.price
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching registration:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to fetch registration: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch registration' },
      { status: 500 }
    );
  }
} 