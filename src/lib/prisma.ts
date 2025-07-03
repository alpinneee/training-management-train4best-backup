import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Add logging for debugging
const prismaClientSingleton = () => {
  // Use explicit connection URL as fallback if environment variable is not set
  const databaseUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/train4best"
  
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 