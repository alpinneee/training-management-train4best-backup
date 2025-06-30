import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/usertype/[id] - Get a specific usertype
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;

    const usertype = await prisma.userType.findUnique({
      where: {
        id,
      },
    });

    if (!usertype) {
      return NextResponse.json(
        { error: 'Usertype not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      idUsertype: usertype.id,
      usertype: usertype.usertype,
    });
  } catch (error) {
    console.error('Error fetching usertype:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usertype' },
      { status: 500 }
    );
  }
}

// PUT /api/usertype/[id] - Update a usertype
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { usertype } = await request.json();

    if (!usertype) {
      return NextResponse.json(
        { error: 'Usertype name is required' },
        { status: 400 }
      );
    }

    // Check if usertype exists
    const existingUsertype = await prisma.userType.findUnique({
      where: {
        id,
      },
    });

    if (!existingUsertype) {
      return NextResponse.json(
        { error: 'Usertype not found' },
        { status: 404 }
      );
    }

    // Check if the new name conflicts with another usertype
    const existingUsertypes = await prisma.userType.findMany();
    const usertypeLower = usertype.toLowerCase();
    
    const conflictingUsertype = existingUsertypes.find(
      (ut) => ut.usertype.toLowerCase() === usertypeLower && ut.id !== id
    );

    if (conflictingUsertype) {
      return NextResponse.json(
        { error: 'Another usertype with this name already exists' },
        { status: 409 }
      );
    }

    // Update usertype
    const updatedUsertype = await prisma.userType.update({
      where: {
        id,
      },
      data: {
        usertype,
      },
    });

    return NextResponse.json({
      idUsertype: updatedUsertype.id,
      usertype: updatedUsertype.usertype,
    });
  } catch (error) {
    console.error('Error updating usertype:', error);
    return NextResponse.json(
      { error: 'Failed to update usertype' },
      { status: 500 }
    );
  }
}

// DELETE /api/usertype/[id] - Delete a usertype
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    console.log(`DELETE usertype: ${id}, force: ${force}`);

    // Check if usertype exists
    const existingUsertype = await prisma.userType.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: { id: true, username: true },
          take: 5, // Get a few users for the error message
        },
      },
    });

    if (!existingUsertype) {
      console.log('Usertype not found');
      return NextResponse.json(
        { error: 'Usertype not found' },
        { status: 404 }
      );
    }
    
    console.log(`Usertype has ${existingUsertype.user.length} users`);

    // Check if usertype is in use
    if (existingUsertype.user.length > 0 && !force) {
      const userNames = existingUsertype.user.map(user => user.username).join(', ');
      const totalUsers = existingUsertype.user.length;
      const moreText = totalUsers > 5 ? ` and ${totalUsers - 5} more` : '';
      
      console.log(`Cannot delete: usertype is in use by ${totalUsers} users`);
      return NextResponse.json(
        { 
          error: `Cannot delete usertype that is in use by users: ${userNames}${moreText}`, 
          canForce: true,
          usersCount: totalUsers
        },
        { status: 400 }
      );
    }

    // If force is true, update users to use a default usertype first
    if (force && existingUsertype.user.length > 0) {
      console.log('Force delete: finding or creating default usertype');
      // Find or create a "User" type as default
      let defaultType = await prisma.userType.findFirst({
        where: {
          usertype: 'User',
        },
      });
      
      if (!defaultType) {
        console.log('Creating default "User" usertype');
        defaultType = await prisma.userType.create({
          data: {
            id: 'default-' + Date.now().toString(),
            usertype: 'User',
            description: 'Default user type'
          },
        });
      }
      
      console.log(`Reassigning ${existingUsertype.user.length} users to usertype: ${defaultType.id}`);
      
      // Update all users to the default type
      await prisma.user.updateMany({
        where: {
          userTypeId: id,
        },
        data: {
          userTypeId: defaultType.id,
        },
      });
      
      console.log('Users reassigned successfully');
    }

    // Delete usertype
    console.log('Deleting usertype');
    await prisma.userType.delete({
      where: {
        id,
      },
    });
    
    console.log('Usertype deleted successfully');

    return NextResponse.json(
      { message: 'Usertype deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting usertype:', error);
    return NextResponse.json(
      { error: 'Failed to delete usertype: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 