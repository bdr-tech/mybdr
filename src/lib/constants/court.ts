/**
 * 코트 관련 상수 정의
 * - 제보 유형(REPORT_TYPES): API와 UI에서 공유
 * - 리뷰 항목(REVIEW_CATEGORIES): 5개 세부 별점 항목
 */

// 코트 상태 제보 유형 — 유저가 코트의 문제를 신고할 때 선택하는 카테고리
export const REPORT_TYPES = {
  hoop_broken: { label: "골대 파손", icon: "sports_basketball" },
  surface_damaged: { label: "바닥 손상", icon: "texture" },
  lighting_broken: { label: "조명 고장", icon: "lightbulb" },
  access_blocked: { label: "출입 불가", icon: "block" },
  other: { label: "기타", icon: "report" },
} as const;

// REPORT_TYPES의 키 타입 (API 검증에 사용)
export type ReportType = keyof typeof REPORT_TYPES;

// 유효한 제보 유형 목록 (Zod 검증 등에 활용)
export const REPORT_TYPE_KEYS = Object.keys(REPORT_TYPES) as ReportType[];

// 리뷰 세부 별점 항목 — 5개 카테고리별 1~5점 입력
export const REVIEW_CATEGORIES = [
  { key: "facility_rating", label: "시설", icon: "apartment" },
  { key: "accessibility_rating", label: "접근성", icon: "directions_walk" },
  { key: "surface_rating", label: "바닥", icon: "texture" },
  { key: "lighting_rating", label: "조명", icon: "lightbulb" },
  { key: "atmosphere_rating", label: "분위기", icon: "mood" },
] as const;

// 리뷰 카테고리 키 타입
export type ReviewCategoryKey = (typeof REVIEW_CATEGORIES)[number]["key"];

// ─────────────────────────────────────────────────
// 유저 위키 수정 가능 필드 — 사용자가 제안할 수 있는 코트 정보 14개
// type: DB 컬럼 타입, input: UI 입력 방식, options: select일 때 선택지
// ─────────────────────────────────────────────────
export const EDITABLE_FIELDS = {
  court_type: {
    label: "코트 유형",
    type: "string" as const,
    input: "select" as const,
    options: [
      { value: "indoor", label: "실내" },
      { value: "outdoor", label: "야외" },
    ],
  },
  surface_type: {
    label: "바닥 재질",
    type: "string" as const,
    input: "select" as const,
    options: [
      { value: "asphalt", label: "아스팔트" },
      { value: "urethane", label: "우레탄" },
      { value: "wood", label: "마루" },
      { value: "concrete", label: "콘크리트" },
      { value: "rubber", label: "고무" },
      { value: "other", label: "기타" },
    ],
  },
  hoops_count: {
    label: "골대 수",
    type: "number" as const,
    input: "number" as const,
    min: 1,
    max: 10,
  },
  hoop_height: {
    label: "골대 높이",
    type: "string" as const,
    input: "select" as const,
    options: [
      { value: "305", label: "공식 (305cm)" },
      { value: "non_standard", label: "비공식" },
    ],
  },
  court_size: {
    label: "코트 크기",
    type: "string" as const,
    input: "select" as const,
    options: [
      { value: "fullcourt", label: "풀코트" },
      { value: "halfcourt", label: "하프코트" },
      { value: "3x3", label: "3x3" },
    ],
  },
  has_lighting: {
    label: "야간 조명",
    type: "boolean" as const,
    input: "toggle" as const,
  },
  lighting_until: {
    label: "조명 종료 시간",
    type: "string" as const,
    input: "time" as const,
  },
  has_restroom: {
    label: "화장실",
    type: "boolean" as const,
    input: "toggle" as const,
  },
  has_parking: {
    label: "주차장",
    type: "boolean" as const,
    input: "toggle" as const,
  },
  is_free: {
    label: "무료 여부",
    type: "boolean" as const,
    input: "toggle" as const,
  },
  fee: {
    label: "이용 요금 (원)",
    type: "number" as const,
    input: "number" as const,
    min: 0,
    max: 1000000,
  },
  nickname: {
    label: "별칭",
    type: "string" as const,
    input: "text" as const,
    maxLength: 30,
  },
  description: {
    label: "소개",
    type: "string" as const,
    input: "textarea" as const,
    maxLength: 500,
  },
  nearest_station: {
    label: "가까운 역",
    type: "string" as const,
    input: "text" as const,
    maxLength: 50,
  },
} as const;

// 수정 가능 필드 키 타입
export type EditableFieldKey = keyof typeof EDITABLE_FIELDS;

// 수정 가능 필드 키 배열 (API 검증에 사용)
export const EDITABLE_FIELD_KEYS = Object.keys(EDITABLE_FIELDS) as EditableFieldKey[];
