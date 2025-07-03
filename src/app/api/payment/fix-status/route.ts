export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const registrationId = searchParams.get('registrationId');
    const status = searchParams.get('status') || 'Paid';
    
    console.log("Fix payment status request:", { paymentId, registrationId, status });
    
    if (!paymentId && !registrationId) {
      return NextResponse.json(
        { error: "Either paymentId or registrationId is required" },
        { status: 400 }
      );
    }
    
    // Check current status
    if (paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { registration: true }
      });
      
      if (!payment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }
      
      console.log("Current payment status:", {
        paymentId: payment.id,
        status: payment.status,
        registrationId: payment.registrationId,
        registrationStatus: payment.registration?.reg_status,
        paymentStatus: payment.registration?.payment_status
      });
      
      // Update payment and registration
      const [updatedPayment, updatedRegistration] = await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: { 
            status: status,
            updatedAt: new Date()
          }
        }),
        prisma.courseRegistration.update({
          where: { id: payment.registrationId },
          data: {
            reg_status: status === "Paid" ? "Registered" : status,
            payment_status: status
          }
        })
      ]);
      
      return NextResponse.json({
        success: true,
        message: `Payment status fixed to ${status}`,
        payment: updatedPayment,
        registration: updatedRegistration
      });
    } 
    else if (registrationId) {
      const registration = await prisma.courseRegistration.findUnique({
        where: { id: registrationId },
        include: { payments: true }
      });
      
      if (!registration) {
        return NextResponse.json(
          { error: "Registration not found" },
          { status: 404 }
        );
      }
      
      console.log("Current registration status:", {
        registrationId: registration.id,
        regStatus: registration.reg_status,
        paymentStatus: registration.payment_status,
        payments: registration.payments.map(p => ({ id: p.id, status: p.status }))
      });
      
      // Update registration
      const updatedRegistration = await prisma.courseRegistration.update({
        where: { id: registrationId },
        data: {
          reg_status: status === "Paid" ? "Registered" : status,
          payment_status: status
        }
      });
      
      // Update associated payments if they exist
      let updatedPayments: any[] = [];
      if (registration.payments.length > 0) {
        updatedPayments = await Promise.all(
          registration.payments.map(payment => 
            prisma.payment.update({
              where: { id: payment.id },
              data: { 
                status: status,
                updatedAt: new Date()
              }
            })
          )
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `Registration status fixed to ${status}`,
        registration: updatedRegistration,
        payments: updatedPayments
      });
    }
    
  } catch (error) {
    console.error("Error fixing payment status:", error);
    return NextResponse.json(
      { error: "Failed to fix payment status" },
      { status: 500 }
    );
  }
} 