import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

interface HistoryDetail {
  [key: string]: any; // Allow any properties in the details object
}

interface HistoryItem {
  id: string;
  type: string;
  description: string;
  date: Date;
  changedBy: string;
  details?: HistoryDetail; // Make details optional
}

// GET /api/participant/[id]/history - Get participant history
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Get user creation date from the user table
    const creationDate = participant.user.last_login || new Date(); // Use last_login as fallback

    // For a real application, you would have a dedicated history/audit table
    // For now, we'll create a simulated history based on available data
    const history: HistoryItem[] = [
      {
        id: '1',
        type: 'Pendaftaran',
        description: 'Peserta baru ditambahkan',
        date: creationDate,
        changedBy: 'Admin'
      }
    ];

    // Add course registrations as history items
    const courseRegistrations = await prisma.courseRegistration.findMany({
      where: {
        participantId: id
      },
      include: {
        class: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        reg_date: 'desc'
      }
    });

    // Add course registrations to history
    courseRegistrations.forEach(registration => {
      history.push({
        id: `reg-${registration.id}`,
        type: 'Pendaftaran Kursus',
        description: `Mendaftar kursus: ${registration.class.course.course_name}`,
        date: registration.reg_date,
        changedBy: 'System',
        details: {
          courseId: registration.class.courseId,
          courseName: registration.class.course.course_name,
          status: registration.reg_status
        }
      });
    });

    // Get certificates for this participant
    const certificates = await prisma.certificate.findMany({
      where: {
        participantId: id
      },
      orderBy: {
        issueDate: 'desc'
      }
    });

    // Add certificates to history
    certificates.forEach(cert => {
      history.push({
        id: `cert-${cert.id}`,
        type: 'Sertifikat',
        description: `Sertifikat diterbitkan: ${cert.certificateNumber}`,
        date: cert.issueDate,
        changedBy: 'System',
        details: {
          certificateNumber: cert.certificateNumber,
          status: cert.status
        }
      });
    });

    // Sort history by date (newest first)
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching participant history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant history' },
      { status: 500 }
    );
  }
} 