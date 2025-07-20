import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";
// GET /api/courses - Mendapatkan semua courses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const format = searchParams.get('format') || 'detailed'; // 'detailed' or 'simple'

    // Filter berdasarkan nama course
    const where: any = {};
    if (search) {
      where.course_name = { contains: search };
    }

    // Mendapatkan total jumlah data
    const total = await prisma.course.count({ where });

    // Mendapatkan data courses
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
            course_type: true
          }
        }
      }
    });

    // Format respons berdasarkan parameter format
    if (format === 'simple') {
      // Format sederhana untuk dropdown
      const simpleCourses = courses.map((course) => ({
        id: course.id,
        course_name: course.course_name,
        course_type: course.courseType?.course_type || 'Unknown',
      }));

      return NextResponse.json({
        courses: simpleCourses,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Format detail untuk tabel
    const formattedCourses = courses.map((course, index) => ({
      no: skip + index + 1,
      id: course.id,
      courseName: course.course_name,
      courseType: course.courseType?.course_type || 'Unknown',
      description: course.description || '',
      image: course.image || null,
    }));

    return NextResponse.json({
      data: formattedCourses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Membuat course baru
export async function POST(request: Request) {
  try {
    const { courseName, courseTypeId, description, image } = await request.json();

    if (!courseName || !courseTypeId) {
      return NextResponse.json(
        { error: 'Course name and course type are required' },
        { status: 400 }
      );
    }

    // Membuat course baru
    const newCourse = await prisma.course.create({
      data: {
        id: Date.now().toString(), // Generate ID sederhana
        course_name: courseName,
        courseTypeId: courseTypeId,
        description: description || '',
        image: image || null,
      },
      include: {
        courseType: {
          select: {
            course_type: true
          }
        }
      }
    });

    return NextResponse.json({
      id: newCourse.id,
      courseName: newCourse.course_name,
      courseType: newCourse.courseType?.course_type,
      description: newCourse.description,
      image: newCourse.image,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create course: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
} 