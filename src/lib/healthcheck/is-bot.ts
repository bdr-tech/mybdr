/**
 * 헬스체크 봇 식별 / 쓰기 방어 헬퍼.
 *
 * 이유: 헬스체크 봇 계정이 실수로 운영 데이터(공고 생성, 배정, 정산 등)를
 *       더럽히지 못하도록, 쓰기 API 초반에 `requireNotBot`으로 차단한다.
 *       읽기(GET)는 봇 트래픽 허용 — 봇의 존재 목적은 "읽어서 확인"이므로.
 *
 * 식별 기준: 이메일 서픽스 `@healthcheck.bot` (DNS 존재 불가 도메인 → 충돌 0)
 */
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";

// 봇 이메일 서픽스 (모두 소문자로 비교)
// export: 헬스체크 cron에서 봇 계정 조회 시 하드코딩 대신 재사용
export const BOT_EMAIL_DOMAIN = "@healthcheck.bot";

/**
 * 이메일 문자열만 보고 봇 여부 판단. DB 조회 없음.
 * User 테이블 조회가 이미 있는 경로에서 재사용할 수 있게 동기 함수로 분리.
 */
export function isBotEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(BOT_EMAIL_DOMAIN);
}

/**
 * userId로 봇 여부 판단. User.email을 1회 조회하여 서픽스 검사.
 * null/undefined userId는 봇 아님으로 처리 (익명 요청은 별도 인증 단계에서 걸림).
 */
export async function isBotUser(
  userId: bigint | number | null | undefined
): Promise<boolean> {
  if (userId === null || userId === undefined) return false;
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { email: true },
  });
  return isBotEmail(user?.email);
}

/**
 * 쓰기 API 전용 가드. 봇 계정이면 403 응답을 반환, 아니면 null.
 *
 * 사용법:
 *   const botCheck = await requireNotBot(admin.userId);
 *   if (botCheck) return botCheck.error;
 *
 * 이유: 쓰기(POST/PATCH/DELETE) 초반에 호출하여 봇이 운영 데이터를 생성/수정하지 못하게 방어.
 *       헬스체크 봇은 "존재 확인"만 필요하므로 쓰기 권한이 없어도 무방.
 */
export async function requireNotBot(
  userId: bigint | number | null | undefined
): Promise<{ error: Response } | null> {
  if (await isBotUser(userId)) {
    return {
      error: apiError(
        "헬스체크 봇은 쓰기 작업을 수행할 수 없습니다.",
        403,
        "BOT_WRITE_FORBIDDEN"
      ),
    };
  }
  return null;
}
