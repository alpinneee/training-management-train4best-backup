import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import { getBankAccounts } from "@/app/api/bank-accounts/route";

// Function untuk mendapatkan user langsung dari database
async function getCurrentUser(emailParam?: string) {
  try {
    // Tambahkan logging awal
    console.log("getCurrentUser called with email:", emailParam || "no email provided");
    
    // DIRECT ACCESS: If email is provided, try to fetch user directly from database first
    if (emailParam) {
      console.log("Direct database lookup for email:", emailParam);
      try {
        const user = await prisma.user.findUnique({
          where: { email: emailParam },
          include: {
            participant: true,
            userType: true
          }
        });
        
        if (user) {
          console.log("User found directly by email:", emailParam);
          
          // Format respons
          const participantData = user.participant && user.participant.length > 0 
            ? user.participant[0] 
            : null;
          
          if (!participantData) {
            console.log(`User ${user.email} has no participant profile`);
          } else {
            console.log(`User ${user.email} has participant profile with ID ${participantData.id}`);
          }
          
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            userType: user.userType.usertype,
            participant: participantData ? {
              id: participantData.id,
              fullName: participantData.full_name,
              gender: participantData.gender,
              phone_number: participantData.phone_number,
              address: participantData.address,
              birth_date: participantData.birth_date,
              job_title: participantData.job_title,
              company: participantData.company
            } : null,
            hasParticipantProfile: !!participantData
          };
        }
      } catch (directError) {
        console.error("Error in direct database lookup:", directError);
        // Continue to standard authentication flows if direct lookup fails
      }
    }
    
    // Regular auth flows as fallback
    // Ambil data dari berbagai sumber autentikasi
    let userId = null;
    let userEmail = emailParam;
    
    // Coba dari session NextAuth jika tidak ada email
    if (!userEmail) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          console.log("User found in NextAuth session");
          userId = session.user.id;
          userEmail = userEmail || session.user.email;
        }
      } catch (sessionError) {
        console.log("NextAuth session error:", sessionError);
      }
    }
    
    // Coba dari debug token
    if (!userId && !userEmail) {
      try {
        const cookieStore = cookies();
        const debugToken = cookieStore.get("debug_token")?.value;
        
        if (debugToken) {
          const decoded = jwt.verify(
            debugToken, 
            process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT"
          );
          
          if (decoded && typeof decoded === 'object') {
            console.log("User found in debug token");
            userId = decoded.id as string;
            userEmail = userEmail || decoded.email as string;
          }
        }
      } catch (tokenError) {
        console.log("Debug token error:", tokenError);
      }
    }
    
    // Coba dari session token
    if (!userId && !userEmail) {
      try {
        const cookieStore = cookies();
        const sessionToken = cookieStore.get("next-auth.session-token")?.value;
        
        if (sessionToken) {
          const decoded = await decode({
            token: sessionToken,
            secret: process.env.NEXTAUTH_SECRET || ""
          });
          
          if (decoded) {
            console.log("User found in session token");
            userId = decoded.id as string;
            userEmail = userEmail || decoded.email as string;
          }
        }
      } catch (tokenError) {
        console.log("Session token error:", tokenError);
      }
    }
    
    // Jika tidak ada user ID atau email, return null
    if (!userId && !userEmail) {
      console.log("No user identification found");
      return null;
    }
    
    console.log("Proceeding to find user with userId:", userId, "or email:", userEmail);
    
    // Cari user di database
    let user = null;
    
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          participant: true,
          userType: true
        }
      });
      
      if (user) {
        console.log("User found by ID:", userId);
      }
    }
    
    if (!user && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          participant: true,
          userType: true
        }
      });
      
      if (user) {
        console.log("User found by email:", userEmail);
      }
    }
    
    if (!user) {
      console.log("User not found in database for userId:", userId, "or email:", userEmail);
      return null;
    }
    
    // Format respons
    const participantData = user.participant && user.participant.length > 0 
      ? user.participant[0] 
      : null;
    
    if (!participantData) {
      console.log(`User ${user.email} has no participant profile`);
    } else {
      console.log(`User ${user.email} has participant profile with ID ${participantData.id}`);
    }
    
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      userType: user.userType.usertype,
      participant: participantData ? {
        id: participantData.id,
        fullName: participantData.full_name,
        gender: participantData.gender,
        phone_number: participantData.phone_number,
        address: participantData.address,
        birth_date: participantData.birth_date,
        job_title: participantData.job_title,
        company: participantData.company
      } : null,
      hasParticipantProfile: !!participantData
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const { classId, paymentMethod, email } = await req.json();
    
    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }
    
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Format email tidak valid. Gunakan format: contoh@domain.com" },
          { status: 400 }
        );
      }
    }
    
    console.log(`Course registration request for class ${classId}, payment ${paymentMethod || 'Transfer Bank'}, email: ${email || 'not provided'}`);
    
    // PRIORITAS 1: Cek user yang sedang login (session)
    let currentUser = null;
    
    try {
      console.log("Checking for authenticated user session...");
      const session = await getServerSession(authOptions);
      
      if (session?.user) {
        console.log("User found in session:", session.user.email);
        
        // Get complete user data from database including participant profile
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            participant: true,
            userType: true
          }
        });
        
        if (user) {
          currentUser = user;
          console.log("Using authenticated user profile:", user.email);
        }
      }
    } catch (sessionError) {
      console.error("Error checking user session:", sessionError);
    }
    
    // PRIORITAS 2: Cek token authentication lainnya
    if (!currentUser) {
      try {
        console.log("Checking session token...");
        const cookieStore = cookies();
        const sessionToken = cookieStore.get("next-auth.session-token")?.value;
        
        if (sessionToken) {
          const decoded = await decode({
            token: sessionToken,
            secret: process.env.NEXTAUTH_SECRET || ""
          });
          
          if (decoded && decoded.email) {
            console.log("User found in session token:", decoded.email);
            
            const user = await prisma.user.findUnique({
              where: { email: decoded.email as string },
              include: {
                participant: true,
                userType: true
              }
            });
            
            if (user) {
              currentUser = user;
              console.log("Using user from session token:", user.email);
            }
          }
        }
      } catch (tokenError) {
        console.error("Error checking session token:", tokenError);
      }
    }
    
    // PRIORITAS 3: Cek berdasarkan email yang diberikan
    if (!currentUser && email) {
      try {
        console.log("Looking up user by provided email:", email);
        
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            participant: true,
            userType: true
          }
        });
        
        if (user) {
          currentUser = user;
          console.log("Found user by provided email:", email);
        }
      } catch (emailLookupError) {
        console.error("Error looking up user by email:", emailLookupError);
      }
    }
    
    // Get course class data
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: { course: true }
    });
    
    if (!classData) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }
    
    // Check class capacity
    const registeredCount = await prisma.courseRegistration.count({
      where: { classId }
    });
    
    if (registeredCount >= classData.quota) {
      return NextResponse.json(
        { error: "Kelas sudah penuh" },
        { status: 400 }
      );
    }
    
    // Variables for registration
    let userId = currentUser?.id;
    let participantId = currentUser?.participant?.[0]?.id;
    let userName = currentUser?.username || (email ? email.split('@')[0] : `Peserta-${Date.now()}`);
    let userFullName = currentUser?.participant?.[0]?.full_name || userName;
    
    console.log("Registration data:", {
      userId: userId || "Will be created",
      participantId: participantId || "Will be created", 
      userName,
      userFullName
    });
    
    // Create participant if needed for existing user
    if (currentUser && !participantId) {
      console.log("Creating participant profile for existing user:", currentUser.email);
      
      try {
        const newParticipant = await prisma.participant.create({
          data: {
            id: `part_${Date.now()}_${Math.round(Math.random() * 10000)}`,
            full_name: userFullName,
            gender: "Belum Diisi",
            address: "Belum Diisi",
            phone_number: "Belum Diisi",
            birth_date: new Date(),
            userId: currentUser.id
          }
        });
        
        participantId = newParticipant.id;
        console.log("Created new participant with ID:", participantId);
      } catch (createError) {
        console.error("Error creating participant profile:", createError);
        return NextResponse.json(
          { error: "Gagal membuat profil peserta" },
          { status: 500 }
        );
      }
    }
    
    // Create user and participant if no existing user
    if (!currentUser) {
      console.log("No existing user found, creating new user");
      
      try {
        // Find participant userType
        const participantUserType = await prisma.userType.findFirst({
          where: { usertype: 'participant' }
        });
        
        if (!participantUserType) {
          return NextResponse.json(
            { error: "Tipe pengguna 'participant' tidak ditemukan" },
            { status: 500 }
          );
        }
        
        // Create new user
        const newUserId = `user_${Date.now()}_${Math.round(Math.random() * 10000)}`;
        const userEmail = email || `temp-${Date.now()}@example.com`;
        
        const newUser = await prisma.user.create({
          data: {
            id: newUserId,
            email: userEmail,
            username: userName,
            password: 'temporary-' + Date.now(),
            userTypeId: participantUserType.id
          }
        });
        
        userId = newUser.id;
        
        // Create new participant
        const newParticipantId = `part_${Date.now()}_${Math.round(Math.random() * 10000)}`;
        const newParticipant = await prisma.participant.create({
          data: {
            id: newParticipantId,
            full_name: userName,
            gender: "Belum Diisi",
            address: "Belum Diisi",
            phone_number: "Belum Diisi",
            birth_date: new Date(),
            userId: newUser.id
          }
        });
        
        participantId = newParticipant.id;
        console.log("Created new user and participant:", userId, participantId);
      } catch (createError) {
        console.error("Error creating user/participant:", createError);
        return NextResponse.json(
          { error: "Gagal membuat akun peserta" },
          { status: 500 }
        );
      }
    }
    
    // Check if user already registered for this class
    if (participantId) {
      const existingRegistration = await prisma.courseRegistration.findFirst({
        where: {
          classId,
          participantId
        }
      });
      
      if (existingRegistration) {
        return NextResponse.json(
          { error: "Anda sudah terdaftar di kelas ini. Silakan periksa halaman 'My Courses' untuk melihat status pembayaran dan mengunggah bukti pembayaran jika belum." },
          { status: 400 }
        );
      }
    }
    
    // Create course registration
    const registrationId = `reg_${Date.now()}_${Math.round(Math.random() * 10000)}`;
    
    // Pastikan participantId tidak undefined
    if (!participantId) {
      return NextResponse.json(
        { error: "Profil peserta tidak ditemukan atau tidak dapat dibuat" },
        { status: 500 }
      );
    }
    
    await prisma.courseRegistration.create({
      data: {
        id: registrationId,
        reg_date: new Date(),
        reg_status: "Pending",
        payment: classData.price,
        payment_status: "Unpaid",
        payment_method: paymentMethod || "Transfer Bank",
        present_day: 0,
        classId,
        participantId
      }
    });
    
    // Create payment record
    const paymentId = `payment_${Date.now()}_${Math.round(Math.random() * 10000)}`;
    const referenceNumber = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    await prisma.payment.create({
      data: {
        id: paymentId,
        paymentDate: new Date(),
        amount: classData.price,
        paymentMethod: paymentMethod || "Transfer Bank",
        referenceNumber,
        status: "Unpaid",
        registrationId,
      }
    });
    
    // Get bank accounts from database or default
    const bankAccounts = await getBankAccounts();
    
    return NextResponse.json({
      success: true,
      message: "Course registration successful",
      data: {
        registrationId,
        course: classData.course.course_name,
        className: `${classData.location} - ${new Date(classData.start_date).toLocaleDateString()}`,
        payment: classData.price,
        paymentStatus: "Unpaid",
        referenceNumber,
        courseScheduleId: classId,
        userInfo: currentUser ? {
          email: currentUser.email,
          username: currentUser.username,
          fullName: currentUser.participant?.[0]?.full_name || userName
        } : null,
        bankAccounts
      }
    });
  } catch (error) {
    console.error("Error in course registration:", error);
    return NextResponse.json(
      { error: "Gagal mendaftar kursus. Silakan coba lagi." },
      { status: 500 }
    );
  }
}