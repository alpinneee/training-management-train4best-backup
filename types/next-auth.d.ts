import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      username?: string | null
      userType?: string
      image?: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    username?: string | null
    userType: string
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username?: string
    userType: string
  }
} 