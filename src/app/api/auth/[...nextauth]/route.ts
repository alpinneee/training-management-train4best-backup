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
            userType: user.userType.usertype // <-- pastikan ini benar
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
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.userType = user.userType; // <-- pastikan ini ada
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) session.user = { id: "", email: "", name: "", userType: "" };
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.userType = token.userType as string; // <-- pastikan ini ada
      }
      return session;
    },
  },
  debug: true, // Enable debug logs
  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }