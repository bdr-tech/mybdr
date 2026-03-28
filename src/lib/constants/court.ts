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
