/**
 * 경기(game) 관련 공통 상수 — 유형/상태/실력 뱃지.
 * 원본: src/app/(web)/games/_constants/game-badges.ts에서 이동.
 * 홈 추천 경기, 경기 목록, 경기 카드 등 여러 곳에서 공통 사용.
 * 모든 색상은 CSS 변수 참조 (하드코딩 금지).
 */

// 경기 유형별 뱃지 (픽업/게스트/연습) + placeholder 그라디언트
export const TYPE_BADGE: Record<number, { label: string; color: string; bg: string; gradient: string; icon: string }> = {
  0: { label: "PICKUP",   color: "var(--color-on-primary)", bg: "var(--color-badge-blue)",  gradient: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)", icon: "sports_basketball" },
  1: { label: "GUEST",    color: "var(--color-on-primary)", bg: "var(--color-badge-green)", gradient: "linear-gradient(135deg, #1a3c2a 0%, #16a34a 50%, #0d9488 100%)", icon: "group_add" },
  2: { label: "PRACTICE", color: "var(--color-on-primary)", bg: "var(--color-badge-amber)", gradient: "linear-gradient(135deg, #4a2c0a 0%, #d97706 50%, #ea580c 100%)", icon: "fitness_center" },
};

// 경기 상태 라벨 (모집중/확정/완료/취소)
export const STATUS_LABEL: Record<number, { text: string; color: string }> = {
  1: { text: "모집중", color: "var(--color-status-open)" },
  2: { text: "확정",   color: "var(--color-status-confirmed)" },
  3: { text: "완료",   color: "var(--color-badge-gray)" },
  4: { text: "취소",   color: "var(--color-status-cancelled)" },
};

// 실력 수준별 뱃지 (초급~상급)
export const SKILL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  beginner:               { label: "초급",   color: "var(--color-badge-green)", bg: "rgba(22,163,74,0.10)" },
  intermediate:           { label: "중급",   color: "var(--color-badge-blue)",  bg: "rgba(37,99,235,0.10)" },
  intermediate_advanced:  { label: "중상",   color: "var(--color-badge-amber)", bg: "rgba(217,119,6,0.10)" },
  advanced:               { label: "상급",   color: "var(--color-badge-red)",   bg: "rgba(220,38,38,0.10)" },
};
