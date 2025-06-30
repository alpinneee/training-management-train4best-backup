import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const courseId = formData.get('courseId') as string | null;

    // Validate inputs
    if (!file || !courseId) {
      return NextResponse.json(
        { error: 'File and courseId are required' },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP)' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(cwd(), 'public', 'uploads', 'courses');
    
    // Make sure the directory exists
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (dirError) {
        return NextResponse.json(
          { error: 'Failed to create upload directory' },
          { status: 500 }
        );
      }
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `course_${courseId}_${timestamp}.${fileExt}`;
    const filepath = join(uploadDir, filename);
    
    try {
      // Convert the file to a buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Write the file to disk
      await writeFile(filepath, buffer);
      
      // Save the URL in the database
      const fileUrl = `/uploads/courses/${filename}`;
      await prisma.course.update({
        where: { id: courseId },
        data: { image: fileUrl }
      });
      
      return NextResponse.json({
        message: 'Image uploaded successfully',
        imageUrl: fileUrl
      }, { status: 201 });
    } catch (fileError) {
      return NextResponse.json(
        { error: 'Failed to write file to disk' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading course image:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 