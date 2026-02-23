import { prisma } from "@/lib/db/prisma";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000; // 5분

/**
 * 로그인 시도 기록 (DB 기반, Vercel 서버리스 안전)
 */
export async function recordLoginAttempt(
  identifier: string,
  ipAddress?: string
): Promise<void> {
  await prisma.login_attempts.create({
    data: {
      identifier,
      ip_address: ipAddress ?? null,
    },
  });
}

/**
 * 브루트포스 차단 검사
 * identifier: email 또는 IP
 * 5분 내 10회 초과 시 차단
 */
export async function isLoginBlocked(identifier: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const count = await prisma.login_attempts.count({
    where: {
      identifier,
      attempted_at: { gte: windowStart },
    },
  });

  return count >= MAX_ATTEMPTS;
}

/**
 * 로그인 성공 시 해당 식별자의 시도 기록 삭제
 */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  await prisma.login_attempts.deleteMany({
    where: { identifier },
  });
}
