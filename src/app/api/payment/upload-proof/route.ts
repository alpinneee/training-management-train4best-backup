import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const registrationId = formData.get("registrationId") as string;
    const paymentProof = formData.get("paymentProof") as File;
    
    console.log("Upload payment proof request received:", { registrationId });
    
    if (!registrationId || !paymentProof) {
      console.log("Missing required fields:", { registrationId: !!registrationId, paymentProof: !!paymentProof });
      return NextResponse.json(
        { error: "Registration ID and payment proof are required" },
        { status: 400 }
      );
    }
    
    console.log("File details:", { 
      name: paymentProof.name, 
      type: paymentProof.type, 
      size: paymentProof.size 
    });
    
    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validMimeTypes.includes(paymentProof.type)) {
      console.log("Invalid file type:", paymentProof.type);
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image (JPEG, PNG, GIF) or PDF" },
        { status: 400 }
      );
    }
    
    // Validate file size (max 5MB)
    if (paymentProof.size > 5 * 1024 * 1024) {
      console.log("File too large:", paymentProof.size);
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }
    
    // Check if registration exists
    const registration = await prisma.courseRegistration.findUnique({
      where: { id: registrationId },
      include: {
        payments: true,
        class: true
      }
    });
    
    if (!registration) {
      console.log("Registration not found:", registrationId);
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }
    
    console.log("Registration found:", registration.id);
    
    // Create uploads directory structure
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const paymentProofsDir = path.join(uploadsDir, 'payment-proofs');
    
    // Ensure directories exist
    try {
      // Check if public directory exists
      if (!fs.existsSync(publicDir)) {
        console.log("Creating public directory");
        await mkdir(publicDir, { recursive: true });
      }
      
      // Check if uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        console.log("Creating uploads directory");
        await mkdir(uploadsDir, { recursive: true });
      }
      
      // Check if payment-proofs directory exists
      if (!fs.existsSync(paymentProofsDir)) {
        console.log("Creating payment-proofs directory");
        await mkdir(paymentProofsDir, { recursive: true });
      }
    } catch (err) {
      console.error('Error creating directory structure:', err);
      return NextResponse.json(
        { error: "Failed to create upload directory" },
        { status: 500 }
      );
    }
    
    // Generate a unique filename
    const fileExt = paymentProof.name.split('.').pop();
    const fileName = `payment_${registrationId}_${Date.now()}.${fileExt}`;
    const filePath = path.join(paymentProofsDir, fileName);
    const relativePath = `/uploads/payment-proofs/${fileName}`;
    
    console.log("Saving file to:", filePath);
    console.log("Relative path:", relativePath);
    
    // Save file to disk
    try {
      const bytes = await paymentProof.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      console.log("File saved successfully");
    } catch (err) {
      console.error('Error writing file:', err);
      return NextResponse.json(
        { error: "Failed to save payment proof file: " + (err instanceof Error ? err.message : "Unknown error") },
        { status: 500 }
      );
    }
    
    try {
      // Update registration with payment status
      await prisma.courseRegistration.update({
        where: { id: registrationId },
        data: {
          payment_status: "Pending" // Payment needs admin verification
        }
      });
      
      console.log("Registration updated with pending payment status");
      
      // Create or update payment record
      const paymentData = {
        paymentDate: new Date(),
        amount: registration.payment,
        paymentMethod: "Bank Transfer",
        referenceNumber: `REF${Date.now()}`,
        status: "Pending",
        paymentProof: relativePath,
        registrationId: registration.id,
      };
      
      if (registration.payments && registration.payments.length > 0) {
        // Update existing payment
        await prisma.payment.update({
          where: { id: registration.payments[0].id },
          data: {
            status: "Pending",
            paymentProof: relativePath
          }
        });
        console.log("Existing payment record updated");
      } else {
        // Create new payment record
        await prisma.payment.create({
          data: paymentData
        });
        console.log("New payment record created");
      }
    } catch (dbErr) {
      console.error("Database error:", dbErr);
      // File was saved but database update failed
      return NextResponse.json(
        { error: "Failed to update payment record in database" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Payment proof uploaded successfully. Your registration is pending admin verification.",
      paymentProofUrl: relativePath
    });
    
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    return NextResponse.json(
      { error: "Failed to upload payment proof: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
} 