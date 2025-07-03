import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/user-rule - Get all user rules
export async function GET() {
  try {
    const userRules = await prisma.userType.findMany({
      orderBy: {
        usertype: 'asc',
      },
    });

    // Format the response to match the expected structure in the frontend
    const formattedRules = userRules.map((rule, index) => ({
      no: index + 1,
      id: rule.id,
      roleName: rule.usertype,
      description: rule.description || '',  // Use actual description from database
      status: rule.status || 'Active', // Use actual status from database
    }));

    return NextResponse.json(formattedRules);
  } catch (error) {
    console.error('Error fetching user rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rules' },
      { status: 500 }
    );
  }
}

// POST /api/user-rule - Create a new user rule
export async function POST(request: Request) {
  try {
    const { roleName, description, status } = await request.json();

    if (!roleName) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if usertype already exists
    const existingRule = await prisma.userType.findFirst({
      where: {
        usertype: roleName,
      },
    });

    if (existingRule) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 409 }
      );
    }

    // Create new user rule
    const newRule = await prisma.userType.create({
      data: {
        id: `usertype_${Date.now()}_${Math.round(Math.random() * 10000)}`,
        usertype: roleName,
        description: description || '',
        status: status || 'Active',
      },
    });

    return NextResponse.json({
      id: newRule.id,
      roleName: newRule.usertype,
      description: newRule.description || '',
      status: newRule.status || 'Active',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user rule:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create user rule: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user rule' },
      { status: 500 }
    );
  }
} 