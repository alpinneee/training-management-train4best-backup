import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
export const dynamic = "force-dynamic";
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, valueId: string } }
) {
  try {
    // Get parameters from URL
    const courseScheduleId = params.id;
    const valueId = params.valueId;
    
    if (!valueId) {
      return NextResponse.json(
        { error: "Value ID is required" },
        { status: 400 }
      );
    }

    console.log(`Deleting value ${valueId} for course ${courseScheduleId}`);
    
    // Find value first
    const value = await prisma.valueReport.findUnique({
      where: {
        id: valueId
      }
    });

    if (!value) {
      console.log(`Value ${valueId} not found`);
      return NextResponse.json(
        { error: "Value not found" },
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
      { message: "Value deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting value:", error);
    return NextResponse.json(
      { error: "Failed to delete value" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, valueId: string } }
) {
  try {
    // Get parameters from URL
    const courseScheduleId = params.id;
    const valueId = params.valueId;
    
    if (!valueId) {
      return NextResponse.json(
        { error: "Value ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const data = await request.json();
    const { valueType, remark, value } = data;

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

    console.log(`Updating value ${valueId} for course ${courseScheduleId}`);
    
    // Find value first
    const existingValue = await prisma.valueReport.findUnique({
      where: {
        id: valueId
      }
    });

    if (!existingValue) {
      console.log(`Value ${valueId} not found`);
      return NextResponse.json(
        { error: "Value not found" },
        { status: 404 }
      );
    }

    console.log(`Found value to update:`, {
      id: existingValue.id,
      registrationId: existingValue.registrationId,
      valueType: existingValue.value_type,
      value: existingValue.value
    });

    // Update value
    const updatedValue = await prisma.valueReport.update({
      where: {
        id: valueId
      },
      data: {
        value_type: valueType,
        remark: remark || "",
        value: Number(value)
      }
    });

    console.log(`Value ${valueId} updated successfully`);
    
    return NextResponse.json({
      id: updatedValue.id,
      valueType: updatedValue.value_type,
      remark: updatedValue.remark || '',
      value: updatedValue.value.toString(),
      message: "Value updated successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating value:", error);
    return NextResponse.json(
      { error: "Failed to update value" },
      { status: 500 }
    );
  }
} 