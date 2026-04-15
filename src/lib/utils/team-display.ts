// 팀명 한/영 병기 표시 유틸 (Phase 2C)
//
// 왜 분리했나:
// - 팀명을 표시하는 UI는 팀 카드/히어로/테이블/대진표/일정 등 여러 군데에 흩어져 있다.
// - 각 위치마다 "한/영을 어떻게 배치할지" 규칙이 같아야 혼란이 없다 → 한 곳에서 규칙을 고정.
//
// 규칙 요약:
// - 영문명이 없으면 한글만 (부제 없음)
// - 대표 언어가 "en"이면 영문이 메인, 한글이 부제 (큰 글씨=영문)
// - 그 외(기본/ko/null)는 한글이 메인, 영문이 부제 (큰 글씨=한글)

/**
 * 팀명을 메인(큰 글씨)과 부제(작은 글씨) 두 줄로 표시할 때 쓰는 유틸.
 * 공간이 넉넉한 카드/히어로용.
 *
 * @param name 한글 팀명 (필수, DB의 name 컬럼)
 * @param nameEn 영문 팀명 (선택, DB의 name_en 컬럼)
 * @param namePrimary 대표 언어 ("ko" | "en" | null)
 * @returns primary(메인 글씨) + secondary(부제, 없으면 null)
 */
export function getTeamDisplayNames(
  name: string,
  nameEn: string | null | undefined,
  namePrimary: string | null | undefined,
): { primary: string; secondary: string | null } {
  // 영문명이 실제로 존재하는지(trim 후 빈문자열 아닌지) 판별
  const trimmedEn = nameEn?.trim();
  const hasEn = !!trimmedEn && trimmedEn.length > 0;

  // 영문명 없으면 한글만 표기 — 부제는 null
  if (!hasEn) return { primary: name, secondary: null };

  // 대표 언어가 "en"이면 영문이 메인, 한글이 부제
  if (namePrimary === "en") {
    return { primary: trimmedEn!, secondary: name };
  }

  // 기본: 한글 메인 + 영문 부제 (namePrimary === "ko" | null | undefined)
  return { primary: name, secondary: trimmedEn! };
}

/**
 * 팀명을 한 줄로만 표시할 때 쓰는 유틸 (대진표 / 순위표 / 일정 등 공간 제약 UI).
 * 대표 언어 기준 1개 이름만 반환.
 *
 * @param name 한글 팀명 (필수)
 * @param nameEn 영문 팀명 (선택)
 * @param namePrimary 대표 언어 ("ko" | "en" | null)
 * @returns 대표 언어 기준 한 줄 팀명
 */
export function getTeamSingleName(
  name: string,
  nameEn: string | null | undefined,
  namePrimary: string | null | undefined,
): string {
  const trimmedEn = nameEn?.trim();
  // 대표가 영문 + 실제 영문명이 있으면 영문
  if (namePrimary === "en" && trimmedEn) return trimmedEn;
  // 그 외 모든 경우 한글
  return name;
}
