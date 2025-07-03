import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/instructure/[id] - Mendapatkan instruktur berdasarkan ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;

    const instructure = await prisma.instructure.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            email: true
          },
          take: 1 // Limit to first user
        }
      }
    });

    if (!instructure) {
      return NextResponse.json(
        { error: 'Instructure not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: instructure.id,
      fullName: instructure.full_name,
      phoneNumber: instructure.phone_number,
      proficiency: instructure.profiency,
      address: instructure.address,
      photo: instructure.photo || null,
      email: instructure.user && instructure.user.length > 0 ? instructure.user[0].email : null,
    });
  } catch (error) {
    console.error('Error fetching instructure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructure' },
      { status: 500 }
    );
  }
}

// PUT /api/instructure/[id] - Memperbarui instruktur
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { fullName, phoneNumber, proficiency, address, photo } = await request.json();

    // Periksa apakah instruktur ada
    const existingInstructure = await prisma.instructure.findUnique({
      where: {
        id,
      },
    });

    if (!existingInstructure) {
      return NextResponse.json(
        { error: 'Instructure not found' },
        { status: 404 }
      );
    }

    // Perbarui instruktur
    const updatedInstructure = await prisma.instructure.update({
      where: {
        id,
      },
      data: {
        full_name: fullName || existingInstructure.full_name,
        phone_number: phoneNumber || existingInstructure.phone_number,
        profiency: proficiency || existingInstructure.profiency,
        address: address || existingInstructure.address,
        photo: photo || existingInstructure.photo,
      },
    });

    return NextResponse.json({
      id: updatedInstructure.id,
      fullName: updatedInstructure.full_name,
      phoneNumber: updatedInstructure.phone_number,
      proficiency: updatedInstructure.profiency,
      address: updatedInstructure.address,
      photo: updatedInstructure.photo,
    });
  } catch (error) {
    console.error('Error updating instructure:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update instructure: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update instructure' },
      { status: 500 }
    );
  }
}

// PATCH /api/instructure/[id] - Update an instructure (partial update)
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { fullName, phoneNumber, proficiency, address, photo, birthDate } = await request.json();

    // Check if instructure exists
    const existingInstructure = await prisma.instructure.findUnique({
      where: {
        id,
      },
    });

    if (!existingInstructure) {
      return NextResponse.json(
        { error: 'Instructure not found' },
        { status: 404 }
      );
    }

    // Update instructure
    const updatedInstructure = await prisma.instructure.update({
      where: {
        id,
      },
      data: {
        full_name: fullName || existingInstructure.full_name,
        phone_number: phoneNumber || existingInstructure.phone_number,
        profiency: proficiency || existingInstructure.profiency,
        address: address || existingInstructure.address,
        photo: photo || existingInstructure.photo,
      },
    });

    return NextResponse.json({
      id: updatedInstructure.id,
      fullName: updatedInstructure.full_name,
      phoneNumber: updatedInstructure.phone_number,
      proficiency: updatedInstructure.profiency,
      address: updatedInstructure.address,
      photo: updatedInstructure.photo,
    });
  } catch (error) {
    console.error('Error updating instructure:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update instructure: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update instructure' },
      { status: 500 }
    );
  }
}

// DELETE /api/instructure/[id] - Menghapus instruktur
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    console.log(`Attempting to delete instructure with ID: ${id}, force: ${force}`);
    
    // Periksa apakah instruktur ada
    const existingInstructure = await prisma.instructure.findUnique({
      where: { id },
    });

    if (!existingInstructure) {
      console.log(`Instructure with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Instructure not found' },
        { status: 404 }
      );
    }

    console.log(`Found instructure: ${existingInstructure.full_name}`);

    console.log(`Force delete option: ${force}`);
    
    // Jika tidak force delete, periksa relasi
    if (!force) {
      // Cek relasi user
      try {
        const usersCount = await prisma.user.count({
          where: { instructureId: id }
        });
        
        if (usersCount > 0) {
          console.log(`Cannot delete: ${usersCount} users associated with this instructure`);
          return NextResponse.json(
            { 
              error: 'Cannot delete instructure that is associated with users. If you delete this instructure, associated users will be changed to unassigned role.', 
              hint: 'Add ?force=true to URL to force deletion and change users to unassigned role' 
            },
            { status: 400 }
          );
        }
      } catch (relError) {
        console.error('Error checking user relations:', relError);
      }

      // Cek relasi kelas - menggunakan camelCase untuk nama model sesuai dengan Prisma
      try {
        const classesCount = await prisma.instructureClass.count({
          where: { instructureId: id }
        });
        
        if (classesCount > 0) {
          console.log(`Cannot delete: ${classesCount} classes associated with this instructure`);
          return NextResponse.json(
            { 
              error: 'Cannot delete instructure that is associated with classes',
              hint: 'Add ?force=true to URL to force deletion'
            },
            { status: 400 }
          );
        }
      } catch (relError) {
        console.error('Error checking class relations:', relError);
      }
    }

    // Find users associated with this instructure
    const associatedUsers = await prisma.user.findMany({
      where: { instructureId: id },
      include: { userType: true }
    });
    
    console.log(`Found ${associatedUsers.length} users associated with instructure ID: ${id}`);
    
    // Find all possible Instructure role variations
    const possibleRoles = ['Instructure', 'instructure', 'INSTRUCTURE'];
    const instructureRoles = await Promise.all(
      possibleRoles.map(async (roleName) => {
        const role = await prisma.userType.findFirst({
          where: { usertype: roleName }
        });
        if (role) {
          console.log(`Found role with name ${roleName}, id: ${role.id}`);
        }
        return role;
      })
    );
    
    // Filter out null values
    const validInstructureRoles = instructureRoles.filter(Boolean);
    console.log(`Found ${validInstructureRoles.length} valid instructure roles`);

    // Get the role IDs
    const instructureRoleIds = validInstructureRoles.map(role => role!.id);
    console.log("Instructure role IDs:", instructureRoleIds);
    
    // Check if any of these users have the Instructure role (using role IDs we found)
    const usersWithInstructureRole = associatedUsers
      .filter(user => instructureRoleIds.includes(user.userTypeId))
      .map(user => user.id);
    
    console.log(`${usersWithInstructureRole.length} of these users have the Instructure role`);
    
    // Log all user roles for debugging
    console.log("User roles found:", associatedUsers.map(user => user.userType.usertype));
    
    // Find the Instructure role to get its exact case
    const instructureRole = await prisma.userType.findFirst({
      where: {
        usertype: 'Instructure'
      }
    });
    
    // If not found with exact case, try lowercase
    if (!instructureRole) {
      const instructureRoleLower = await prisma.userType.findFirst({
        where: {
          usertype: 'instructure'
        }
      });
      console.log("Lowercase instructure role:", instructureRoleLower);
    }
    
    console.log("Instructure role in database:", instructureRole);
    
    // Get unassigned role
    const unassignedRole = await prisma.userType.findFirst({
      where: { usertype: 'unassigned' }
    });
    
    console.log("Unassigned role:", unassignedRole);
    
    // Get all user types for debugging
    const allUserTypes = await prisma.userType.findMany();
    console.log("All user types:", allUserTypes.map(ut => ({ id: ut.id, usertype: ut.usertype })));
    
    // Create unassigned role if it doesn't exist
    let roleToUse = unassignedRole;
    if (!unassignedRole) {
      console.log("Creating unassigned role as it doesn't exist");
      roleToUse = await prisma.userType.create({
        data: {
          id: 'utype_unassigned',
          usertype: 'unassigned',
          description: 'Default role for new users'
        }
      });
      console.log("Created unassigned role:", roleToUse);
    }
    
    // Define updateResult outside the transaction to make it available in the response
    let updateResult = { count: 0 };
    
    // Use transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Update all associated users to unassigned role
      if (associatedUsers.length > 0) {
        // Use the role we found or created earlier
        if (!roleToUse) {
          throw new Error("Could not find or create unassigned role");
        }
        
        // Log each user being updated
        for (const user of associatedUsers) {
          console.log(`Updating user ${user.id} from role ${user.userType.usertype} to unassigned`);
        }
        
        // Only update users that have the Instructure role (using role IDs we found)
        // This ensures we don't change roles for users who are already not instructors
        const instructureUserIds = associatedUsers
          .filter(user => instructureRoleIds.includes(user.userTypeId))
          .map(user => user.id);
        
        console.log(`Found ${instructureUserIds.length} users with Instructure role to update`);
        
        if (instructureUserIds.length > 0) {
          // Update users to unassigned role and remove instructureId
          updateResult = await tx.user.updateMany({
            where: { 
              id: { in: instructureUserIds },
              instructureId: id 
            },
            data: { 
              userTypeId: roleToUse.id,
              instructureId: null
            }
          });
          
          console.log(`Updated ${updateResult.count} users to unassigned role with ID ${roleToUse.id}`);
          
          // Double-check the update worked by fetching the users again
          const updatedUsers = await tx.user.findMany({
            where: { id: { in: associatedUsers.map(u => u.id) } },
            include: { userType: true }
          });
          
          for (const user of updatedUsers) {
            console.log(`User ${user.id} now has role: ${user.userType.usertype}`);
          }
        } else {
          console.log("No users with Instructure role to update");
        }
      }
      
      // Delete the instructure
      await tx.instructure.delete({
        where: { id },
      });
    });

    console.log(`Successfully deleted instructure ID: ${id}`);
    
    return NextResponse.json(
      { 
        message: 'Instructure deleted successfully', 
        timestamp: new Date().getTime(),
        usersUpdated: updateResult ? updateResult.count : 0,
        unassignedRoleId: roleToUse ? roleToUse.id : null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting instructure:', error);
    
    // Log detailed error information
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: `Failed to delete instructure: ${error.message}`,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete instructure: Unknown error' },
      { status: 500 }
    );
  }
}