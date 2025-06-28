import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from 'crypto';
import api from './api';

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
    return "ee242735312254106fe3e96a49c7439e224a303ff71c148eee211ee52b6df1719d261fbf28697c6375bfa1ff473b328d31659d6308da93ea03ae630421a8024e";
  }
  
  // For production without a set secret, generate a secure one
  // Note: This will cause all existing sessions to be invalidated on server restart
  console.warn("ee242735312254106fe3e96a49c7439e224a303ff71c148eee211ee52b6df1719d261fbf28697c6375bfa1ff473b328d31659d6308da93ea03ae630421a8024e");
  return generateSecureSecret();
}

export const authOptions: NextAuthOptions = {
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

        try {
          // Gunakan API Laravel untuk autentikasi
          const response = await api.post('auth/login', {
            email: credentials.email,
            password: credentials.password
          });

          if (!response || !response.user) {
            return null;
          }

          // Return user data dari respons API
          return {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            userType: response.user.user_type || "User",
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
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
}; 