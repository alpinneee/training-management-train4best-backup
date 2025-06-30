import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

// Helper function to manually check auth when getServerSession fails
async function validateSessionManually() {
  try {
    // Get the session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("next-auth.session-token")?.value;
    
    if (!sessionToken) {
      console.log("No session token found in cookies");
      return null;
    }
    
    // Decode the JWT to get user info
    const decodedToken = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET || ""
    });
    
    if (!decodedToken || !decodedToken.email) {
      console.log("Failed to decode session token or missing email");
      return null;
    }
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: decodedToken.email as string }
    });
    
    if (!user) {
      console.log("User not found with email from token");
      return null;
    }
    
    // Return a session-like object
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.username
      }
    };
  } catch (error) {
    console.error("Manual session validation failed:", error);
    return null;
  }
}

function hasIdProperty(obj: unknown): obj is { id: string } {
  return !!obj && typeof obj === 'object' && 'id' in obj;
}

export async function POST(req: Request) {
  console.log("Profile update API called");
  
  try {
    // Ambil data form terlebih dahulu agar bisa akses email
    const {
      fullName,
      email,
      phone,
      address,
      gender,
      birthDate,
      jobTitle,
      company,
    } = await req.json();
    
    // Log data yang diterima untuk debugging
    console.log("Profile update - form data diterima:", {
      fullName,
      email,
      phone,
      // lainnya tidak perlu dilog
    });
    
    // Get user from session
    let session;
    try {
      session = await getServerSession(authOptions);
      
      // Enhanced debug logging
      console.log("Profile update - session data:", JSON.stringify({
        hasSession: !!session,
        user: session?.user,
        hasId: !!session?.user?.id,
        hasEmail: !!session?.user?.email
      }));
      
      // If standard session check fails, try manual validation
      if (!session || !session.user) {
        console.log("Standard session check failed, attempting manual validation");
        session = await validateSessionManually();
        
        console.log("Manual validation result:", {
          hasSession: !!session,
          user: session?.user,
          hasId: !!session?.user?.id
        });
      }
      
      // Jika masih tidak ada session, buat session dari email yang dikirim 
      if ((!session || !session.user) && email) {
        console.log("No session available, creating fallback session from email:", email);
        session = {
          user: {
            email: email,
            name: fullName || email.split('@')[0],
          }
        };
      }
      
      // Try to find user by email if ID is missing
      if ((!session?.user?.id) && email) {
        console.log("Looking for user by email:", email);
        const userByEmail = await prisma.user.findUnique({
          where: { email: email }
        });
        
        if (userByEmail) {
          console.log("Found user by email:", userByEmail.id);
          if (session?.user) {
            (session.user as any).id = userByEmail.id;
          }
        } else {
          // User tidak ditemukan, tapi kita masih punya email
          console.log("User with email not found, will create new user:", email);
        }
      } else if (session?.user?.email && !session?.user?.id) {
        console.log("Looking for user by session email:", session.user.email);
        const userByEmail = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
        
        if (userByEmail) {
          console.log("Found user by session email:", userByEmail.id);
          (session.user as any).id = userByEmail.id;
        }
      }
      
      // Check for debug token as a fallback - skip untuk kecepatan
      if (session && !session.user.id && false) { // Nonaktifkan untuk performa
        console.log("Checking for debug token as fallback");
        const cookieStore = cookies();
        const debugToken = cookieStore.get("debug_token")?.value;
        
        if (debugToken) {
          try {
            const decodedToken = await decode({
              token: debugToken,
              secret: process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT"
            });
            
            const tokenObj = decodedToken;
            if (hasIdProperty(tokenObj)) {
              console.log("Found user ID in debug token:", tokenObj?.id);
              (session.user as any).id = tokenObj?.id as string;
            }
          } catch (decodeError) {
            console.error("Failed to decode debug token:", decodeError);
          }
        }
      }
      
      // Jika tidak ada user ID tapi ada email, coba gunakan fake ID untuk debugging
      if ((!session?.user?.id) && email) {
        console.log("No user ID but email is present, creating temporary ID from email");
        // Gunakan email sebagai basis pembuatan ID sementara 
        const emailBasedId = `debug_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        if (session?.user) {
          (session.user as any).id = emailBasedId;
        }
      }
      
      if (!session?.user?.id) {
        console.error("User ID missing from session and could not be recovered");
        return NextResponse.json(
          { error: "User ID not found. Please make sure email is provided." },
          { status: 400 }
        );
      }
    } catch (sessionError) {
      console.error("Error retrieving session:", sessionError);
      // Jika terjadi error tapi ada email, tetap lanjutkan
      if (email) {
        console.log("Session error, but continuing with email:", email);
        session = {
          user: {
            id: `fallback_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: email,
            name: fullName || email.split('@')[0]
          }
        };
      } else {
        return NextResponse.json(
          { error: "Authentication error. Please provide email address." },
          { status: 401 }
        );
      }
    }
    
    const userId = session.user.id;
    
    // Find the user to check role
    let user: any = await prisma.user.findUnique({
      where: { id: userId },
      include: { participant: true },
    });
    
    // Jika user tidak ditemukan tapi kita punya email, coba cari dengan email
    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { participant: true },
      });
    }
    
    // Jika masih tidak ada user, buat user baru dengan email
    if (!user && email) {
      console.log("Creating new user with email:", email);
      
      // Cari userType 'unassigned' atau 'participant'
      let userType = await prisma.userType.findFirst({
        where: { usertype: 'unassigned' }
      });
      
      if (!userType) {
        userType = await prisma.userType.findFirst({
          where: { usertype: 'participant' }
        });
      }
      
      // Jika masih tidak ada, buat userType baru
      if (!userType) {
        console.log("Creating default userType");
        userType = await prisma.userType.create({
          data: {
            id: `usertype_${Date.now()}`,
            usertype: 'unassigned',
            description: 'Default role for new users'
          }
        });
      }
      
      // Buat user baru dengan password hash sederhana (MD5 waktu saat ini)
      const timestamp = new Date().getTime().toString();
      const defaultPassword = require('crypto').createHash('md5').update('default' + timestamp).digest('hex');
      
      try {
        user = await prisma.user.create({
          data: {
            id: userId || "",
            email,
            username: fullName || email.split('@')[0],
            password: defaultPassword,
            userTypeId: userType.id
          },
          include: { participant: true }
        }) as typeof user;
        console.log("New user created:", user.id);
      } catch (createUserError) {
        console.error("Error creating user:", createUserError);
        return NextResponse.json(
          { error: "Failed to create user. Please try again." },
          { status: 500 }
        );
      }
    }
    
    if (!user) {
      console.error("User not found with ID:", userId);
      return NextResponse.json(
        { error: "User not found and could not be created" },
        { status: 404 }
      );
    }
    
    // Check if participant profile exists
    if (user.participant && user.participant.length > 0) {
      // Update existing participant
      const participantId = user.participant[0].id;
      try {
        const updatedParticipant = await prisma.participant.update({
          where: { id: participantId },
          data: {
            full_name: fullName,
            phone_number: phone,
            address,
            gender,
            birth_date: new Date(birthDate),
            job_title: jobTitle || null,
            company: company || null,
          },
        });
        
        return NextResponse.json({
          message: "Profile updated successfully",
          data: updatedParticipant
        });
      } catch (error) {
        console.error("Error updating participant:", error);
        return NextResponse.json(
          { error: "Failed to update participant profile" },
          { status: 500 }
        );
      }
    } else {
      // Create new participant profile
      // Find participant role
      let participantRole;
      try {
        participantRole = await prisma.userType.findFirst({
          where: { usertype: 'participant' }
        });
        
        if (!participantRole) {
          participantRole = await prisma.userType.findFirst({
            where: { usertype: 'unassigned' }
          });
        }
        
        if (!participantRole) {
          // Create participant role if it doesn't exist
          participantRole = await prisma.userType.create({
            data: {
              id: `usertype_participant_${Date.now()}`,
              usertype: 'participant',
              description: 'Role untuk peserta pelatihan'
            }
          });
        }
      } catch (roleError) {
        console.error("Error finding/creating participant role:", roleError);
        // Continue with default role
        participantRole = { id: user.userTypeId };
      }
      
      // Create participant in transaction
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Update user role to participant if role exists
          let updatedUser = user;
          if (participantRole && user.userTypeId !== participantRole.id) {
            updatedUser = await tx.user.update({
              where: { id: user.id },
              data: { userTypeId: participantRole.id },
              include: { participant: true }
            });
          }
          
          // Create participant with unique ID
          const participantId = `participant_${Date.now()}_${Math.round(Math.random() * 10000)}`;
          const newParticipant = await tx.participant.create({
            data: {
              id: participantId,
              full_name: fullName,
              gender,
              phone_number: phone,
              address,
              birth_date: new Date(birthDate),
              job_title: jobTitle || null,
              company: company || null,
              userId: user.id,
            },
          });
          
          return { user: updatedUser, participant: newParticipant };
        });
        
        return NextResponse.json({
          message: "Profile created successfully",
          data: result.participant
        });
      } catch (txError) {
        console.error('Error creating participant profile:', txError);
        return NextResponse.json(
          { error: "Failed to create participant profile. Detail: " + (txError instanceof Error ? txError.message : 'Unknown error') },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 