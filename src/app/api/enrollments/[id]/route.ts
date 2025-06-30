import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"

// PATCH /api/enrollments/[id] - Update status pendaftaran
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { userType: true }
    })

    if (!user || user.userType?.usertype !== "instructure") {
      return NextResponse.json(
        { error: "Only instructors can update enrollment status" },
        { status: 403 }
      )
    }

    const enrollment = await prisma.courseRegistration.findUnique({
      where: { id: params.id },
      include: {
        class: {
          include: {
            course: true
          }
        }
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      )
    }

    // Cek apakah instruktur adalah pengajar kursus ini
    // Catatan: Perlu menyesuaikan dengan struktur data yang benar
    // Karena tidak ada field instructorId langsung di model Course
    const body = await request.json()
    const { status } = body

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const updatedEnrollment = await prisma.courseRegistration.update({
      where: { id: params.id },
      data: { reg_status: status },
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
      },
    })

    return NextResponse.json(updatedEnrollment)
  } catch (error) {
    console.error("Error updating enrollment:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 