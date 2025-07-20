import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCertificateEmail } from '@/lib/email';
export const dynamic = "force-dynamic";

// Function to generate unique certificate number
async function generateUniqueCertificateNumber(): Promise<string> {
  const randomNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const existingCert = await prisma.certificate.findUnique({ where: { certificateNumber: randomNum } });
  if (existingCert) return generateUniqueCertificateNumber();
  return randomNum;
}

export async function POST(request: NextRequest) {
  console.log('POST /api/instructure/certificate/send - start');
  try {
    const body = await request.json();
    const { instructureId, courseId, certificateName, issueDate, expiryDate, driveLink, pdfUrl } = body;
    console.log('[SEND] Data diterima:', { instructureId, courseId, certificateName, issueDate, expiryDate, driveLink, pdfUrl });

    // Validate required fields
    if (!instructureId || !courseId || !certificateName || !issueDate || !expiryDate) {
      console.error('[SEND] Data kurang!');
      return NextResponse.json({ error: "instructureId, courseId, certificateName, issueDate, and expiryDate are required" }, { status: 400 });
    }

    // Check if instructor exists
    const instructor = await prisma.instructure.findUnique({ where: { id: instructureId }, include: { user: true } });
    if (!instructor) {
      console.error('[SEND] Instructor not found:', instructureId);
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      console.error('[SEND] Course not found:', courseId);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Generate unique certificate number
    const certificateNumber = await generateUniqueCertificateNumber();
    console.log('[SEND] Certificate number generated:', certificateNumber);

    // Create certificate (sama seperti participant, hanya ganti field relasi)
    let newCertificate;
    try {
      newCertificate = await prisma.certificate.create({
        data: {
          certificateNumber,
          name: certificateName,
          issueDate: new Date(issueDate),
          expiryDate: new Date(expiryDate),
          status: "Valid",
          instructureId: instructureId, // relasi ke instruktur
          courseId: courseId,
          driveLink: driveLink || null,
          pdfUrl: pdfUrl || null
        },
        include: { instructure: true, course: true }
      });
      console.log('[SEND] Certificate created:', newCertificate.id, 'for instructureId:', instructureId);
    } catch (err) {
      console.error('[SEND] Error saat create certificate:', err);
      return NextResponse.json({ error: "Failed to create certificate", details: err instanceof Error ? err.message : err }, { status: 500 });
    }

    // Ambil email user dari relasi user[0] (sama seperti participant)
    const userEmail = instructor.user && instructor.user.length > 0 ? instructor.user[0].email : null;
    if (userEmail) {
      try {
        const certificateLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/instructure/my-certificate`;
        const emailResult = await sendCertificateEmail(
          userEmail,
          instructor.full_name,
          certificateName,
          course.course_name,
          certificateNumber,
          new Date(issueDate).toLocaleDateString('id-ID'),
          new Date(expiryDate).toLocaleDateString('id-ID'),
          certificateLink,
          driveLink || pdfUrl
        );
        if (emailResult?.success) {
          console.log('[SEND] Certificate email sent successfully to:', userEmail);
        } else {
          console.error('[SEND] Failed to send certificate email:', emailResult?.error);
        }
      } catch (emailError) {
        console.error('[SEND] Error sending certificate email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Certificate sent successfully to instructor",
      certificate: {
        id: newCertificate.id,
        certificateNumber: newCertificate.certificateNumber,
        name: newCertificate.name,
        courseName: course.course_name,
        issueDate: newCertificate.issueDate,
        expiryDate: newCertificate.expiryDate,
        status: newCertificate.status,
        driveLink: newCertificate.driveLink,
        pdfUrl: newCertificate.pdfUrl,
        instructureId: newCertificate.instructureId,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[SEND] Error sending certificate to instructor:', error);
    return NextResponse.json({ error: "Failed to send certificate to instructor", details: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 