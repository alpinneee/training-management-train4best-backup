import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/courses - Get all courses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Search in course name
    const where = search ? {
      course_name: { contains: search }
    } : {}

    // Get total count
    const total = await prisma.course.count({ where })

    // Get courses with pagination
    const courses = await prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        course_name: 'asc',
      },
      include: {
        courseType: {
          select: {
            id: true,
            course_type: true
          }
        }
      }
    })
    
    // Format response
    const formattedCourses = courses.map((course) => ({
      id: course.id,
      course_name: course.course_name,
      description: course.description,
      image: course.image,
      courseTypeId: course.courseTypeId,
      courseType: course.courseType.course_type
    }))

    return NextResponse.json({
      data: formattedCourses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create a new course
export async function POST(request: Request) {
  try {
    const { course_name, courseTypeId, description } = await request.json()

    // Validate required fields
    if (!course_name || !courseTypeId) {
      return NextResponse.json(
        { error: 'Course name and course type are required' },
        { status: 400 }
      )
    }

    // Check if course type exists
    const courseTypeExists = await prisma.courseType.findUnique({
      where: { id: courseTypeId }
    })

    if (!courseTypeExists) {
      return NextResponse.json(
        { error: 'Course type not found' },
        { status: 404 }
      )
    }

    // Create new course
    const newCourse = await prisma.course.create({
      data: {
        id: `course_${Date.now()}`,
        course_name,
        courseTypeId,
        description: description || null
      },
      include: {
        courseType: {
          select: {
            course_type: true
          }
        }
      }
    })

    return NextResponse.json({
      id: newCourse.id,
      course_name: newCourse.course_name,
      description: newCourse.description,
      courseTypeId: newCourse.courseTypeId,
      courseType: newCourse.courseType.course_type
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create course: ${error.message}` },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
} 