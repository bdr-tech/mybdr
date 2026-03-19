import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // 평소: warn/error만 → 디버깅 시: .env에 PRISMA_LOG=true 추가하면 쿼리 로그 활성화
    log: process.env.PRISMA_LOG ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
