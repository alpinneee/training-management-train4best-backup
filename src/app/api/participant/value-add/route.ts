import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
export const dynamic = "force-dynamic";

/**
 * Endpoint for adding participant values - Simplified version without strict auth
 */
export async function POST(request: NextRequest) {
  console.log("==== ALTERNATIVE PARTICIPANT VALUE API - POST REQUEST ====");
  
  try {
    // Parse request data
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
    
    const { 
      participantId, 
      scheduleId, 
      valueType, 
      value, 
      remark = '',
      instructureId: requestInstructureId
    } = data;

    // Validate required fields
    if (!participantId) {
      return NextResponse.json({ error: "participantId is required" }, { status: 400 });
    }
    
    if (!scheduleId) {
      return NextResponse.json({ error: "scheduleId is required" }, { status: 400 });
    }
    
    if (!valueType) {
      return NextResponse.json({ error: "valueType is required" }, { status: 400 });
    }
    
    if (value === undefined || value === null) {
      return NextResponse.json({ error: "value is required" }, { status: 400 });
    }
    
    console.log(`Looking for registration for participantId: ${participantId} in class: ${scheduleId}`);
    
    try {
      // Find registration
      const registration = await prisma.courseRegistration.findFirst({
        where: {
          classId: scheduleId,
          participantId
        }
      });
      
      if (!registration) {
        console.log("Registration not found");
        // If registration not found, try to create one
        try {
          const courseSchedule = await prisma.class.findUnique({
            where: { id: scheduleId }
          });
          
          if (!courseSchedule) {
            return NextResponse.json(
              { error: "Course schedule not found" },
              { status: 404 }
            );
          }
          
          const participant = await prisma.participant.findUnique({
            where: { id: participantId }
          });
          
          if (!participant) {
            return NextResponse.json(
              { error: "Participant not found" },
              { status: 404 }
            );
          }
          
          // Create registration automatically
          const newRegistration = await prisma.courseRegistration.create({
            data: {
              id: `reg_${Date.now()}`,
              classId: scheduleId,
              participantId: participantId,
              reg_status: "CONFIRMED",
              reg_date: new Date(),
              payment: 0,
              payment_status: "UNPAID",
              present_day: 0
            }
          });
          
          console.log("Created registration automatically:", newRegistration.id);
          
          // Use this new registration directly
          console.log("Creating value directly after registration creation");
          
          // Find or create instructure
          let instructureId = requestInstructureId;
          if (!instructureId) {
            // Try to find any instructure
            const anyInstructure = await prisma.instructure.findFirst();
            if (anyInstructure) {
              instructureId = anyInstructure.id;
              console.log("Using existing instructure:", instructureId);
            } else {
              // Create a new instructure if none exists
              try {
                // Find any instructor-type user
                const instructorUser = await prisma.user.findFirst({
                  where: { userTypeId: "usertype_instructor" }
                });
                
                if (instructorUser) {
                  const newInstructure = await prisma.instructure.create({
                    data: {
                      id: `inst_direct_${Date.now()}`,
                      full_name: "Default Instructor",
                      phone_number: "000-000-0000",
                      address: "Default Address",
                      profiency: "General",
                      user: { connect: { id: instructorUser.id } }
                    }
                  });
                  instructureId = newInstructure.id;
                  console.log("Created instructure with existing user:", instructureId);
                } else {
                  // Create user and instructure
                  const newUser = await prisma.user.create({
                    data: {
                      id: `user_direct_${Date.now()}`,
                      username: "Default Instructor",
                      email: `default_${Date.now()}@example.com`,
                      userTypeId: "usertype_instructor",
                      password: "defaultpassword123"
                    }
                  });
                  
                  const newInstructure = await prisma.instructure.create({
                    data: {
                      id: `inst_direct_${Date.now()}`,
                      full_name: "Default Instructor",
                      phone_number: "000-000-0000",
                      address: "Default Address",
                      profiency: "General",
                      user: { connect: { id: newUser.id } }
                    }
                  });
                  
                  instructureId = newInstructure.id;
                  console.log("Created new user and instructure:", instructureId);
                }
              } catch (error) {
                console.error("Error creating instructure:", error);
                return NextResponse.json(
                  { error: "Failed to create instructure" },
                  { status: 500 }
                );
              }
            }
          }
          
          // Create the value report directly
          const valueReport = await prisma.valueReport.create({
            data: {
              id: `val_${Date.now()}`,
              registrationId: newRegistration.id,
              instructureId: instructureId,
              value_type: valueType,
              remark: remark,
              value: Number(value)
            }
          });
          
          console.log("Value created successfully:", valueReport.id);
          
          return NextResponse.json({
            id: valueReport.id,
            registrationId: newRegistration.id,
            valueType: valueReport.value_type,
            value: valueReport.value.toString(),
            remark: valueReport.remark,
            message: "Registration created and value added successfully"
          }, { status: 201 });
        } catch (regError) {
          console.error("Error in registration creation flow:", regError);
          return NextResponse.json(
            { 
              error: "Failed to create registration automatically", 
              details: regError instanceof Error ? regError.message : String(regError)
            },
            { status: 500 }
          );
        }
      }
      
      console.log("Registration found:", registration.id);
      
      // Create instructure if needed
      let instructureId = requestInstructureId;
      if (!instructureId) {
        // Try to find any instructure
        const anyInstructure = await prisma.instructure.findFirst();
        if (anyInstructure) {
          instructureId = anyInstructure.id;
          console.log("Using existing instructure:", instructureId);
        } else {
          // Create a new simple instructure
          try {
            // Create a basic user and instructure directly
            const newUser = await prisma.user.create({
              data: {
                id: `user_simple_${Date.now()}`,
                username: "System Instructor",
                email: `system_${Date.now()}@example.com`,
                userTypeId: "usertype_instructor",
                password: "defaultpassword123"
              }
            });
            
            const newInstructure = await prisma.instructure.create({
              data: {
                id: `inst_simple_${Date.now()}`,
                full_name: "System Instructor",
                phone_number: "000-000-0000",
                address: "Default Address",
                profiency: "General",
                user: { connect: { id: newUser.id } }
              }
            });
            
            instructureId = newInstructure.id;
            console.log("Created simple instructure:", instructureId);
          } catch (error) {
            console.error("Error creating simple instructure:", error);
            return NextResponse.json(
              { error: "Failed to create instructure" },
              { status: 500 }
            );
          }
        }
      }
      
      // Create the value report directly
      console.log("Creating value report directly with:");
      console.log("- Registration ID:", registration.id);
      console.log("- Instructure ID:", instructureId);
      console.log("- Value Type:", valueType);
      console.log("- Value:", value);
      
      const valueReport = await prisma.valueReport.create({
        data: {
          id: `val_${Date.now()}`,
          registrationId: registration.id,
          instructureId: instructureId,
          value_type: valueType,
          remark: remark,
          value: Number(value)
        }
      });
      
      console.log("Value created successfully:", valueReport.id);
      
      return NextResponse.json({
        id: valueReport.id,
        registrationId: registration.id,
        valueType: valueReport.value_type,
        value: valueReport.value.toString(),
        remark: valueReport.remark,
        message: "Value added successfully"
      }, { status: 201 });
    } catch (dbError) {
      console.error("Database error in main flow:", dbError);
      return NextResponse.json(
        { 
          error: "Database error", 
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in alternative value add endpoint:", error);
    return NextResponse.json(
      { 
        error: "Failed to add participant value",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 