/**
 * 게이미피케이션 상수 정의
 *
 * XP 보상, 레벨 테이블, 뱃지 정의, 도장깨기 마일스톤을
 * 한 곳에서 관리한다. 서버/클라이언트 양쪽에서 import 가능.
 */

// ─────────────────────────────────────────
// 레벨 테이블: 각 레벨에 필요한 누적 XP + 칭호
// Lv1(0) ~ Lv10(10000), 점진적으로 증가
// ─────────────────────────────────────────
export const LEVELS: readonly { level: number; xp: number; title: string; emoji: string }[] = [
  { level: 1, xp: 0, title: "루키", emoji: "🏀" },
  { level: 2, xp: 100, title: "비기너", emoji: "🏃" },
  { level: 3, xp: 300, title: "레귤러", emoji: "💪" },
  { level: 4, xp: 600, title: "플레이어", emoji: "🔥" },
  { level: 5, xp: 1000, title: "올스타", emoji: "⭐" },
  { level: 6, xp: 1500, title: "프로", emoji: "🏆" },
  { level: 7, xp: 2500, title: "엘리트", emoji: "💎" },
  { level: 8, xp: 4000, title: "챔피언", emoji: "👑" },
  { level: 9, xp: 6000, title: "레전드", emoji: "🌟" },
  { level: 10, xp: 10000, title: "GOAT", emoji: "🐐" },
];

// ─────────────────────────────────────────
// XP 보상표: 각 활동별 획득 XP
// ─────────────────────────────────────────
export const XP_REWARDS = {
  // 체크아웃 시 기본 (기존 로직과 동일)
  checkin: 10,
  // 30분 이상 운동 보너스
  long_session_30: 5,
  // 1시간 이상 운동 보너스
  long_session_60: 10,
  // 리뷰 작성
  review: 15,
  // 제보 작성
  report: 5,
  // 7일 연속 스트릭 보너스
  streak_7: 50,
  // 위키 수정 제안이 승인됐을 때 (거절 시 0)
  wiki_edit: 10,
  // 앰배서더가 제보/위키 처리할 때마다 받는 XP
  ambassador_approve: 5,
} as const;

// ─────────────────────────────────────────
// 도장깨기 마일스톤: N개 코트 방문 시 뱃지 획득
// badge_type은 court_explorer_{count} 형식
// ─────────────────────────────────────────
export const COURT_MILESTONES = [
  { count: 5, name: "동네 농구인", icon: "sports_basketball", badge_type: "court_explorer_5" },
  { count: 10, name: "지역 탐험가", icon: "explore", badge_type: "court_explorer_10" },
  { count: 20, name: "전국 순회", icon: "travel_explore", badge_type: "court_explorer_20" },
  { count: 30, name: "코트 마스터", icon: "workspace_premium", badge_type: "court_explorer_30" },
  { count: 50, name: "레전드 탐험가", icon: "military_tech", badge_type: "court_explorer_50" },
] as const;

// ─────────────────────────────────────────
// 레벨업 뱃지: 특정 레벨 도달 시 자동 부여
// ─────────────────────────────────────────
export const LEVEL_BADGES: readonly { level: number; name: string; badge_type: string }[] = [
  { level: 5, name: "올스타 달성", badge_type: "level_5" },
  { level: 10, name: "GOAT 달성", badge_type: "level_10" },
];
