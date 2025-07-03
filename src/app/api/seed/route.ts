import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { mode = "minimal" } = await req.json();
    console.log(`Starting database seeding in ${mode} mode...`);

    // Create user types
    console.log("Creating user types...");
    const userTypes = [
      { id: uuidv4(), usertype: "Admin", description: "Administrator with full access", status: "Active" },
      { id: uuidv4(), usertype: "Instructure", description: "Training instructure", status: "Active" },
      { id: uuidv4(), usertype: "Participant", description: "Training participant/student", status: "Active" },
      { id: uuidv4(), usertype: "Staff", description: "Administrative staff", status: "Active" }
    ];

    for (const userType of userTypes) {
      // Check if user type already exists to avoid duplicates
      const existingUserType = await prisma.userType.findFirst({
        where: { usertype: userType.usertype }
      });

      if (!existingUserType) {
        await prisma.userType.create({
          data: userType
        });
        console.log(`Created user type: ${userType.usertype}`);
      } else {
        console.log(`User type ${userType.usertype} already exists, skipping...`);
      }
    }

    // Get the user type IDs
    const adminUserType = await prisma.userType.findFirst({
      where: { usertype: "Admin" }
    });

    const participantUserType = await prisma.userType.findFirst({
      where: { usertype: "Participant" }
    });

    const instructureUserType = await prisma.userType.findFirst({
      where: { usertype: "Instructure" }
    });

    if (!adminUserType || !participantUserType || !instructureUserType) {
      throw new Error("Required user types not found");
    }

    // Create admin user
    console.log("Creating admin user...");
    const adminId = uuidv4();
    const adminEmail = "admin@train4best.com";
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      // Hash the password
      const hashedPassword = await bcrypt.hash("admin123", 10);

      // Create the admin user
      await prisma.user.create({
        data: {
          id: adminId,
          email: adminEmail,
          username: "admin",
          password: hashedPassword,
          userTypeId: adminUserType.id,
        }
      });
      console.log(`Created admin user with email: ${adminEmail}`);
    } else {
      console.log(`Admin user with email ${adminEmail} already exists, skipping...`);
    }

    // Create demo participant user
    console.log("Creating demo participant user...");
    const demoParticipantId = uuidv4();
    const demoParticipantEmail = "demo@example.com";
    
    let demoUser = await prisma.user.findUnique({
      where: { email: demoParticipantEmail }
    });

    if (!demoUser) {
      // Hash the password
      const hashedPassword = await bcrypt.hash("demo123", 10);

      // Create the demo user
      demoUser = await prisma.user.create({
        data: {
          id: demoParticipantId,
          email: demoParticipantEmail,
          username: "demo",
          password: hashedPassword,
          userTypeId: participantUserType.id,
        }
      });
      console.log(`Created demo participant user with email: ${demoParticipantEmail}`);
    } else {
      console.log(`Demo user with email ${demoParticipantEmail} already exists, skipping...`);
    }

    // Create participant profile for demo user
    let demoParticipant = null;
    const existingParticipant = await prisma.participant.findFirst({
      where: { userId: demoUser.id }
    });

    if (!existingParticipant) {
      demoParticipant = await prisma.participant.create({
        data: {
          id: uuidv4(),
          full_name: "Demo User",
          gender: "Male",
          address: "123 Demo Street",
          phone_number: "123456789",
          birth_date: new Date("1990-01-01"),
          job_title: "Software Developer",
          company: "Demo Company",
          userId: demoUser.id
        }
      });
      console.log("Created participant profile for demo user");
    } else {
      demoParticipant = existingParticipant;
      console.log("Participant profile for demo user already exists, skipping...");
    }

    // Create additional participants for better dashboard statistics
    console.log("Creating additional participants...");
    const additionalParticipants = [
      { email: "john.doe@example.com", name: "John Doe", gender: "Male", company: "Tech Solutions" },
      { email: "jane.smith@example.com", name: "Jane Smith", gender: "Female", company: "Digital Innovations" },
      { email: "alex.wong@example.com", name: "Alex Wong", gender: "Male", company: "Global Systems" },
      { email: "maria.garcia@example.com", name: "Maria Garcia", gender: "Female", company: "Creative Solutions" },
      { email: "robert.johnson@example.com", name: "Robert Johnson", gender: "Male", company: "Tech Experts" }
    ];

    for (const participant of additionalParticipants) {
      const existingUser = await prisma.user.findUnique({
        where: { email: participant.email }
      });

      if (!existingUser) {
        // Create user
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash("password123", 10);
        const username = participant.email.split('@')[0];

        const user = await prisma.user.create({
          data: {
            id: userId,
            email: participant.email,
            username,
            password: hashedPassword,
            userTypeId: participantUserType.id,
          }
        });

        // Create participant profile
        await prisma.participant.create({
          data: {
            id: uuidv4(),
            full_name: participant.name,
            gender: participant.gender,
            address: "456 Sample Street",
            phone_number: "987654321",
            birth_date: new Date(1985 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            job_title: "Professional",
            company: participant.company,
            userId: user.id
          }
        });
        console.log(`Created participant: ${participant.name}`);
      } else {
        console.log(`Participant ${participant.name} already exists, skipping...`);
      }
    }

    // Create course types
    console.log("Creating course types...");
    const courseTypes = [
      { id: uuidv4(), course_type: "Technical" },
      { id: uuidv4(), course_type: "Soft Skills" },
      { id: uuidv4(), course_type: "Leadership" },
      { id: uuidv4(), course_type: "Management" }
    ];

    for (const courseType of courseTypes) {
      const existingCourseType = await prisma.courseType.findFirst({
        where: { course_type: courseType.course_type }
      });

      if (!existingCourseType) {
        await prisma.courseType.create({
          data: courseType
        });
        console.log(`Created course type: ${courseType.course_type}`);
      } else {
        console.log(`Course type ${courseType.course_type} already exists, skipping...`);
      }
    }

    // Create courses
    console.log("Creating courses...");
    
    const technicalCourseType = await prisma.courseType.findFirst({
      where: { course_type: "Technical" }
    });

    const softSkillsCourseType = await prisma.courseType.findFirst({
      where: { course_type: "Soft Skills" }
    });

    const leadershipCourseType = await prisma.courseType.findFirst({
      where: { course_type: "Leadership" }
    });

    const managementCourseType = await prisma.courseType.findFirst({
      where: { course_type: "Management" }
    });

    if (!technicalCourseType || !softSkillsCourseType || !leadershipCourseType || !managementCourseType) {
      throw new Error("Required course types not found");
    }

    const courses = [
      { id: uuidv4(), course_name: "Web Development Fundamentals", courseTypeId: technicalCourseType.id },
      { id: uuidv4(), course_name: "Advanced JavaScript", courseTypeId: technicalCourseType.id },
      { id: uuidv4(), course_name: "Effective Communication", courseTypeId: softSkillsCourseType.id },
      { id: uuidv4(), course_name: "Project Management", courseTypeId: managementCourseType.id },
      { id: uuidv4(), course_name: "Team Leadership", courseTypeId: leadershipCourseType.id },
      { id: uuidv4(), course_name: "Data Science Fundamentals", courseTypeId: technicalCourseType.id },
      { id: uuidv4(), course_name: "Public Speaking", courseTypeId: softSkillsCourseType.id },
      { id: uuidv4(), course_name: "Strategic Management", courseTypeId: managementCourseType.id }
    ];

    const createdCourses = [];
    for (const course of courses) {
      const existingCourse = await prisma.course.findFirst({
        where: { course_name: course.course_name }
      });

      if (!existingCourse) {
        const createdCourse = await prisma.course.create({
          data: course
        });
        createdCourses.push(createdCourse);
        console.log(`Created course: ${course.course_name}`);
      } else {
        createdCourses.push(existingCourse);
        console.log(`Course ${course.course_name} already exists, skipping...`);
      }
    }

    // Create multiple instructors
    console.log("Creating instructors...");
    const instructors = [
      { name: "John Doe", proficiency: "Web Development" },
      { name: "Jane Smith", proficiency: "Data Science" },
      { name: "Michael Johnson", proficiency: "Leadership" },
      { name: "Emily Brown", proficiency: "Communication" }
    ];

    const createdInstructors = [];
    for (const instructor of instructors) {
      let existingInstructor = await prisma.instructure.findFirst({
        where: { full_name: instructor.name }
      });

      if (!existingInstructor) {
        existingInstructor = await prisma.instructure.create({
          data: {
            id: uuidv4(),
            full_name: instructor.name,
            phone_number: "123" + Math.floor(Math.random() * 10000000),
            address: `${Math.floor(Math.random() * 1000)} Instructor Street`,
            profiency: instructor.proficiency
          }
        });
        
        // Create user for instructor
        const instructorEmail = instructor.name.toLowerCase().replace(' ', '.') + "@example.com";
        const existingInstructorUser = await prisma.user.findUnique({
          where: { email: instructorEmail }
        });

        if (!existingInstructorUser) {
          const hashedPassword = await bcrypt.hash("instructor123", 10);
          await prisma.user.create({
            data: {
              id: uuidv4(),
              email: instructorEmail,
              username: instructor.name.toLowerCase().replace(' ', '.'),
              password: hashedPassword,
              userTypeId: instructureUserType.id,
              instructureId: existingInstructor.id
            }
          });
        }
        
        console.log(`Created instructor: ${instructor.name}`);
      } else {
        console.log(`Instructor ${instructor.name} already exists, skipping...`);
      }
      
      createdInstructors.push(existingInstructor);
    }

    // Create class schedules
    console.log("Creating class schedules...");
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    const twoMonthsLater = new Date(today);
    twoMonthsLater.setMonth(today.getMonth() + 2);

    // Create classes for the courses
    const createdClasses = [];
    for (let i = 0; i < createdCourses.length; i++) {
      const course = createdCourses[i];
      
      // Different dates for different courses
      const startRegDate = new Date(today);
      startRegDate.setDate(today.getDate() - 30 + i * 5);
      
      const endRegDate = new Date(nextMonth);
      endRegDate.setDate(nextMonth.getDate() + i * 5);
      
      const startDate = new Date(nextMonth);
      startDate.setDate(nextMonth.getDate() + 15 + i * 5);
      
      const endDate = new Date(twoMonthsLater);
      endDate.setDate(twoMonthsLater.getDate() + i * 5);

      const existingClass = await prisma.class.findFirst({
        where: {
          courseId: course.id,
          location: `Batch ${i + 1}`
        }
      });

      if (!existingClass) {
        const classId = uuidv4();
        const createdClass = await prisma.class.create({
          data: {
            id: classId,
            quota: 20,
            price: 1500000 + (i * 500000),
            status: "Active",
            start_reg_date: startRegDate,
            end_reg_date: endRegDate,
            duration_day: 5,
            start_date: startDate,
            end_date: endDate,
            location: `Batch ${i + 1}`,
            room: `Room ${101 + i}`,
            courseId: course.id
          }
        });
        createdClasses.push(createdClass);
        console.log(`Created class schedule for course: ${course.course_name}`);

        // Assign instructor to class
        const instructorIndex = i % createdInstructors.length;
        await prisma.instructureClass.create({
          data: {
            id: uuidv4(),
            instructureId: createdInstructors[instructorIndex].id,
            classId: classId
          }
        });
        console.log(`Assigned instructor ${createdInstructors[instructorIndex].full_name} to class for course: ${course.course_name}`);
      } else {
        createdClasses.push(existingClass);
        console.log(`Class for course ${course.course_name} already exists, skipping...`);
      }
    }

    // Create course registrations and certificates for demo user
    if (demoParticipant) {
      console.log("Creating course registrations for demo user...");
      
      // Register for the first two courses
      for (let i = 0; i < Math.min(2, createdClasses.length); i++) {
        const classData = createdClasses[i];
        
        // Check if already registered
        const existingRegistration = await prisma.courseRegistration.findFirst({
          where: {
            classId: classData.id,
            participantId: demoParticipant.id
          }
        });
        
        if (!existingRegistration) {
          const registrationId = uuidv4();
          
          // Create registration
          const registration = await prisma.courseRegistration.create({
            data: {
              id: registrationId,
              reg_date: new Date(today.setDate(today.getDate() - 15)),
              reg_status: "Registered",
              payment: classData.price,
              payment_status: i === 0 ? "Paid" : "Unpaid", // First course paid, second unpaid
              payment_method: "Transfer Bank",
              present_day: i === 0 ? 3 : 0, // First course in progress, second not started
              classId: classData.id,
              participantId: demoParticipant.id
            }
          });
          
          console.log(`Created course registration for ${createdCourses[i].course_name}`);
          
          // Create payment record
          const paymentId = uuidv4();
          const referenceNumber = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;
          
          await prisma.payment.create({
            data: {
              id: paymentId,
              paymentDate: new Date(today.setDate(today.getDate() - 14)),
              amount: classData.price,
              paymentMethod: "Transfer Bank",
              referenceNumber,
              status: i === 0 ? "Paid" : "Unpaid",
              registrationId,
            }
          });
          
          console.log(`Created payment record for ${createdCourses[i].course_name}`);
          
          // For completed courses (we'll make one course completed)
          if (i === 0) {
            // Create a certification for the completed course
            const certificationId = uuidv4();
            await prisma.certification.create({
              data: {
                id: certificationId,
                certificate_number: `CERT-${Date.now()}${Math.floor(Math.random() * 1000)}`,
                issue_date: new Date(today.setDate(today.getDate() - 5)),
                valid_date: new Date(today.setFullYear(today.getFullYear() + 1)), // Valid for 1 year
                file_pdf: "certificate.pdf",
                registrationId
              }
            });
            
            console.log(`Created certification for ${createdCourses[i].course_name}`);
          }
        } else {
          console.log(`Registration for ${createdCourses[i].course_name} already exists, skipping...`);
        }
      }
      
      // Create certificates (using the newer Certificate model)
      console.log("Creating certificates for demo user...");
      
      // Check if certificates already exist
      const existingCertificates = await prisma.certificate.count({
        where: {
          participantId: demoParticipant.id
        }
      });
      
      if (existingCertificates === 0) {
        // Create a valid certificate
        const validCertId = uuidv4();
        const today = new Date();
        const nextYear = new Date(today);
        nextYear.setFullYear(today.getFullYear() + 1);
        
        await prisma.certificate.create({
          data: {
            id: validCertId,
            certificateNumber: `CERT-${Date.now()}-1`,
            name: "Web Development Fundamentals Certificate",
            issueDate: new Date(today.setDate(today.getDate() - 30)),
            expiryDate: nextYear,
            status: "Valid",
            participantId: demoParticipant.id,
            courseId: createdCourses[0].id
          }
        });
        
        console.log("Created valid certificate for demo user");
        
        // Create an expiring certificate
        const expiringCertId = uuidv4();
        const expiringDate = new Date(today);
        expiringDate.setDate(today.getDate() + 20); // Expires in 20 days
        
        await prisma.certificate.create({
          data: {
            id: expiringCertId,
            certificateNumber: `CERT-${Date.now()}-2`,
            name: "Advanced JavaScript Certificate",
            issueDate: new Date(today.setMonth(today.getMonth() - 11)), // Issued 11 months ago
            expiryDate: expiringDate,
            status: "Valid", // Will be interpreted as "expiring" in the dashboard
            participantId: demoParticipant.id,
            courseId: createdCourses[1].id
          }
        });
        
        console.log("Created expiring certificate for demo user");
      } else {
        console.log("Certificates for demo user already exist, skipping...");
      }
    }

    // Create registrations for additional participants to generate meaningful statistics
    console.log("Creating registrations for additional participants...");
    
    // Get all participants
    const participants = await prisma.participant.findMany({
      take: 10 // Limit to 10 participants to avoid too many registrations
    });
    
    // Create registrations distributed across months for better chart data
    if (participants.length > 0) {
      const currentYear = new Date().getFullYear();
      
      // Create registrations for each month
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(currentYear, month, 15);
        
        // Number of registrations for this month (random between 2-8)
        const numRegistrations = 2 + Math.floor(Math.random() * 7);
        
        for (let i = 0; i < numRegistrations; i++) {
          // Pick a random participant and course
          const participant = participants[Math.floor(Math.random() * participants.length)];
          const classData = createdClasses[Math.floor(Math.random() * createdClasses.length)];
          
          // Check if this participant is already registered for this class
          const existingReg = await prisma.courseRegistration.findFirst({
            where: {
              participantId: participant.id,
              classId: classData.id
            }
          });
          
          if (!existingReg) {
            const registrationId = uuidv4();
            const regDate = new Date(currentYear, month, Math.floor(Math.random() * 28) + 1);
            
            // Create registration
            await prisma.courseRegistration.create({
              data: {
                id: registrationId,
                reg_date: regDate,
                reg_status: "Registered",
                payment: classData.price,
                payment_status: Math.random() > 0.3 ? "Paid" : "Unpaid", // 70% paid
                payment_method: "Transfer Bank",
                present_day: Math.floor(Math.random() * 5),
                classId: classData.id,
                participantId: participant.id
              }
            });
            
            // Create payment record
            const paymentId = uuidv4();
            const referenceNumber = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;
            
            await prisma.payment.create({
              data: {
                id: paymentId,
                paymentDate: regDate,
                amount: classData.price,
                paymentMethod: "Transfer Bank",
                referenceNumber,
                status: Math.random() > 0.3 ? "Paid" : "Unpaid",
                registrationId,
              }
            });
            
            // Create certificates for some completed courses
            if (month < 6 && Math.random() > 0.5) {
              // Create certificate in the Certificate model
              const certId = uuidv4();
              const issueDate = new Date(currentYear, month + 1, 15);
              const expiryDate = new Date(currentYear + 1, month + 1, 15);
              
              await prisma.certificate.create({
                data: {
                  id: certId,
                  certificateNumber: `CERT-${Date.now()}-${month}-${i}`,
                  name: `${(await prisma.course.findUnique({ where: { id: classData.courseId } }))?.course_name || 'Training'} Certificate`,
                  issueDate: issueDate,
                  expiryDate: expiryDate,
                  status: "Valid",
                  participantId: participant.id,
                  courseId: classData.courseId
                }
              });
            }
          }
        }
      }
      
      console.log("Created historical registration data for dashboard statistics");
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      mode
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 