const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

async function main() {
  try {
    // Get the participant user type
    const participantType = await prisma.userType.findFirst({
      where: {
        usertype: 'participant'
      }
    })

    if (!participantType) {
      console.error('Participant user type not found')
      return
    }

    // Create participant user
    const participantPassword = await hash('participant123', 10)
    const participant = await prisma.user.create({
      data: {
        id: uuidv4(),
        username: 'participant',
        email: 'participant@train4best.com',
        password: participantPassword,
        userTypeId: participantType.id
      }
    })

    console.log('Participant user created successfully:', participant)
  } catch (error) {
    console.error('Error creating participant:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 