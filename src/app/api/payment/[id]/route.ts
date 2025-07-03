import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/payment/[id] - Get a specific payment
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Handle mock IDs for development
    if ((id.startsWith('mock-') || id.startsWith('demo-')) && process.env.NODE_ENV !== 'production') {
      console.log(`Returning mock data for payment ID: ${id}`);
      
      // Generate mock data based on the ID
      const mockNumber = parseInt(id.replace(/\D/g, '') || '1');
      const mockData = {
        id: id,
        paymentDate: new Date().toISOString(),
        amount: 1000000 + (mockNumber * 500000),
        paymentMethod: ["Transfer Bank", "E-Wallet", "Kartu Kredit"][mockNumber % 3],
        referenceNumber: `REF-MOCK-${mockNumber.toString().padStart(4, '0')}`,
        status: ["Paid", "Unpaid", "Pending"][mockNumber % 3],
        registrationId: `mock-reg-${mockNumber}`,
        participantName: ["John Doe", "Jane Smith", "Bob Johnson"][mockNumber % 3],
        courseName: ["Leadership Training", "Digital Marketing", "Project Management"][mockNumber % 3],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json(mockData);
    }
    
    console.log(`Fetching payment with ID: ${id}`);

    // First try to find by payment ID
    let payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        registration: {
          include: {
            participant: true,
            class: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    
    // If payment not found by direct ID, try to find by registration ID
    // This handles cases where the course registration ID is passed instead of a payment ID
    if (!payment) {
      console.log(`Payment not found with ID ${id}, checking if it's a registration ID`);
      
      // Find payment by registration ID
      const paymentsByRegistration = await prisma.payment.findMany({
        where: { registrationId: id },
        include: {
          registration: {
            include: {
              participant: true,
              class: {
                include: {
                  course: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      if (paymentsByRegistration.length > 0) {
        payment = paymentsByRegistration[0];
        console.log(`Found payment by registration ID: ${payment.id}`);
      }
    }
    
    // If still no payment found, try to get the course registration directly
    if (!payment) {
      console.log(`No payment found, checking for course registration with ID ${id}`);
      
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
          }
        }
      });
      
      if (registration) {
        console.log(`Found course registration. Creating payment response format`);
        
        // Format registration data to match payment response format
        const paymentAmount = typeof registration.payment === 'number' && !isNaN(registration.payment) 
          ? registration.payment 
          : 1000000;
        
        console.log(`Formatting registration ${registration.id} with payment: ${registration.payment}, using: ${paymentAmount}`);
        
        const formattedRegistration = {
          id: `payment_placeholder_${id}`,
          registrationId: registration.id,
          paymentDate: registration.reg_date?.toISOString(),
          amount: paymentAmount,
          paymentAmount: paymentAmount,
          paymentMethod: registration.payment_method || "Transfer Bank",
          referenceNumber: `REF-${Date.now()}`,
          status: registration.payment_status,
          paymentStatus: registration.payment_status,
          courseName: registration.class?.course?.course_name || "",
          className: `${registration.class?.location || ''} - ${new Date(registration.class?.start_date).toLocaleDateString() || ''}`,
          courseScheduleId: registration.classId,
          // Handle user info with type safety
          userInfo: registration.participant ? {
            email: (registration.participant as any).user?.email || '',
            username: (registration.participant as any).user?.username || '',
            fullName: registration.participant.full_name
          } : null,
          participantName: registration.participant?.full_name || "",
          createdAt: registration.reg_date?.toISOString(),
          updatedAt: new Date().toISOString(),
          jumlah: `Rp${paymentAmount.toLocaleString('id-ID')}`,
        };
        
        console.log('Returning formatted registration as payment:', formattedRegistration);
        return NextResponse.json(formattedRegistration);
      }
      
      // If we get here, no payment or registration was found
      return NextResponse.json(
        { error: "Payment or registration not found" },
        { status: 404 }
      );
    }
    
    // Format the response to ensure it has all needed fields
    const paymentAmount = typeof payment.amount === 'number' && !isNaN(payment.amount) 
      ? payment.amount 
      : 1000000;
    
    console.log(`Formatting payment ${payment.id} with amount: ${payment.amount}, using: ${paymentAmount}`);
    
    const formattedPayment = {
      id: payment.id,
      paymentDate: payment.paymentDate?.toISOString(),
      amount: paymentAmount,
      paymentAmount: paymentAmount,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      status: payment.status,
      paymentStatus: payment.status, // Adding this field for consistency
      registrationId: payment.registrationId,
      participantName: payment.registration?.participant?.full_name || "",
      courseName: payment.registration?.class?.course?.course_name || "",
      className: payment.registration?.class 
        ? `${payment.registration.class.location || ''} - ${new Date(payment.registration.class.start_date).toLocaleDateString() || ''}` 
        : "",
      courseScheduleId: payment.registration?.classId || "",
      // Handle user info with type safety
      userInfo: payment.registration?.participant ? {
        email: (payment.registration?.participant as any)?.user?.email || '',
        username: (payment.registration?.participant as any)?.user?.username || '',
        fullName: payment.registration.participant.full_name
      } : null,
      createdAt: payment.createdAt?.toISOString(),
      updatedAt: payment.updatedAt?.toISOString(),
      jumlah: `Rp${paymentAmount.toLocaleString('id-ID')}`, // Format amount with Indonesian format
    };
    
    console.log('Returning formatted payment:', formattedPayment);
    return NextResponse.json(formattedPayment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}

// PUT /api/payment/[id] - Update a payment
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { 
      paymentDate, 
      paymentMethod, 
      referenceNumber, 
      amount, 
      status 
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    console.log(`Processing PUT request for payment ID: ${id}`, body);
    
    // Handle mock IDs for development
    if ((id.startsWith('mock-') || id.startsWith('demo-')) && process.env.NODE_ENV !== 'production') {
      console.log(`Processing mock payment update for ID: ${id}`);
      
      // Return success response for mock data
      const mockData = {
        id: id,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        amount: amount !== undefined ? parseFloat(amount.toString()) : 1000000,
        paymentMethod: paymentMethod || "Transfer Bank",
        referenceNumber: referenceNumber || `REF-MOCK-UPDATED`,
        status: status || "Paid",
        registrationId: `mock-reg-1`,
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        message: "Mock payment updated successfully",
        payment: mockData
      });
    }
    
    // Check if payment exists
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
    
    // Check if reference number already exists (if it's changed)
    if (referenceNumber && referenceNumber !== payment.referenceNumber) {
      const existingPayment = await prisma.payment.findUnique({
        where: { referenceNumber },
      });
      
      if (existingPayment && existingPayment.id !== id) {
        return NextResponse.json(
          { error: "Reference number already exists" },
          { status: 409 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (paymentDate) updateData.paymentDate = new Date(paymentDate);
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (referenceNumber) updateData.referenceNumber = referenceNumber;
    if (amount !== undefined) updateData.amount = parseFloat(amount.toString());
    if (status) updateData.status = status;
    
    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData
    });
    
    // If status is changed, also update the registration status
    if (status && status !== payment.status && payment.registration) {
      const regStatus = status === "Paid" ? "Registered" : status;
      
      await prisma.courseRegistration.update({
        where: { id: payment.registrationId },
        data: {
          payment_status: status,
          reg_status: regStatus
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
      payment: updatedPayment
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}

// DELETE /api/payment/[id] - Delete a payment
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }
    
    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id }
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }
    
    // Delete payment
    await prisma.payment.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: "Payment deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
} 