import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
export const dynamic = "force-dynamic";

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
    const certificateId = formData.get('certificateId') as string | null;

    // Validate inputs
    if (!file || !certificateId) {
      return NextResponse.json(
        { error: 'File and certificateId are required' },
        { status: 400 }
      );
    }

    // Check if certificate exists
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(cwd(), 'public', 'uploads', 'certificates');
    console.log('Upload directory path:', uploadDir);
    
    // Make sure the directory exists
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory:', uploadDir);
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Directory created successfully');
      } catch (dirError) {
        console.error('Error creating directory:', dirError);
        return NextResponse.json(
          { error: 'Failed to create upload directory' },
          { status: 500 }
        );
      }
    }

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `certificate_${certificateId}_${timestamp}.pdf`;
    const filepath = join(uploadDir, filename);
    console.log('Saving file to:', filepath);
    
    try {
      // Convert the file to a buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Write the file to disk
      await writeFile(filepath, buffer);
      console.log('File written successfully');
      
      // Save the URL in the database
      const fileUrl = `/uploads/certificates/${filename}`;
      await prisma.certificate.update({
        where: { id: certificateId },
        data: { pdfUrl: fileUrl }
      });
      
      return NextResponse.json({
        message: 'File uploaded successfully',
        fileUrl: fileUrl
      }, { status: 201 });
    } catch (fileError) {
      console.error('File writing error:', fileError);
      return NextResponse.json(
        { error: 'Failed to write file to disk' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading certificate PDF:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 