import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import jwt from "jsonwebtoken";

// Helper function to get current user ID
async function getCurrentUserId() {
  let userId = null;
  
  // Try from NextAuth session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      // Get the user with participant info to ensure we have the right ID
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          participant: true
        }
      });
      
      if (user?.participant && user.participant.length > 0) {
        console.log("Found participant ID from session:", user.participant[0].id);
        return user.participant[0].id; // Return participant ID instead of user ID
      }
      
      return session.user.id;
    }
  } catch (error) {
    console.error("Error getting session:", error);
  }
  
  // Try from debug token
  try {
    const cookieStore = cookies();
    const debugToken = cookieStore.get("debug_token")?.value;
    
    if (debugToken) {
      const decoded = jwt.verify(
        debugToken, 
        process.env.NEXTAUTH_SECRET || "30a2a5966da74d102ef886556d5fcc2c84a3a849ab7d36b851e872a2592a01f5"
      );
      
      if (decoded && typeof decoded === 'object' && 'id' in decoded) {
        // Get the user with participant info
        const user = await prisma.user.findUnique({
          where: { id: decoded.id as string },
          include: {
            participant: true
          }
        });
        
        if (user?.participant && user.participant.length > 0) {
          console.log("Found participant ID from debug token:", user.participant[0].id);
          return user.participant[0].id; // Return participant ID instead of user ID
        }
        
        return decoded.id as string;
      }
    }
  } catch (error) {
    console.error("Error decoding debug token:", error);
  }
  
  // Try from session token
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("next-auth.session-token")?.value;
    
    if (sessionToken) {
      const decoded = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET || ""
      });
      
      if (decoded && 'id' in decoded) {
        // Get the user with participant info
        const user = await prisma.user.findUnique({
          where: { id: decoded.id as string },
          include: {
            participant: true
          }
        });
        
        if (user?.participant && user.participant.length > 0) {
          console.log("Found participant ID from session token:", user.participant[0].id);
          return user.participant[0].id; // Return participant ID instead of user ID
        }
        
        return decoded.id as string;
      }
    }
  } catch (error) {
    console.error("Error decoding session token:", error);
  }
  
  // Try from user email in localStorage as a last resort
  try {
    const cookieStore = cookies();
    const userEmail = cookieStore.get("userEmail")?.value;
    
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          participant: true
        }
      });
      
      if (user?.participant && user.participant.length > 0) {
        console.log("Found participant ID from email cookie:", user.participant[0].id);
        return user.participant[0].id;
      }
      
      if (user) {
        return user.id;
      }
    }
  } catch (error) {
    console.error("Error finding user by email:", error);
  }
  
  console.error("Could not determine user ID from any source");
  return null;
}

// GET /api/payment - Get all payments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const paymentMethod = searchParams.get('paymentMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const filterByUser = searchParams.get('filterByUser') === 'true';
    const userEmail = searchParams.get('email'); // Get email from query params as fallback
    
    // Get current user ID if filtering by user
    let userId = null;
    if (filterByUser) {
      userId = await getCurrentUserId();
      console.log("Filtering payments for user ID:", userId);
      
      // If userId is null but we have email, try to get user by email
      if (!userId && userEmail) {
        console.log("Trying to get user by email:", userEmail);
        try {
          const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { participant: true }
          });
          
          if (user?.participant && user.participant.length > 0) {
            userId = user.participant[0].id;
            console.log("Found participant ID from email param:", userId);
          }
        } catch (error) {
          console.error("Error finding user by email:", error);
        }
      }
      
      if (!userId) {
        console.log("No user ID found, returning empty result");
        return NextResponse.json({
          data: [],
          total: 0
        });
      }
    }
    
    // Build where clause based on filters
    let whereClause: any = {};
    
    if (status && status !== 'All') {
      whereClause.status = status;
    }
    
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }
    
    if (startDate || endDate) {
      whereClause.paymentDate = {};
      
      if (startDate) {
        whereClause.paymentDate.gte = new Date(startDate);
      }
      
      if (endDate) {
        // Set to end of day for the end date
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.paymentDate.lte = endDateTime;
      }
    }
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        {
          registration: {
            participant: {
              full_name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          referenceNumber: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Add user filter if needed
    if (userId) {
      whereClause.registration = {
        ...whereClause.registration,
        participant: {
          ...whereClause.registration?.participant,
          id: userId
        }
      };
    } else if (userEmail) {
      // Jika tidak ada userId tapi ada email, filter berdasarkan email
      whereClause.registration = {
        ...whereClause.registration,
        participant: {
          ...whereClause.registration?.participant,
          user: {
            email: userEmail
          }
        }
      };
    }
    
    console.log("Where clause:", JSON.stringify(whereClause, null, 2));
    
    // Get payments with filter
    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { paymentDate: 'desc' },
      take: limit,
      include: {
        registration: {
          include: {
            participant: {
              include: {
                user: true
              }
            },
            class: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${payments.length} payments`);
    
    // Format payments for response
    const formattedPayments = payments.map((payment, index) => {
      // Pastikan amount adalah angka valid dari database (atau default ke 1,000,000)
      const paymentAmount = typeof payment.amount === 'number' && !isNaN(payment.amount) 
        ? payment.amount
        : payment.registration?.payment || 1000000;
      
      console.log(`Payment ${payment.id} has amount: ${payment.amount}, from registration: ${payment.registration?.payment}, formatted: ${paymentAmount}`);
      
      return {
        id: payment.id,
        no: index + 1,
        nama: payment.registration?.participant?.full_name || 'Unknown',
        tanggal: payment.paymentDate.toISOString().split('T')[0],
        paymentMethod: payment.paymentMethod,
        nomorReferensi: payment.referenceNumber,
        // Format sebagai mata uang Indonesia
        jumlah: `Rp${paymentAmount.toLocaleString('id-ID')}`,
        // Simpan angka asli dari database
        amount: paymentAmount,
        status: payment.status,
        registrationId: payment.registrationId,
        paymentProof: (payment as any).paymentProof || null,
        courseName: payment.registration?.class?.course?.course_name || 'Unknown Course',
        className: `${payment.registration?.class?.location || 'Unknown'} - ${new Date(payment.registration?.class?.start_date || new Date()).toLocaleDateString()}`
      };
    });
    
    // If no payments found and in development, return mock data
    if (formattedPayments.length === 0 && process.env.NODE_ENV === 'development') {
      // Check if any filter is applied
      const hasFilters = search || paymentMethod || startDate || endDate || (status && status !== 'All');
      
      if (!hasFilters) {
        // Return empty result instead of mock data
        console.log("No payments found and no filters applied, returning empty result");
      } else {
        console.log("No payments found with applied filters, returning empty result");
      }
    }
    
    return NextResponse.json({
      data: formattedPayments,
      total: formattedPayments.length
    });
    
  } catch (error) {
    console.error("Error fetching payments:", error);
    
   
    
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/payment - Create a new payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentDate, amount, paymentMethod, referenceNumber, status, registrationId } = body;
    
    if (!paymentDate || !amount || !paymentMethod || !referenceNumber || !registrationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create payment
    const newPayment = await prisma.payment.create({
      data: {
        paymentDate: new Date(paymentDate),
        amount: parseFloat(amount.toString()),
        paymentMethod,
        referenceNumber,
        status: status || "Unpaid",
        registrationId,
      },
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
