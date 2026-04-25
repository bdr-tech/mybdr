/* ============================================================
 * BadgeCatalog — /profile/achievements 정적 카탈로그
 *
 * 왜 정적 카탈로그인가:
 * - DB 의 user_badges 는 badge_type / badge_name / badge_data / earned_at 만 저장.
 *   tier (플래티넘/골드/실버/브론즈), category (경기/팀/커뮤니티/시즌/마일스톤),
 *   icon (이모지), desc (설명) 는 스키마에 없음.
 * - PM 결정: API/Prisma 스키마 0 변경 → 클라 정적 카탈로그로 메타 보강.
 * - 시안 (Achievements.jsx) 의 16개 더미 데이터를 그대로 카탈로그화하되,
 *   기존 user_badges 발급 트리거 (court_explorer, streak_7 등) 와 병합 매핑.
 *
 * 어떻게:
 * - CATALOG: badge_type → { tier, category, icon, desc, name } 매핑 테이블.
 *   · DB 발급 가능 타입 (court_explorer, streak_3/7/30, level_up, first_game/win 등) 우선.
 *   · 시안 16종은 DB 미발급이지만 "추후 발급 예정" 자리 마련.
 * - resolveBadgeMeta(): 매핑 실패 시 tier=bronze / category=milestone / icon=🏅 폴백.
 * - TIER_COLOR / TIER_LABEL / CATEGORY_LABEL: 시안 컬러 코드 그대로.
 * ============================================================ */

/** 시안의 4단계 tier (희귀도 순) */
export type BadgeTier = "platinum" | "gold" | "silver" | "bronze";

/** 시안의 5종 category (필터 칩 기준) */
export type BadgeCategory =
  | "game"
  | "team"
  | "community"
  | "season"
  | "milestone";

/** 카탈로그 1행 — 정적 메타데이터 */
export interface BadgeMeta {
  tier: BadgeTier;
  category: BadgeCategory;
  icon: string;
  /** 시안 설명 — 없으면 "—" */
  desc: string;
  /** 시안 이름 — DB badge_name 이 우선 적용되지만 카탈로그-only 배지용 */
  name?: string;
}

/** 시안의 tier 색상 (badge-side-card 와 별개로 명시적) */
export const TIER_COLOR: Record<BadgeTier, string> = {
  platinum: "#7DD3FC",
  gold: "#F59E0B",
  silver: "#94A3B8",
  bronze: "#C2765A",
};

/** 시안의 tier 한글 라벨 */
export const TIER_LABEL: Record<BadgeTier, string> = {
  platinum: "플래티넘",
  gold: "골드",
  silver: "실버",
  bronze: "브론즈",
};

/** 시안의 category 한글 라벨 (필터 칩) */
export const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  game: "경기",
  team: "팀",
  community: "커뮤니티",
  season: "시즌",
  milestone: "마일스톤",
};

/** 시안의 category 컬러 (필요 시 활용) */
export const CATEGORY_COLOR: Record<BadgeCategory, string> = {
  game: "#DC2626",
  team: "#0F5FCC",
  community: "#10B981",
  season: "#F59E0B",
  milestone: "#8B5CF6",
};

/* ============================================================
 * 카탈로그 본체 — 16개
 *
 * Key:
 * - DB 에 실제 발급되는 badge_type 우선 (badges-side-card 에서 이미 매핑된 것들).
 * - 시안 only 배지는 Achievements.jsx 의 id1~id16 그대로 보존하기 위해
 *   임의의 type 키를 부여 (double_triple_double, ten_win_streak 등).
 *
 * 발견자 주: PM 지시 — DB 미지원 메타는 정적 카탈로그에서 보강.
 *           추후 badge_definitions 테이블 도입 시 마이그레이션 (scratchpad 추후 구현 4건 참조).
 * ============================================================ */
export const BADGE_CATALOG: Record<string, BadgeMeta> = {
  // ====== 시안 16종 (Achievements.jsx) ======
  double_triple_double: {
    tier: "gold",
    category: "game",
    icon: "🎯",
    desc: "한 경기 2회 이상 트리플더블 달성",
    name: "더블 트리플더블",
  },
  ten_win_streak: {
    tier: "silver",
    category: "game",
    icon: "🔥",
    desc: "연속 10경기 승리",
    name: "10연승",
  },
  thirty_plus_game: {
    tier: "gold",
    category: "game",
    icon: "💯",
    desc: "한 경기 30득점 돌파",
    name: "한 경기 30+",
  },
  hundred_threes: {
    tier: "bronze",
    category: "game",
    icon: "🎯",
    desc: "시즌 누적 3점 100개",
    name: "3점 100개",
  },
  team_founder: {
    tier: "gold",
    category: "team",
    icon: "🏆",
    desc: "팀 창단 오리지널 멤버",
    name: "팀 창단 멤버",
  },
  team_captain: {
    tier: "silver",
    category: "team",
    icon: "👑",
    desc: "팀 주장으로 1시즌 완주",
    name: "주장",
  },
  writer_lv1: {
    tier: "silver",
    category: "community",
    icon: "✍️",
    desc: "게시글 50건 작성",
    name: "작가 레벨1",
  },
  issue_maker: {
    tier: "gold",
    category: "community",
    icon: "🔥",
    desc: "한 게시글 1,000 조회 돌파",
    name: "이슈메이커",
  },
  comment_master: {
    tier: "bronze",
    category: "community",
    icon: "💬",
    desc: "댓글 200건",
    name: "댓글 장인",
  },
  season_mvp_candidate: {
    tier: "gold",
    category: "season",
    icon: "⭐",
    desc: "시즌 MVP 투표 후보 선정",
    name: "시즌 MVP 후보",
  },
  perfect_attendance: {
    tier: "silver",
    category: "season",
    icon: "🎗",
    desc: "시즌 전 경기 참가",
    name: "개근상",
  },
  hundred_games_club: {
    tier: "platinum",
    category: "milestone",
    icon: "💎",
    desc: "누적 100경기 출전",
    name: "백경기 클럽",
  },
  one_year_anniversary: {
    tier: "gold",
    category: "milestone",
    icon: "🎂",
    desc: "MyBDR 가입 1주년",
    name: "1주년",
  },
  early_bird: {
    tier: "silver",
    category: "milestone",
    icon: "🌅",
    desc: "오전 6시 경기 5회",
    name: "얼리버드",
  },
  perfect_game: {
    tier: "platinum",
    category: "game",
    icon: "🌟",
    desc: "시즌 내 평점 5점 10경기 연속",
    name: "퍼펙트 게임",
  },
  archive_master: {
    tier: "gold",
    category: "community",
    icon: "📸",
    desc: "갤러리 업로드 30건",
    name: "아카이브",
  },

  // ====== DB 에서 실제 발급되는 타입들 (badges-side-card 와 일관성 유지) ======
  // 이 항목들은 시안에는 없지만 운영 중 발급되어 onload 될 수 있으므로 카탈로그에 포함.
  court_explorer: {
    tier: "bronze",
    category: "milestone",
    icon: "🏟️",
    desc: "동네 농구인 — 다양한 코트 방문",
  },
  streak_3: {
    tier: "bronze",
    category: "milestone",
    icon: "🔥",
    desc: "3일 연속 활동",
  },
  streak_7: {
    tier: "silver",
    category: "milestone",
    icon: "🔥",
    desc: "7일 연속 활동",
  },
  streak_30: {
    tier: "gold",
    category: "milestone",
    icon: "🔥",
    desc: "30일 연속 활동",
  },
  level_up: {
    tier: "bronze",
    category: "milestone",
    icon: "⬆️",
    desc: "레벨 업 달성",
  },
  first_game: {
    tier: "bronze",
    category: "game",
    icon: "🏀",
    desc: "첫 경기 참여",
  },
  first_win: {
    tier: "silver",
    category: "game",
    icon: "🏆",
    desc: "첫 승리",
  },
  winner: {
    tier: "silver",
    category: "game",
    icon: "🏆",
    desc: "경기 승리",
  },
  mvp: {
    tier: "gold",
    category: "game",
    icon: "⭐",
    desc: "경기 MVP 선정",
  },
  three_pointer: {
    tier: "silver",
    category: "game",
    icon: "🎯",
    desc: "3점슛 마스터",
  },
  assist_master: {
    tier: "silver",
    category: "game",
    icon: "🤝",
    desc: "어시스트 마스터",
  },
  rebound_king: {
    tier: "silver",
    category: "game",
    icon: "🛡️",
    desc: "리바운드 킹",
  },
  all_star: {
    tier: "platinum",
    category: "season",
    icon: "⭐",
    desc: "올스타 선정",
  },
};

/* 폴백 — 매핑 실패 시 사용 */
const FALLBACK_META: BadgeMeta = {
  tier: "bronze",
  category: "milestone",
  icon: "🏅",
  desc: "—",
};

/**
 * badge_type 으로 메타데이터 조회. 매핑 실패 시 폴백 반환.
 * (왜 함수로 분리했나: page.tsx 와 achievements-content.tsx 양쪽에서 동일 폴백 보장)
 */
export function resolveBadgeMeta(badgeType: string): BadgeMeta {
  return BADGE_CATALOG[badgeType] ?? FALLBACK_META;
}

/** 카탈로그 키 전체 — 카탈로그-only 배지(잠금 상태) 표시용 */
export const CATALOG_KEYS = Object.keys(BADGE_CATALOG);

/** 시안 16종의 키 순서 — "전체" 그리드에서 시안과 동일 순서로 노출하기 위함 */
export const SIGNATURE_ORDER: string[] = [
  "double_triple_double",
  "ten_win_streak",
  "thirty_plus_game",
  "hundred_threes",
  "team_founder",
  "team_captain",
  "writer_lv1",
  "issue_maker",
  "comment_master",
  "season_mvp_candidate",
  "perfect_attendance",
  "hundred_games_club",
  "one_year_anniversary",
  "early_bird",
  "perfect_game",
  "archive_master",
];
