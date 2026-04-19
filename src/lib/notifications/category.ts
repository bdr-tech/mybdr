/**
 * 알림 카테고리 분류 + 카테고리별 type 목록 + 아이콘 매핑
 *
 * 이유: notifications 페이지(클라/서버)와 read-all API가 모두 같은 분류 규칙을
 *      공유하도록 단일 소스로 통합. DB 변경 없이 prefix 기반 매핑으로 처리.
 *
 * 분류 규칙:
 *   tournament  ← `tournament.*`
 *   game        ← `game.*`
 *   team        ← `team.*` 또는 정확히 `follow`
 *   community   ← 정확히 `like` 또는 `comment.*`
 *   system      ← 그 외 모두 (referee.*, system.*, weekly.*, admin.* fallback)
 */

// 6카테고리(전체 탭은 클라에서 처리하므로 5종만 enum)
export type NotifCategory = "tournament" | "game" | "team" | "community" | "system";

// notification_type → 카테고리 판정
// 서버/클라 양쪽에서 동일하게 사용 (단일 진실 원천)
export function categorize(type: string): NotifCategory {
  if (type.startsWith("tournament.")) return "tournament";
  if (type.startsWith("game.")) return "game";
  if (type.startsWith("team.") || type === "follow") return "team";
  if (type === "like" || type.startsWith("comment.")) return "community";
  return "system"; // referee.*, system.*, weekly.*, 그 외 모두 fallback
}

// 카테고리 → Material Symbols 아이콘 + 색상 변수 매핑
// (notifications-client.tsx getNotificationIcon 의 로직을 카테고리 단위로 통합)
export const ICON_MAP: Record<NotifCategory, { icon: string; color: string }> = {
  tournament: { icon: "emoji_events", color: "var(--color-primary)" },
  game: { icon: "sports_basketball", color: "var(--color-accent)" },
  team: { icon: "groups", color: "var(--color-info)" },
  community: { icon: "forum", color: "var(--color-text-secondary)" },
  system: { icon: "settings", color: "var(--color-text-secondary)" },
};

/**
 * 카테고리별 notification_type 화이트리스트
 *
 * read-all API에서 카테고리만 받았을 때 prisma `where: { notification_type: { in: [...] } }`
 * 형태로 변환하기 위한 명시적 매핑.
 *
 * ⚠️ 중요: prefix 기반(`startsWith`) 매칭과 달리 prisma의 `in`은 정확 일치만 지원하므로
 *      notify-helpers.ts(NOTIFICATION_TYPES) 와 actions/follow.ts, actions/community.ts
 *      에 정의된 모든 type을 여기에 명시적으로 나열한다. 누락된 type은 read-all 시 처리 안 됨.
 *
 * - tournament: NOTIFICATION_TYPES.TOURNAMENT_* 5종
 * - game: NOTIFICATION_TYPES.GAME_* 5종
 * - team: NOTIFICATION_TYPES.TEAM_* 3종 + "follow"
 * - community: "like" + comment.* (현재 comment.* 미사용이라 like 1종)
 * - system: NOTIFICATION_TYPES.SYSTEM_* + weekly.report + admin_broadcast
 *
 * system fallback은 prisma `in` 으로 표현 불가 → API에서 별도 처리(`notIn` 다른 카테고리들)
 * 권장. 우선은 알려진 system 타입 화이트리스트만 둠.
 */
export const TYPES_BY_CATEGORY: Record<NotifCategory, readonly string[]> = {
  // src/lib/notifications/types.ts NOTIFICATION_TYPES 와 1:1 동기화
  tournament: [
    "tournament.join.submitted",
    "tournament.join.received",
    "tournament.dday.reminder",
    "tournament.bracket.approval",
    "tournament.bracket.approved",
  ],
  game: [
    "game.application.received",
    "game.application.submitted",
    "game.application.approved",
    "game.application.rejected",
    "game.cancelled",
  ],
  team: [
    "team.join_request.received",
    "team.join_request.approved",
    "team.join_request.rejected",
    "follow", // src/app/actions/follow.ts 에서 발행
  ],
  community: [
    "like", // src/app/actions/community.ts 에서 발행
    "comment.created",
    "comment.reply",
  ],
  // referee.* 5종 + weekly.report + system.* 일체. (web)/notifications에는 거의 안 나타남(referee는 별도 라우트)
  // 단 fallback 보호 차원으로 화이트리스트에 referee.* 포함.
  system: [
    "weekly.report",
    "referee.pool.selected",
    "referee.pool.chief_assigned",
    "referee.assignment.created",
    "referee.settlement.paid",
    "referee.announcement.new",
    "system.admin_broadcast",
  ],
};
