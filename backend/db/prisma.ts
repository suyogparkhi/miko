// Prisma database client configuration
import { PrismaClient } from '@prisma/client';

// Global is used here to maintain a cached connection across hot reloads in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

export default prisma; 