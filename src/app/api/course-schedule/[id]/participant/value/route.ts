import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import jwt from 'jsonwebtoken';

interface Params {
  params: {
    id: string;  // classId
  };
}

// GET /api/course-schedule/[id]/participant/value?participantId=XXX - Get values for a participant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const participantId = searchParams.get("participantId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching values for participant ${participantId} in course ${scheduleId}`);

    // Find registration first
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        classId: scheduleId,
        participantId
      }
    });
    
    if (!registration) {
      console.log(`No registration found for participant ${participantId} in course ${scheduleId}`);
      return NextResponse.json({
        values: [],
        currentPage: page,
        totalPages: 0,
        totalValues: 0
      }, { status: 200 });
    }

    console.log(`Found registration: ${registration.id}`);

    // Get values from database
    const [values, totalCount] = await Promise.all([
      prisma.valueReport.findMany({
        where: {
          registrationId: registration.id
        },
        orderBy: {
          id: 'desc'
        },
        skip,
        take: pageSize
      }),
      prisma.valueReport.count({
        where: {
          registrationId: registration.id
        }
      })
    ]);

    console.log(`Found ${values.length} values for registration ${registration.id}`);

    // Transform data for response
    const formattedValues = values.map(value => ({
      id: value.id,
      valueType: value.value_type,
      remark: value.remark || "",
      value: value.value.toString()
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      values: formattedValues,
      currentPage: page,
      totalPages,
      totalValues: totalCount
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching participant values:", error);
    return NextResponse.json(
      { error: "Failed to fetch participant values" },
      { status: 500 }
    );
  }
}

// POST /api/course-schedule/[id]/participant/value - Add a value for a participant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id;
    
    let data;
    try {
      data = await request.json();
      console.log("Request data:", JSON.stringify(data));
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const { participantId, valueType, remark, value } = data;

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID is required" },
        { status: 400 }
      );
    }
    
    if (!valueType) {
      return NextResponse.json(
        { error: "Value type is required" },
        { status: 400 }
      );
    }
    
    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: "Value is required" },
        { status: 400 }
      );
    }

    // Find registration
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        classId: scheduleId,
        participantId
      }
    });
    
    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found for this participant in this course" },
        { status: 404 }
      );
    }

    console.log("Found registration:", {
      id: registration.id,
      classId: registration.classId,
      participantId: registration.participantId
    });

    // Find any instructure (for simplicity)
    const instructure = await prisma.instructure.findFirst();
    
    if (!instructure) {
      return NextResponse.json(
        { error: "No instructure found in the system" },
        { status: 404 }
      );
    }

    console.log("Found instructure:", {
      id: instructure.id,
      name: instructure.full_name
    });

    // Create the value report
    const valueReport = await prisma.valueReport.create({
      data: {
        id: `val_${Date.now()}`,
        registrationId: registration.id,
        instructureId: instructure.id,
        value_type: valueType,
        remark: remark || "",
        value: Number(value)
      }
    });

    console.log("Value created successfully:", {
      id: valueReport.id,
      registrationId: registration.id,
      instructureId: instructure.id,
      value_type: valueType,
      value: Number(value)
    });

    return NextResponse.json({
      id: valueReport.id,
      valueType: valueReport.value_type,
      remark: valueReport.remark,
      value: valueReport.value.toString(),
      message: "Value added successfully"
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error adding participant value:", error);
    return NextResponse.json(
      { error: "Failed to add participant value" },
      { status: 500 }
    );
  }
}

// PUT /api/course-schedule/[id]/participant/value - Update a value
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { valueId, valueType, remark, value } = await request.json();

    if (!valueId) {
      return NextResponse.json(
        { error: 'Value ID is required' },
        { status: 400 }
      );
    }

    // Find value
    const existingValue = await prisma.valueReport.findUnique({
      where: {
        id: valueId
      }
    });

    if (!existingValue) {
      return NextResponse.json(
        { error: 'Value not found' },
        { status: 404 }
      );
    }

    // Update value
    const updatedValue = await prisma.valueReport.update({
      where: {
        id: valueId
      },
      data: {
        value_type: valueType || existingValue.value_type,
        remark: remark !== undefined ? remark : existingValue.remark,
        value: value !== undefined ? Number(value) : existingValue.value
      }
    });

    return NextResponse.json({
      id: updatedValue.id,
      valueType: updatedValue.value_type,
      remark: updatedValue.remark,
      value: updatedValue.value.toString(),
      message: 'Value updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating value:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update value: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update value' },
      { status: 500 }
    );
  }
}

// DELETE /api/course-schedule/[id]/participant/value?valueId=XXX - Delete a value
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const scheduleId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const valueId = searchParams.get('valueId');

    console.log(`Attempting to delete value ${valueId} from course ${scheduleId}`);

    if (!valueId) {
      return NextResponse.json(
        { error: 'Value ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Find value
    const value = await prisma.valueReport.findUnique({
      where: {
        id: valueId
      }
    });

    if (!value) {
      console.log(`Value ${valueId} not found`);
      return NextResponse.json(
        { error: 'Value not found' },
        { status: 404 }
      );
    }

    console.log(`Found value to delete:`, {
      id: value.id,
      registrationId: value.registrationId,
      valueType: value.value_type,
      value: value.value
    });

    // Delete value
    await prisma.valueReport.delete({
      where: {
        id: valueId
      }
    });

    console.log(`Value ${valueId} deleted successfully`);

    return NextResponse.json(
      { message: 'Value deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting value:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to delete value: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete value' },
      { status: 500 }
    );
  }
} 