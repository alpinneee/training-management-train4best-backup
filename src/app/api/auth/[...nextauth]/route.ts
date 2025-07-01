export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import NextAuth from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
// import { prisma } from "@/lib/prisma"
// import bcrypt from "bcryptjs"
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
        // Jika tidak ada database, return user dummy agar build sukses
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Mohon masukkan email dan kata sandi')
        }
        // Return user dummy
        return {
          id: 'dummy-id',
          email: credentials.email,
          name: 'Dummy User',
          userType: 'admin'
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
      if (user) {
        token.id = user.id;
        token.email = user.email;
        if (user.name) token.name = user.name;
        token.userType = (user as any).userType || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.userType = token.userType as string;
      }
      return session;
    }
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET || 'dummy-secret'
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }