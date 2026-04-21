/**
 * 프로필 전용 게이미피케이션 헬퍼
 *
 * 왜:
 * - `/users/[id]`(타인 프로필) 서버 컴포넌트에서 레벨/칭호/이모지 표시를 위해
 *   기존 `/api/web/profile/gamification` API를 거치면 불필요한 HTTP + snake_case 변환이 끼어들어
 *   6회 재발 버그 패턴에 노출된다 (errors.md 2026-04-17).
 * - 따라서 기존 순수 함수(getLevelInfo)를 서버 컴포넌트에서 직접 호출해
 *   `{ level, title, emoji }` 최소 필드만 뽑아낸다.
 *
 * 어떻게:
 * - `@/lib/services/gamification`의 `getLevelInfo(xp)`는 DB 접근 없는 순수 함수라 그대로 재사용.
 * - 이 파일은 "프로필 Hero 배지에 필요한 최소 필드"만 추려 반환하는 얇은 래퍼.
 * - 본인·타인 모두 동일 포맷으로 주입 → 공용 ProfileHero가 분기 없이 렌더.
 */

import { getLevelInfo as getFullLevelInfo } from "@/lib/services/gamification";

/** Hero 배지용 레벨 정보 최소 집합 (공개 가능) */
export interface ProfileLevelInfo {
  level: number;
  title: string;
  emoji: string;
}

/**
 * XP 값을 받아 Hero 배지 표시용 레벨 정보 반환.
 *
 * - xp가 null/undefined이면 null 반환 (Hero 컴포넌트 쪽에서 fallback 처리)
 * - 순수 함수이므로 서버/클라이언트 양쪽에서 안전
 */
export function getProfileLevelInfo(
  xp: number | null | undefined,
): ProfileLevelInfo | null {
  if (xp == null) return null;
  const info = getFullLevelInfo(xp);
  return {
    level: info.level,
    title: info.title,
    emoji: info.emoji,
  };
}
