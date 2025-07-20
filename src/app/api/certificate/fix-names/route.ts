import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log('Starting to fix certificate names via API...');

    // Get all certificates
    const certificates = await prisma.certificate.findMany({
      include: {
        participant: {
          include: {
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        },
        instructure: {
          include: {
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${certificates.length} certificates`);

    const updatedCertificates = [];

    for (const cert of certificates) {
      console.log(`Processing certificate: ${cert.certificateNumber}`);
      
      let newName = cert.name;
      let updated = false;
      
      // If certificate name contains "Certificate" or looks like an ID, try to get real name
      if (cert.name.includes("Certificate") || cert.name.match(/^\d+$/)) {
        if (cert.participant) {
          newName = cert.participant.full_name || cert.participant.user?.username || "Unknown Participant";
          console.log(`Using participant name: ${newName}`);
          updated = true;
        } else if (cert.instructure) {
          const instructureUser = cert.instructure.user && cert.instructure.user.length > 0 ? cert.instructure.user[0] : null;
          newName = cert.instructure.full_name || instructureUser?.username || "Unknown Instructor";
          console.log(`Using instructor name: ${newName}`);
          updated = true;
        } else {
          // Try to find participant by name similarity
          const participant = await prisma.participant.findFirst({
            where: {
              OR: [
                { full_name: { contains: cert.name.split(' ')[0] } },
                { user: { username: { contains: cert.name.split(' ')[0] } } }
              ]
            },
            include: {
              user: {
                select: {
                  username: true
                }
              }
            }
          });
          
          if (participant) {
            newName = participant.full_name || participant.user?.username || "Unknown Participant";
            console.log(`Found participant by name similarity: ${newName}`);
            
            // Update certificate with participantId and name
            await prisma.certificate.update({
              where: { id: cert.id },
              data: { 
                participantId: participant.id,
                name: newName
              }
            });
            updated = true;
          } else {
            console.log(`Could not find participant for certificate: ${cert.certificateNumber}`);
          }
        }
      }
      
      // Update certificate name if it changed
      if (newName !== cert.name && updated) {
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { name: newName }
        });
        console.log(`Updated certificate ${cert.certificateNumber} name from "${cert.name}" to "${newName}"`);
        
        updatedCertificates.push({
          id: cert.id,
          certificateNumber: cert.certificateNumber,
          oldName: cert.name,
          newName: newName
        });
      }
    }

    console.log(`Updated ${updatedCertificates.length} certificates`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCertificates.length} certificates`,
      updatedCertificates
    });

  } catch (error) {
    console.error('Error fixing certificates:', error);
    return NextResponse.json(
      { error: "Failed to fix certificates", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 