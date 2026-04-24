/* ============================================================
 * UpcomingGames — /profile v2 다가오는 일정 (1건)
 *
 * 왜:
 * - v2 Profile.jsx L85~99 "다가오는 일정" 섹션 재현. 원본은 GAMES.slice(0,3) 으로
 *   3건 렌더하나, PM 확정 D-P4: next_game API (실제 데이터 1건만) 사용.
 * - getProfile 이 돌려주는 nextGameApp 또는 apiSuccess 응답의 nextGame 재사용.
 *
 * 어떻게:
 * - 단일 행 카드: 72px D-N 표기 / 제목 + 장소·시간 / "참가확정" 배지.
 * - scheduled_at 을 KST 기준 D-N 으로 계산 (기존 teams-tournaments-card 로직 차용).
 * - 없으면 "예정된 경기 없음" empty state 1줄 (CardPanel 스타일 대신 간결 문구).
 * - Link 로 /games/[id] 이동 (id 는 uuid slice 8자 or raw id).
 * ============================================================ */

import Link from "next/link";

export interface UpcomingGame {
  /** 경기 ID (uuid 우선, 없으면 raw bigint 문자열) */
  id: string;
  title: string | null;
  /** ISO 문자열 */
  scheduledAt: string | null;
  venueName: string | null;
}

export interface UpcomingGamesProps {
  game: UpcomingGame | null;
}

/** KST 기준 오늘 자정부터의 일수 차이. 과거면 null. */
function calcDDay(scheduledAtIso: string): number | null {
  const target = new Date(scheduledAtIso);
  if (isNaN(target.getTime())) return null;

  // KST offset +09:00 으로 shift 후 날짜만 추출
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const nowKst = new Date(now.getTime() + KST_OFFSET_MS);
  const targetKst = new Date(target.getTime() + KST_OFFSET_MS);

  const todayKst = Date.UTC(
    nowKst.getUTCFullYear(),
    nowKst.getUTCMonth(),
    nowKst.getUTCDate(),
  );
  const targetDay = Date.UTC(
    targetKst.getUTCFullYear(),
    targetKst.getUTCMonth(),
    targetKst.getUTCDate(),
  );

  const diffDays = Math.round((targetDay - todayKst) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return null;
  return diffDays;
}

/** MM.DD 포맷 — 시안의 ff-mono D 컬럼용 */
function fmtMonthDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  // KST 로 표시 — Korea locale
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day}`;
}

/** HH:mm 포맷 */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${mi}`;
}

export function UpcomingGames({ game }: UpcomingGamesProps) {
  // dDay 없으면 (null / 과거) 빈 상태로 폴백
  const dDay = game?.scheduledAt ? calcDDay(game.scheduledAt) : null;

  return (
    <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
        다가오는 일정
      </h2>

      {game && game.scheduledAt && dDay !== null ? (
        // 행 1건 — 시안 구조: 72px / 1fr / auto
        <Link
          href={`/games/${game.id.length >= 8 ? game.id.slice(0, 8) : game.id}`}
          style={{
            display: "grid",
            gridTemplateColumns: "72px 1fr auto",
            gap: 14,
            padding: "12px 14px",
            background: "var(--bg-alt)",
            borderRadius: 6,
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          {/* 좌측: MM.DD (ff-mono, accent 색) */}
          <div
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
            }}
          >
            {fmtMonthDay(game.scheduledAt)}
          </div>
          {/* 중앙: 제목 + 장소 · 시간 */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: "var(--ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {game.title ?? "경기"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-dim)",
                marginTop: 2,
              }}
            >
              {[game.venueName, fmtTime(game.scheduledAt)].filter(Boolean).join(" · ")}
            </div>
          </div>
          {/* 우측: D-N 배지 (시안의 "참가확정" 대체 — 실 데이터가 "신청 상태" 이고, D-N 이 대시보드 의미) */}
          <span className="badge badge--ok">
            {dDay === 0 ? "D-DAY" : `D-${dDay}`}
          </span>
        </Link>
      ) : (
        // 빈 상태 — 시안에 없는 case 지만 필수 폴백
        <div
          style={{
            padding: "18px 14px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-mute)",
          }}
        >
          예정된 경기가 없습니다.
        </div>
      )}
    </div>
  );
}
