import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/user-rule/[id] - Get a specific user rule
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;

    const rule = await prisma.userType.findUnique({
      where: {
        id,
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'User rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: rule.id,
      roleName: rule.usertype,
      description: rule.description || '',  // Use actual description from database
      status: rule.status || 'Active', // Use actual status from database
    });
  } catch (error) {
    console.error('Error fetching user rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rule' },
      { status: 500 }
    );
  }
}

// PUT /api/user-rule/[id] - Update a user rule
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { roleName, description, status } = await request.json();

    if (!roleName) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if rule exists
    const existingRule = await prisma.userType.findUnique({
      where: {
        id,
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'User rule not found' },
        { status: 404 }
      );
    }

    // Check if the new name conflicts with another rule
    if (roleName !== existingRule.usertype) {
      const conflictingRule = await prisma.userType.findFirst({
        where: {
          usertype: roleName,
          id: {
            not: id,
          },
        },
      });

      if (conflictingRule) {
        return NextResponse.json(
          { error: 'Another rule with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data with defaults for null/undefined values
    const updateData = {
      usertype: roleName,
      description: description || '',
      status: status || 'Active',
    };

    // Update rule
    const updatedRule = await prisma.userType.update({
      where: {
        id,
      },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedRule.id,
      roleName: updatedRule.usertype,
      description: updatedRule.description || '',
      status: updatedRule.status || 'Active',
    });
  } catch (error) {
    console.error('Error updating user rule:', error);
    
    // More detailed error response
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update user rule: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/user-rule/[id] - Delete a user rule
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check if rule exists
    const existingRule = await prisma.userType.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          take: 1, // Only need to check if there are any users
        },
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'User rule not found' },
        { status: 404 }
      );
    }

    // Check if rule is in use
    if (existingRule.user.length > 0 && !force) {
      return NextResponse.json(
        { error: 'Cannot delete rule that is in use by users', hint: 'Add ?force=true to URL to force deletion' },
        { status: 400 }
      );
    }

    // Delete rule
    await prisma.userType.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: 'User rule deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user rule:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to delete user rule: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user rule' },
      { status: 500 }
    );
  }
} 