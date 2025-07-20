import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/user/[id] - Get a specific user
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        userType: true,
        instructure: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.userType.usertype,
      createdAt: user.last_login ? new Date(user.last_login).toISOString() : null,
      instructureId: user.instructureId,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/[id] - Delete a user
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        instructure: true,
        participant: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has associated data
    if ((existingUser.instructure || existingUser.participant.length > 0) && !force) {
      return NextResponse.json(
        { error: 'Cannot delete user that has associated records', hint: 'Add ?force=true to URL to force deletion' },
        { status: 400 }
      );
    }

    // If force=true, use direct SQL to bypass foreign key constraints
    if (force) {
      try {
        // We'll use Prisma's executeRaw to run SQL directly
        // Note: This is potentially dangerous as it bypasses constraints
        // but necessary in this case to handle the circular references
        
        // First, get all the IDs we need to clean up
        let instructureId: string | null = null;
        let participantIds: string[] = [];
        
        if (existingUser.instructure) {
          instructureId = existingUser.instructure.id;
        }
        
        if (existingUser.participant.length > 0) {
          participantIds = existingUser.participant.map(p => p.id);
        }
        
        // Log what we're about to delete
        console.log(`Force deleting user ${id} with:`);
        if (instructureId) console.log(`- Instructure ID: ${instructureId}`);
        if (participantIds.length) console.log(`- Participant IDs: ${participantIds.join(', ')}`);
        
        // Use a transaction for all operations
        await prisma.$transaction(async (tx) => {
          // 1. If there are participants, handle their related records
          if (participantIds.length > 0) {
            // Get all registrations for these participants
            const registrations = await tx.courseRegistration.findMany({
              where: {
                participantId: { in: participantIds }
              },
              select: { id: true }
            });
            
            const registrationIds = registrations.map(r => r.id);
            console.log(`Found ${registrationIds.length} registrations to clean up`);
            
            if (registrationIds.length > 0) {
              // Delete certifications
              await tx.certification.deleteMany({
                where: { registrationId: { in: registrationIds } }
              });
              
              // Delete value reports
              await tx.valueReport.deleteMany({
                where: { registrationId: { in: registrationIds } }
              });
              
              // Delete payments
              await tx.payment.deleteMany({
                where: { registrationId: { in: registrationIds } }
              });
              
              // Delete registrations
              await tx.courseRegistration.deleteMany({
                where: { id: { in: registrationIds } }
              });
            }
            
            // Delete certificates linked to participants
            await tx.certificate.deleteMany({
              where: { participantId: { in: participantIds } }
            });
          }
          
          // 2. If there's an instructure, handle its related records
          if (instructureId) {
            // First, use raw SQL to delete instructure classes (bypassing constraints)
            await tx.$executeRawUnsafe(`DELETE FROM instructureclass WHERE instructureId = ?`, instructureId);
            
            // Delete value reports
            await tx.valueReport.deleteMany({
              where: { instructureId }
            });
            
            // Update other users that reference this instructure
            await tx.user.updateMany({
              where: {
                instructureId,
                id: { not: id }
              },
              data: { instructureId: null }
            });
            
            // Set this user's instructureId to null
            await tx.user.update({
              where: { id },
              data: { instructureId: null }
            });
          }
          
          // 3. Delete participants
          if (participantIds.length > 0) {
            await tx.participant.deleteMany({
              where: { id: { in: participantIds } }
            });
          }
          
          // 4. Delete instructure if it exists (now safe to do so)
          if (instructureId) {
            // Use raw SQL to delete the instructure (bypassing constraints)
            await tx.$executeRawUnsafe(`DELETE FROM instructure WHERE id = ?`, instructureId);
          }
          
          // 5. Finally delete the user
          await tx.user.delete({
            where: { id }
          });
        });
        
        console.log('User and all related records deleted successfully');
      } catch (error) {
        console.error('Error in force delete transaction:', error);
        return NextResponse.json(
          { error: `Failed to delete related records: ${error instanceof Error ? error.message : 'Database constraint error'}` },
          { status: 500 }
        );
      }
    } else {
      // Regular delete (no force)
      await prisma.user.delete({
        where: {
          id,
        },
      });
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/[id] - Update a user
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { username, jobTitle, password } = await request.json();

    // Fetch the user to check their current role and associated records
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userType: true,
        participant: true,
        instructure: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the userType for the new job title
    const userType = await prisma.userType.findFirst({
      where: { usertype: jobTitle },
    });

    if (!userType) {
      return NextResponse.json(
        { error: `User type "${jobTitle}" not found` },
        { status: 400 }
      );
    }

    // Check role changes
    const currentRole = existingUser.userType.usertype;
    const isChangingToInstructure = currentRole !== "Instructure" && jobTitle === "Instructure";
    const isChangingToParticipant = currentRole !== "Participant" && jobTitle === "Participant";
    const isChangingFromParticipant = currentRole === "Participant" && jobTitle !== "Participant";
    const isChangingFromInstructure = currentRole === "Instructure" && jobTitle !== "Instructure";

    console.log(`Role change: ${currentRole} -> ${jobTitle}`);

    // Update the user
    const updateData: any = {
      username,
      userTypeId: userType.id,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await hash(password, 10);
    }

    // Update user in transaction with possible role-specific changes
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Handle instructure creation if changing to Instructure
      let instructureId = existingUser.instructureId;
      
      if (isChangingToInstructure && !instructureId) {
        try {
          // Create a basic instructure record
          const newInstructureId = uuidv4();
          
          const instructure = await tx.instructure.create({
            data: {
              id: newInstructureId,
              full_name: username, // Use username as initial full name
              phone_number: "", // Allow empty phone number
              address: "", // Allow empty address
              profiency: "", // Allow empty proficiency
            },
          });
          
          instructureId = instructure.id;
          updateData.instructureId = instructureId;
        } catch (error) {
          console.error("Error creating instructure record:", error);
          // Continue with the user role update even if instructure creation fails
        }
      }
      
      // Handle participant creation if changing to Participant
      if (isChangingToParticipant) {
        try {
          // Check if participant already exists for this user
          const existingParticipant = await tx.participant.findFirst({
            where: { userId: id }
          });
          
          if (!existingParticipant) {
            // Create a new participant record
            await tx.participant.create({
              data: {
                id: uuidv4(),
                full_name: username,
                address: "", // Allow empty address
                phone_number: "", // Allow empty phone number
                birth_date: new Date(), // Default to current date
                gender: "Other", // Default gender
                userId: id,
              },
            });
            
            console.log(`Created new participant record for user ${id}`);
          }
        } catch (error) {
          console.error("Error creating participant record:", error);
          // Continue with the user role update even if participant creation fails
        }
      }
      
      // Handle removing participant if changing from Participant to another role
      if (isChangingFromParticipant && existingUser.participant.length > 0) {
        // Check if participant has any course registrations
        for (const participant of existingUser.participant) {
          const registrations = await tx.courseRegistration.findMany({
            where: { participantId: participant.id },
            select: { id: true }
          });
          
          if (registrations.length === 0) {
            // Safe to delete participant if no registrations
            await tx.participant.delete({
              where: { id: participant.id }
            });
            console.log(`Deleted participant record ${participant.id} for user ${id}`);
          } else {
            console.log(`Cannot delete participant ${participant.id} - has ${registrations.length} registrations`);
          }
        }
      }
      
      // Handle removing instructure if changing from Instructure
      if (isChangingFromInstructure && instructureId) {
        // Check if instructure has any classes
        const instructureClasses = await tx.instructureClass.findMany({
          where: { instructureId },
          select: { id: true }
        });
        
        const valueReports = await tx.valueReport.findMany({
          where: { instructureId },
          select: { id: true }
        });
        
        // If no classes or value reports, we can safely delete the instructure
        if (instructureClasses.length === 0 && valueReports.length === 0) {
          // First remove the reference from the user
          updateData.instructureId = null;
          
          // Then delete the instructure record
          try {
            await tx.instructure.delete({
              where: { id: instructureId }
            });
            console.log(`Deleted instructure record ${instructureId} for user ${id}`);
          } catch (error) {
            console.error(`Failed to delete instructure: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // If deletion fails, at least remove the reference
            updateData.instructureId = null;
          }
        } else {
          // If instructure has classes or reports, just remove the reference
          updateData.instructureId = null;
          console.log(`Cannot delete instructure ${instructureId} - has ${instructureClasses.length} classes and ${valueReports.length} reports`);
        }
      }
      
      // Update the user
      const user = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          userType: true,
        },
      });

      return user;
    });

    // Transform the user data for response
    const responseUser = {
      id: updatedUser.id,
      name: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.userType.usertype,
      createdAt: updatedUser.last_login || new Date(),
      instructureId: updatedUser.instructureId,
    };

    return NextResponse.json(responseUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 