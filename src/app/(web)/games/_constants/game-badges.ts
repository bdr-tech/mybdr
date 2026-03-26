/**
 * 경기 카드에서 공통으로 사용하는 뱃지/라벨 상수
 * games-content.tsx와 game-card-compact.tsx에서 중복 정의되어 있던 것을 통합
 * 모든 색상은 CSS 변수 참조 (하드코딩 금지)
 */

// 경기 유형별 뱃지 (픽업/게스트/연습)
export const TYPE_BADGE: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "PICKUP",   color: "var(--color-on-primary)", bg: "var(--color-badge-blue)" },
  1: { label: "GUEST",    color: "var(--color-on-primary)", bg: "var(--color-badge-green)" },
  2: { label: "PRACTICE", color: "var(--color-on-primary)", bg: "var(--color-badge-amber)" },
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
