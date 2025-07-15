import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import crypto from 'crypto';

// Define our custom types
interface CustomUser {
  id: string;
  email: string;
  name: string;
  userType: string;
}

// Type declarations
declare module "next-auth" {
  interface User {
    id: string;
    userType: string;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: string;
  }
}

/**
 * Generate a secure random string for use as NextAuth secret
 * @returns A secure random string
 */
export function generateSecureSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get the NextAuth secret from environment or generate a secure one
 * @returns The NextAuth secret
 */
export function getNextAuthSecret(): string {
  const envSecret = process.env.NEXTAUTH_SECRET;
  if (envSecret && envSecret.length > 32) {
    return envSecret;
  }
  
  // For development, generate a consistent secret based on a fallback
  if (process.env.NODE_ENV !== 'production') {
    // Use a hardcoded secret for development only
    console.warn("Using hardcoded secret for development. DO NOT USE IN PRODUCTION.");
    return "ee242735312254106fe3e96a49c7439e224a303ff71c148eee211ee52b6df1719d261fbf28697c6375bfa1ff473b328d31659d6308da93ea03ae630421a8024e";
  }
  
  // For production without a set secret, generate a secure one
  console.warn("NEXTAUTH_SECRET not set in environment. Generating a new one.");
  return generateSecureSecret();
}

// Make sure the secret is accessible to the client
if (typeof window !== 'undefined') {
  // Only in browser
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = getNextAuthSecret();
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: getNextAuthSecret(),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            userType: true,
          },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          userType: user.userType?.usertype || "User",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.userType = user.userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.userType = token.userType as string;
      }
      return session;
    },
  },
  // Debug mode - enable for development
  debug: process.env.NODE_ENV !== 'production',
  // Make sure cookies work properly for your environment
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.callback-url' 
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.csrf-token' 
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
      }
    }
  }
}; 