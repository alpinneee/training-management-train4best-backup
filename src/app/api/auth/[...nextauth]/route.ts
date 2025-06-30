import NextAuth from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { JWT } from "next-auth/jwt"
import { AuthOptions } from "next-auth"
import { AdapterUser } from "next-auth/adapters"

// Define user type
interface CustomUser {
  id: string;
  email: string;
  name?: string;
  userType?: string;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Kata Sandi", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Mohon masukkan email dan kata sandi')
          }

          // Find user with userType
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { userType: true }
          })

          if (!user) {
            throw new Error('Pengguna tidak ditemukan')
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            throw new Error('Kata sandi salah')
          }

          // Log the user data to debug
          console.log("User login success:", {
            id: user.id,
            email: user.email,
            userType: user.userType.usertype
          })

          // Return simplified user object
          return {
            id: user.id,
            email: user.email,
            name: user.username,
            userType: user.userType.usertype
          }
        } catch (error) {
          console.error('Kesalahan otorisasi:', error)
          throw error
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          // Log to debug the user object passed from authorize
          console.log("JWT callback user:", user);
          
          // Store values on the token
          token.id = user.id;
          token.email = user.email;
          if (user.name) token.name = user.name;
          
          // Important: Make sure userType is correctly transferred
          console.log("User's userType from authorize:", (user as any).userType);
          
          // Store userType consistently in lowercase
          const userTypeValue = typeof (user as any).userType === 'string' ? (user as any).userType.toLowerCase() : '';
          token.userType = userTypeValue;
          
          console.log("JWT token after setting userType:", token);
        }
        
        // Log the token to ensure userType is present
        console.log("Final JWT token:", {
          id: token.id,
          email: token.email,
          userType: token.userType,
        });
        
        return token;
      } catch (error) {
        console.error('Error in JWT callback:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          // Log to debug the values being set in session
          console.log("Session callback token:", token);
          
          // Make sure userType from token is properly transferred to session
          session.user.id = token.id as string;
          session.user.name = token.name as string;
          session.user.email = token.email as string;
          
          // Add logs to track userType
          console.log("Token userType before setting:", token.userType);
          session.user.userType = token.userType as string;
          console.log("Session userType after setting:", session.user.userType);
          
          // Store user info in localStorage via client-side script
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('userEmail', session.user.email);
              localStorage.setItem('username', session.user.name);
              console.log("NextAuth: Stored user data in localStorage");
            } catch (e) {
              console.error("NextAuth: Failed to store data in localStorage", e);
            }
          }
          
          // Log the final session object
          console.log("Final session object:", {
            id: session.user.id,
            email: session.user.email,
            userType: session.user.userType
          });
        }
        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    }
  },
  debug: true, // Enable debug logs
  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }