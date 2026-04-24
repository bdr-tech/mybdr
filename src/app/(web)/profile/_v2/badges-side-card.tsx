/* ============================================================
 * BadgesSideCard — /profile v2 활동 뱃지 사이드 카드
 *
 * 왜:
 * - v2 Profile.jsx L55~66 좌측 aside "활동 뱃지" 재현. PM 확정 D-P8:
 *   user_badges 쿼리 추가 OK (읽기만, 서버 컴포넌트 Prisma 직접 호출).
 * - 시안은 4개 더미 (🏆 🔥 ⭐ 🎯) 이나 실제 DB 는 badge_type/badge_name 기반.
 *   · badge_type 으로 이모지 매핑 테이블 구축 (재사용성).
 *   · 획득 뱃지 0개면 컴포넌트 자체 숨김 (페이지 조건부 렌더).
 *
 * 어떻게:
 * - 2x2 grid — 최대 4개만 표시 (시안과 동일). 4개 초과 시 최신 4개만.
 * - earned_at 을 YYYY.MM 포맷으로 표시 (시안의 "2026.02" 형식).
 * - badge_type 매핑 없으면 "🏅" 기본 이모지.
 * ============================================================ */

/** user_badges 테이블의 badge_type → 표시 이모지 */
const BADGE_EMOJI: Record<string, string> = {
  court_explorer: "🏟️",
  streak_3: "🔥",
  streak_7: "🔥",
  streak_30: "🔥",
  level_up: "⬆️",
  first_game: "🏀",
  first_win: "🏆",
  winner: "🏆",
  mvp: "⭐",
  three_pointer: "🎯",
  assist_master: "🤝",
  rebound_king: "🛡️",
  all_star: "⭐",
};

export interface BadgeItem {
  id: string;
  badgeType: string;
  badgeName: string;
  /** ISO 문자열 */
  earnedAt: string;
}

export interface BadgesSideCardProps {
  badges: BadgeItem[];
}

/** YYYY.MM 포맷 — 시안 스타일 */
function fmtYearMonth(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}.${m}`;
}

export function BadgesSideCard({ badges }: BadgesSideCardProps) {
  // 최대 4개 (시안과 동일 2x2 그리드)
  const items = badges.slice(0, 4);

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "var(--ink)" }}>
        활동 뱃지
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {items.map((b) => (
          <div
            key={b.id}
            style={{
              padding: "10px 8px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              textAlign: "center",
            }}
            title={b.badgeName}
          >
            {/* 이모지 — badge_type 매핑 실패 시 🏅 폴백 */}
            <div style={{ fontSize: 22 }}>{BADGE_EMOJI[b.badgeType] ?? "🏅"}</div>
            {/* 이름 — 줄바꿈 허용, 최대 2줄 */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                marginTop: 2,
                color: "var(--ink)",
                lineHeight: 1.3,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {b.badgeName}
            </div>
            {/* 연월 — ff-mono */}
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
                marginTop: 2,
              }}
            >
              {fmtYearMonth(b.earnedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
