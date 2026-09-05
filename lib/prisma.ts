import { PrismaClient } from "@prisma/client";

type GlobalWithPrisma = typeof globalThis & { prismaGlobal?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as GlobalWithPrisma;

export const prisma: PrismaClient = globalForPrisma.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = prisma;
}
