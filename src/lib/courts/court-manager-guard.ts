/* ============================================================
 * Court Manager Guard — 코트 운영자 권한 헬퍼 (Phase A)
 *
 * 이유:
 *   D-B1=(a) "court_rental 활성 구독자만 운영자" 룰 + D-B2=(a) "court_infos.user_id 1:1 매핑" 룰을
 *   하나의 헬퍼로 묶어 모든 운영자 API/페이지에서 1줄 호출로 가드한다.
 *   referee/admin/admin-guard.ts 패턴 그대로 재사용.
 *
 * 검증 흐름:
 *   1) court_infos.user_id 가 본인인가? (등록자 = 운영자)
 *   2) 본인이 feature_key="court_rental" 활성 구독을 가지고 있는가?
 *      - status = "active"
 *      - expires_at IS NULL OR expires_at >= NOW()
 *
 * 사용처:
 *   - /api/web/courts/[id]/manage/bookings (GET/POST)
 *   - /api/web/bookings/[id] DELETE (운영자 강제 취소 시)
 *   - /courts/[id]/manage 페이지 (서버 컴포넌트 가드)
 * ============================================================ */

import { prisma } from "@/lib/db/prisma";

export interface CourtManagerCheck {
  isManager: boolean;
  // 운영자가 아닐 때 그 이유 (UI 분기 / 디버그 로그용)
  reason?: "NOT_OWNER" | "NO_SUBSCRIPTION" | "COURT_NOT_FOUND";
}

/**
 * 본인이 해당 코트의 운영자(=등록자 + court_rental 활성 구독)인지 검사.
 * @param userId 현재 로그인 유저 ID (BigInt)
 * @param courtInfoId 검사할 코트 ID (BigInt)
 * @returns isManager + 실패 사유
 */
export async function checkCourtManager(
  userId: bigint,
  courtInfoId: bigint
): Promise<CourtManagerCheck> {
  // 1) 코트 등록자 확인 — court_infos.user_id 가 본인인가?
  const court = await prisma.court_infos.findUnique({
    where: { id: courtInfoId },
    select: { user_id: true },
  });

  if (!court) return { isManager: false, reason: "COURT_NOT_FOUND" };
  if (court.user_id !== userId) return { isManager: false, reason: "NOT_OWNER" };

  // 2) court_rental 활성 구독 확인
  // 이유: 운영자 자격은 멤버십 활성 상태에 종속 (D-B1=a)
  // expires_at = null 인 구독도 active 로 인정 (관리자 직접 부여한 영구 구독 케이스)
  const subscription = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      feature_key: "court_rental",
      status: "active",
      OR: [
        { expires_at: null },
        { expires_at: { gte: new Date() } },
      ],
    },
    select: { id: true },
  });

  if (!subscription) return { isManager: false, reason: "NO_SUBSCRIPTION" };

  return { isManager: true };
}

/**
 * Boolean only 변환 (간단 체크용).
 * @example if (await isCourtManager(userId, courtId)) { ... }
 */
export async function isCourtManager(
  userId: bigint,
  courtInfoId: bigint
): Promise<boolean> {
  const result = await checkCourtManager(userId, courtInfoId);
  return result.isManager;
}
