import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic";
// Ensure default roles exist
async function ensureDefaultRolesExist() {
  try {
    const roles = [
      { id: 'utype_unassigned', usertype: 'unassigned', description: 'Default role for new users' },
      { id: 'utype_participant', usertype: 'participant', description: 'Training participant' }
    ];
    
    for (const role of roles) {
      const existingRole = await prisma.userType.findFirst({
        where: { usertype: role.usertype }
      });
      
      if (!existingRole) {
        await prisma.userType.create({
          data: role
        });
        console.log(`Created default role: ${role.usertype}`);
      }
    }
  } catch (error) {
    console.error("Failed to ensure default roles exist:", error);
  }
}

// GET /api/enrollments - Mendapatkan semua pendaftaran
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      )
    }

    // Get enrollments for the participant
    const enrollments = await prisma.courseRegistration.findMany({
      where: {
        participantId,
      },
      include: {
        class: {
          include: {
            course: true,
          },
        },
        payments: true,
      },
      orderBy: {
        reg_date: 'desc',
      },
    })

    return NextResponse.json({
      data: enrollments.map(enrollment => ({
        id: enrollment.id,
        registrationDate: enrollment.reg_date,
        status: enrollment.reg_status,
        amount: enrollment.payment,
        paymentStatus: enrollment.payment_status,
        className: enrollment.class.course.course_name,
        classStart: enrollment.class.start_date,
        classEnd: enrollment.class.end_date,
        location: enrollment.class.location,
        payment: enrollment.payments[0] || null,
      })),
    })
  } catch (error) {
    console.error("Error fetching enrollments:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch enrollments",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST /api/enrollments - Create a new course enrollment
export async function POST(request: Request) {
  try {
    // Ensure default roles exist before enrollment
    await ensureDefaultRolesExist();
    
    const { participantId, classId, payment_method, userData } = await request.json()

    // Validate required fields
    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      )
    }

    let participant;
    
    // If participantId is provided, check if participant exists
    if (participantId) {
      participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: {
          user: true // Include user information to check the role
        }
      });
    }
    
    // If no participant found and userData is provided (creating from user session)
    if (!participant && userData) {
      try {
        // Get user by ID or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { id: userData.userId },
              { email: userData.email }
            ]
          }
        });
        
        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        
        // Get participant role
        const participantRole = await prisma.userType.findFirst({
          where: { usertype: 'participant' }
        });
        
        if (!participantRole) {
          return NextResponse.json(
            { error: "Participant role not found in system" },
            { status: 500 }
          );
        }
        
        // Check if a participant already exists for this user
        const existingParticipant = await prisma.participant.findFirst({
          where: { userId: user.id }
        });
        
        if (existingParticipant) {
          participant = {
            ...existingParticipant,
            user
          };
        } else {
          // Create a new participant with minimal required data
          const newParticipant = await prisma.participant.create({
            data: {
              id: `participant_${Date.now()}`,
              full_name: userData.name || user.email.split('@')[0],
              gender: userData.gender || 'Not specified',
              phone_number: userData.phone || '000000000',
              address: userData.address || 'Not specified',
              birth_date: new Date(),
              userId: user.id
            }
          });
          
          // Update user role to participant
          await prisma.user.update({
            where: { id: user.id },
            data: { userTypeId: participantRole.id }
          });
          
          participant = {
            ...newParticipant,
            user
          };
          
          console.log(`Created new participant profile for user: ${user.id}`);
        }
      } catch (error) {
        console.error('Error creating participant profile:', error);
        return NextResponse.json(
          { error: "Failed to create participant profile" },
          { status: 500 }
        );
      }
    }

    // If still no participant, return error
    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      )
    }

    // Check if user has participant role, if not, update it
    if (participant.user) {
      // Get participant userType
      const participantType = await prisma.userType.findFirst({
        where: { usertype: 'participant' }
      });

      if (!participantType) {
        return NextResponse.json(
          { error: "Participant role not found in system" },
          { status: 500 }
        )
      }

      // Only update if current role is not participant
      if (participant.user.userTypeId !== participantType.id) {
        await prisma.user.update({
          where: { id: participant.user.id },
          data: { userTypeId: participantType.id }
        });
        console.log(`User ${participant.user.id} role updated to participant`);
      }
    }

    // Check if class exists and has available quota
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }

    // Check if the class is still open for registration
    const currentDate = new Date()
    if (currentDate < new Date(classData.start_reg_date) || 
        currentDate > new Date(classData.end_reg_date)) {
      return NextResponse.json(
        { error: "Registration period for this class is closed" },
        { status: 400 }
      )
    }

    // Check if there's available quota
    // First, count existing registrations
    const registrationCount = await prisma.courseRegistration.count({
      where: { classId },
    })

    if (registrationCount >= classData.quota) {
      return NextResponse.json(
        { error: "Class is already full" },
        { status: 400 }
      )
    }

    // Check if participant is already registered for this class
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: {
        participantId: participant.id,
        classId,
      },
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: "You are already registered for this class" },
        { status: 400 }
      )
    }

    // Create a registration ID
    const registrationId = `reg_${Date.now()}`

    // Create the registration in a transaction
    const newRegistration = await prisma.$transaction(async (prisma) => {
      // Create the course registration
      const registration = await prisma.courseRegistration.create({
        data: {
          id: registrationId,
          reg_date: new Date(),
          reg_status: "Pending",
          payment: classData.price,
          payment_status: "Unpaid",
          payment_method: payment_method || "Transfer Bank",
          present_day: 0,
          classId,
          participantId: participant.id,
        },
      })

      // Create a payment record
      const payment = await prisma.payment.create({
        data: {
          id: `payment_${Date.now()}`,
          paymentDate: new Date(),
          amount: classData.price,
          paymentMethod: payment_method || "Transfer Bank",
          referenceNumber: `REF${Date.now()}`,
          status: "Unpaid",
          registrationId: registration.id,
        },
      })

      return {
        registration,
        payment,
      }
    })

    return NextResponse.json({
      id: newRegistration.registration.id,
      registrationDate: newRegistration.registration.reg_date,
      amount: newRegistration.registration.payment,
      paymentStatus: newRegistration.registration.payment_status,
      referenceNumber: newRegistration.payment.referenceNumber,
      message: "Registration successful. Please complete your payment.",
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating enrollment:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create enrollment: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    )
  }
} 