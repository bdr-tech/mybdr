/**
 * BDR 디비전 규정 기준 (2025.07.15 카페 공지)
 *
 * 디비전 체계:
 * - 일반부 (D시리즈): D3~D8, 숫자 작을수록 상위
 * - 유청소년 (i시리즈): 하모니, i1~i4
 * - 대학부 (U시리즈): U1~U3
 * - 시니어 (S시리즈): S1~S3
 *
 * 여성부: 모든 디비전 코드 뒤에 "W" 추가 (예: D3W, i1W)
 *
 * 상위리그 출전권:
 * - 24팀 대회: 4장
 * - 12팀 대회: 2장
 */

// ─── 타입 정의 ────────────────────────────────────────
export type GenderCode = "male" | "female";
export type CategoryCode = "general" | "youth" | "university" | "senior";
// 디비전 코드는 여성부 접미사(W) 등 동적 조합이라 union 대신 string 사용
export type DivisionCode = string;

// ─── 성별 (혼성 없음) ─────────────────────────────────
export const GENDERS = {
  male: { label: "남성", code: "male" as const },
  female: { label: "여성", code: "female" as const },
} as const;

// ─── 종별 (카테고리) ──────────────────────────────────
// divisionPrefix: 해당 종별의 디비전 코드 접두어
export const CATEGORIES = {
  general: { label: "일반부", code: "general" as const, divisionPrefix: "D" },
  youth: { label: "유청소년", code: "youth" as const, divisionPrefix: "i" },
  university: { label: "대학부", code: "university" as const, divisionPrefix: "U" },
  senior: { label: "시니어", code: "senior" as const, divisionPrefix: "S" },
} as const;

// ─── 디비전 상세 정보 타입 ────────────────────────────
export interface DivisionInfo {
  label: string;
  leagueName: string | null;
  ranking: string | null;
  selection: string | null;
  registration: string | null;
  tier: number;
  category: CategoryCode;
  description?: string;
  // 여성부 여부 (W 접미사)
  gender: GenderCode;
}

// ─── 일반부 (D 시리즈) ────────────────────────────────
// D3~D8: 숫자가 작을수록 상위 디비전
const GENERAL_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  D3: {
    label: "D3",
    leagueName: "동호회 최강전",
    ranking: "30위",
    selection: "2명",
    registration: "등록",
    tier: 1,
    category: "general",
  },
  D4: {
    label: "D4",
    leagueName: "챌린저스",
    ranking: "100위",
    selection: "1명",
    registration: "등록",
    tier: 2,
    category: "general",
  },
  D5: {
    label: "D5",
    leagueName: "비기너스",
    ranking: "100위 밖",
    selection: "없음",
    registration: "등록권장",
    tier: 3,
    category: "general",
  },
  D6: {
    label: "D6",
    leagueName: "뉴비",
    ranking: null,
    selection: "없음",
    registration: "비등록",
    tier: 4,
    category: "general",
    description: "신생팀/대회경험 부족팀/대학부→일반부 도전팀",
  },
  D7: {
    label: "D7",
    leagueName: "스타터스",
    ranking: null,
    selection: "없음",
    registration: "비등록",
    tier: 5,
    category: "general",
    description: "농구교실팀(초급)/동네 농구만 하던 분들/유니폼 없이 참가 가능",
  },
  D8: {
    label: "D8",
    leagueName: "아카데미",
    ranking: null,
    selection: "없음",
    registration: "비등록",
    tier: 6,
    category: "general",
  },
};

// ─── 유청소년 (i 시리즈) ──────────────────────────────
const YOUTH_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  하모니: {
    label: "하모니",
    leagueName: "하모니",
    ranking: null,
    selection: null,
    registration: null,
    tier: 0,
    category: "youth",
    description: "엘리트 초등학교팀 + 최상위권 유소년 클럽",
  },
  i1: { label: "i1", leagueName: null, ranking: null, selection: null, registration: null, tier: 1, category: "youth" },
  i2: { label: "i2", leagueName: null, ranking: null, selection: null, registration: null, tier: 2, category: "youth" },
  i3: { label: "i3", leagueName: null, ranking: null, selection: null, registration: null, tier: 3, category: "youth" },
  i4: { label: "i4", leagueName: null, ranking: null, selection: null, registration: null, tier: 4, category: "youth" },
};

// ─── 대학부 (U 시리즈) ────────────────────────────────
const UNIVERSITY_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  U1: { label: "U1", leagueName: null, ranking: null, selection: null, registration: null, tier: 1, category: "university" },
  U2: { label: "U2", leagueName: null, ranking: null, selection: null, registration: null, tier: 2, category: "university" },
  U3: { label: "U3", leagueName: null, ranking: null, selection: null, registration: null, tier: 3, category: "university" },
};

// ─── 시니어 (S 시리즈) ────────────────────────────────
const SENIOR_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  S1: { label: "S1", leagueName: null, ranking: null, selection: null, registration: null, tier: 1, category: "senior" },
  S2: { label: "S2", leagueName: null, ranking: null, selection: null, registration: null, tier: 2, category: "senior" },
  S3: { label: "S3", leagueName: null, ranking: null, selection: null, registration: null, tier: 3, category: "senior" },
};

// ─── 남성부 기본 디비전 통합 ──────────────────────────
// 모든 종별의 남성부 디비전을 하나의 맵으로 합침
const BASE_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  ...GENERAL_DIVISIONS,
  ...YOUTH_DIVISIONS,
  ...UNIVERSITY_DIVISIONS,
  ...SENIOR_DIVISIONS,
};

// ─── 여성부 디비전 자동 생성 ──────────────────────────
// 모든 디비전 코드 뒤에 "W"를 붙여 여성부 디비전 생성
function buildWomenDivisions(
  base: Record<string, Omit<DivisionInfo, "gender">>
): Record<string, Omit<DivisionInfo, "gender">> {
  const result: Record<string, Omit<DivisionInfo, "gender">> = {};
  for (const [code, info] of Object.entries(base)) {
    result[`${code}W`] = {
      ...info,
      label: `${info.label}W`, // 레이블에도 W 추가
    };
  }
  return result;
}

const WOMEN_DIVISIONS = buildWomenDivisions(BASE_DIVISIONS);

// ─── 전체 디비전 맵 (성별 포함) ──────────────────────
// 남성부 + 여성부 모든 디비전을 gender 정보와 함께 통합
const ALL_DIVISIONS_MAP: Record<string, DivisionInfo> = {};

// 남성부 등록
for (const [code, info] of Object.entries(BASE_DIVISIONS)) {
  ALL_DIVISIONS_MAP[code] = { ...info, gender: "male" };
}
// 여성부 등록
for (const [code, info] of Object.entries(WOMEN_DIVISIONS)) {
  ALL_DIVISIONS_MAP[code] = { ...info, gender: "female" };
}

/** 전체 디비전 맵 (읽기 전용) */
export const DIVISIONS = ALL_DIVISIONS_MAP as Readonly<Record<string, DivisionInfo>>;

// ─── 종별별 기본(남성) 디비전 코드 목록 ──────────────
// 필터링 UI 등에서 종별 선택 시 해당 디비전만 보여줄 때 사용
const CATEGORY_DIVISION_CODES: Record<CategoryCode, string[]> = {
  general: Object.keys(GENERAL_DIVISIONS),
  youth: Object.keys(YOUTH_DIVISIONS),
  university: Object.keys(UNIVERSITY_DIVISIONS),
  senior: Object.keys(SENIOR_DIVISIONS),
};

// ─── 유틸 함수 ───────────────────────────────────────

/**
 * 디비전 코드로 상세 정보 조회
 * @param code - 디비전 코드 (예: "D3", "D3W", "하모니W")
 * @returns 디비전 정보 또는 null
 */
export function getDivisionInfo(code: string): DivisionInfo | null {
  return ALL_DIVISIONS_MAP[code] ?? null;
}

/**
 * 성별 + 종별로 사용 가능한 디비전 코드 목록 반환
 * @param category - 종별 코드
 * @param gender - 성별 코드
 * @returns 해당 조건의 디비전 코드 배열
 */
export function getDivisionsForCategory(
  category: CategoryCode,
  gender: GenderCode
): string[] {
  const baseCodes = CATEGORY_DIVISION_CODES[category] ?? [];
  if (gender === "female") {
    // 여성부는 코드 뒤에 W 추가
    return baseCodes.map((code) => `${code}W`);
  }
  return [...baseCodes];
}

/**
 * 디비전 코드에서 성별 판단
 * W로 끝나면 여성, 아니면 남성
 */
export function getGenderFromDivision(code: string): GenderCode {
  return code.endsWith("W") ? "female" : "male";
}

/**
 * 전체 디비전 코드 목록 (남성부 + 여성부 flat array)
 */
export function getAllDivisionCodes(): string[] {
  return Object.keys(ALL_DIVISIONS_MAP);
}
