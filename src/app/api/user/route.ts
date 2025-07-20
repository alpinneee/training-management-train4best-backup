import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { authOptions } from "@/lib/auth"
export const dynamic = "force-dynamic";

// GET /api/user - Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        userType: {
          select: {
            usertype: true,
          },
        },
        last_login: true,
      },
      orderBy: {
        username: 'asc',
      },
    })

    // Format response for frontend
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.userType.usertype,
      createdAt: user.last_login ? new Date(user.last_login).toISOString() : null,
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/user - Create a new user
export async function POST(request: Request) {
  try {
    const { username, password, jobTitle } = await request.json()

    if (!username || !password || !jobTitle) {
      return NextResponse.json(
        { error: 'Username, password, and role are required' },
        { status: 400 }
      )
    }

    // Find the userType by name
    const userType = await prisma.userType.findFirst({
      where: {
        usertype: jobTitle,
      },
    })

    if (!userType) {
      return NextResponse.json(
        { error: `Role "${jobTitle}" not found` },
        { status: 404 }
      )
    }

    // Create email from username
    const email = `${username.toLowerCase().replace(/\s+/g, '.')}@example.com`

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: `user_${Date.now()}`,
        username,
        email,
        password: hashedPassword, // Use the hashed password
        userTypeId: userType.id,
        last_login: new Date(),
      },
      include: {
        userType: true,
      },
    })

    return NextResponse.json({
      id: newUser.id,
      name: newUser.username,
      email: newUser.email,
      role: newUser.userType.usertype,
      createdAt: newUser.last_login ? new Date(newUser.last_login).toISOString() : null,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 