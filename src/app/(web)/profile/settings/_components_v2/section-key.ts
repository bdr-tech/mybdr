/* ============================================================
 * SectionKey — Settings 6 섹션 키 + 폴백 매핑
 *
 * 왜:
 *  - URL 쿼리 ?section=... 의 합법 값을 한 곳에 집중 → 페이지/네비/섹션이
 *    같은 source of truth 를 공유.
 *  - 기존 ?tab=preferences|notifications 외부 링크/북마크 폴백 처리도 여기에 둠.
 *
 * 어떻게:
 *  - SectionKey 유니언 타입 + VALID_SECTIONS 상수.
 *  - resolveSection(rawSection, rawTab) 으로 우선순위 결정:
 *      1. ?section=... 가 유효하면 그대로
 *      2. 없으면 ?tab=preferences → "profile" (맞춤설정 자리 = 프로필 섹션이 가장 근접)
 *                ?tab=notifications → "notify"
 *      3. 그 외 기본 "account"
 * ============================================================ */

export type SectionKey =
  | "account"
  | "profile"
  | "notify"
  | "privacy"
  | "billing"
  | "danger";

export const VALID_SECTIONS: readonly SectionKey[] = [
  "account",
  "profile",
  "notify",
  "privacy",
  "billing",
  "danger",
] as const;

// 외부에서 들어오는 임의의 문자열을 안전한 SectionKey 로 좁힘.
export function resolveSection(
  rawSection: string | null,
  rawTab: string | null,
): SectionKey {
  if (rawSection && (VALID_SECTIONS as readonly string[]).includes(rawSection)) {
    return rawSection as SectionKey;
  }
  // 기존 ?tab= 호환: preferences/맞춤설정은 v2 시안에 별도 섹션이 없어 가장
  // 근접한 "profile" 로, notifications 는 "notify" 로 폴백.
  if (rawTab === "preferences") return "profile";
  if (rawTab === "notifications") return "notify";
  return "account";
}
