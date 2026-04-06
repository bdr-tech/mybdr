/**
 * 대회 캘린더 색상 상수
 *
 * 종별(category) x 성별(gender) 조합으로 8가지 고유 색상을 부여한다.
 * 캘린더 뷰에서 대회를 시각적으로 구분하기 위해 사용.
 */

// 종별 x 성별 → 색상 매핑 (총 8종)
const CALENDAR_COLORS: Record<string, string> = {
  general_male: "#3B82F6",     // 일반부 남성 — 파랑
  general_female: "#EC4899",   // 일반부 여성 — 핑크
  university_male: "#22C55E",  // 대학부 남성 — 초록
  university_female: "#84CC16",// 대학부 여성 — 라임
  youth_male: "#F97316",       // 유청소년 남성 — 주황
  youth_female: "#EAB308",     // 유청소년 여성 — 노랑
  senior_male: "#8B5CF6",      // 시니어 남성 — 보라
  senior_female: "#C084FC",    // 시니어 여성 — 연보라
};

// 기본 색상 (매칭 안 될 때)
const DEFAULT_COLOR = "#6B7280";

/**
 * 대회의 categories 객체에서 캘린더 색상을 결정한다.
 *
 * @param categories - { general: true, youth: false, ... } 형태의 종별 정보
 * @param divisionTiers - ["D5", "D5W"] 같은 디비전 목록 (W로 끝나면 여성부)
 * @returns hex 색상 문자열
 */
export function getCalendarColor(
  categories: Record<string, boolean> | null | undefined,
  divisionTiers: string[] | null | undefined,
): string {
  if (!categories) return DEFAULT_COLOR;

  // 활성화된 종별 찾기 (첫 번째 true인 종별 사용)
  const activeCategory = (["general", "university", "youth", "senior"] as const)
    .find((cat) => categories[cat] === true);

  if (!activeCategory) return DEFAULT_COLOR;

  // 성별 판단: divisionTiers에 W로 끝나는 코드가 있으면 여성부
  const hasWomen = (divisionTiers ?? []).some((tier) => tier.endsWith("W"));
  const hasMen = (divisionTiers ?? []).some((tier) => !tier.endsWith("W"));

  // 남녀 혼합이면 남성 색상, 여성만이면 여성 색상
  const gender = hasWomen && !hasMen ? "female" : "male";

  const key = `${activeCategory}_${gender}`;
  return CALENDAR_COLORS[key] ?? DEFAULT_COLOR;
}

/** 범례(legend) UI용: 모든 색상 목록을 배열로 반환 */
export const CALENDAR_COLOR_LEGEND = [
  { key: "general_male", label: "일반부 남성", color: "#3B82F6" },
  { key: "general_female", label: "일반부 여성", color: "#EC4899" },
  { key: "university_male", label: "대학부 남성", color: "#22C55E" },
  { key: "university_female", label: "대학부 여성", color: "#84CC16" },
  { key: "youth_male", label: "유청소년 남성", color: "#F97316" },
  { key: "youth_female", label: "유청소년 여성", color: "#EAB308" },
  { key: "senior_male", label: "시니어 남성", color: "#8B5CF6" },
  { key: "senior_female", label: "시니어 여성", color: "#C084FC" },
] as const;
