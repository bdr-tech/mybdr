/* ============================================================
 * OverviewTab — /users/[id] v2 "개요" 탭
 *
 * 왜:
 * - v2 PlayerProfile.jsx L139~229 overview 탭 재현. PM 확정 D-P6:
 *   슛존/스카우팅 섹션 제거. 시즌 스탯 + 소속 팀 aside + 뱃지 aside 로 구성.
 *
 * 어떻게:
 * - 좌측 main: 시즌 스탯 카드 (6열 — 경기/승률/PPG/APG/RPG/BPG).
 *   /profile 의 SeasonStats 와 독립(data shape 다름 — "BPG" 포함). 재사용 안 함.
 * - 우측 aside: 소속 팀 카드 + 활동 요약 카드 + 뱃지 카드.
 *   · 활동 요약: "가입일 / 경기수 / 주최수" (v2 시안 의 "posts·joined·lastSeen" 대체).
 * - 전체 grid: 1fr 320px (main / aside).
 * ============================================================ */

import Link from "next/link";
import Image from "next/image";

/** 시즌 스탯 셀 데이터 — overview 탭 전용 6열 */
export interface OverviewSeasonStats {
  games: number;
  winRate: number | null;
  ppg: number | null;
  apg: number | null;
  rpg: number | null;
  /** BPG — career avgBlocks */
  bpg: number | null;
}

export interface OverviewTeam {
  id: string;
  name: string;
  primaryColor: string | null;
  logoUrl: string | null;
}

export interface OverviewBadge {
  id: string;
  badgeType: string;
  badgeName: string;
  earnedAt: string;
}

export interface OverviewActivitySummary {
  /** 가입일 ISO */
  joinedAt: string | null;
  /** 통산 경기 참가 수 */
  gamesPlayed: number;
  /** 주최 경기 수 */
  gamesHosted: number;
  /** 지난 로그인 (없으면 "-") */
  lastSeen: string | null;
}

export interface OverviewTabProps {
  stats: OverviewSeasonStats;
  teams: OverviewTeam[];
  badges: OverviewBadge[];
  activity: OverviewActivitySummary;
}

// badge_type → emoji (profile 쪽과 동일 매핑, 중복 수용)
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

function fmtAvg(v: number | null | undefined, digits = 1): string {
  if (v == null) return "-";
  return v.toFixed(digits);
}

function fmtWinRate(v: number | null): string {
  if (v == null) return "-";
  return `${Math.round(v)}%`;
}

function fmtYearMonthDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtYearMonth(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function OverviewTab({ stats, teams, badges, activity }: OverviewTabProps) {
  const seasonCells = [
    { label: "경기", value: stats.games > 0 ? stats.games.toString() : "-" },
    { label: "승률", value: fmtWinRate(stats.winRate) },
    { label: "PPG", value: fmtAvg(stats.ppg) },
    { label: "APG", value: fmtAvg(stats.apg) },
    { label: "RPG", value: fmtAvg(stats.rpg) },
    { label: "BPG", value: fmtAvg(stats.bpg) },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: 16,
      }}
    >
      {/* ========== 좌측 main ========== */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card" style={{ padding: "22px 24px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
            통산 시즌 스탯
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {seasonCells.map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  borderLeft: i > 0 ? "1px solid var(--border)" : 0,
                  background: "var(--bg-alt)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontWeight: 900,
                    fontSize: 24,
                    letterSpacing: "-0.01em",
                    color: "var(--ink)",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--ink-dim)",
                    fontWeight: 600,
                    letterSpacing: ".04em",
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== 우측 aside ========== */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 소속 팀 — 1개 이상일 때만 */}
        {teams.length > 0 && (
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              소속 팀
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teams.map((t) => {
                const tagInitial = t.name.trim().slice(0, 3).toUpperCase();
                const bg = t.primaryColor ?? "var(--accent)";
                return (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: 10,
                      background: "var(--bg-alt)",
                      borderRadius: 6,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        background: bg,
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--ff-mono)",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 4,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {t.logoUrl ? (
                        <Image
                          src={t.logoUrl}
                          alt={t.name}
                          width={36}
                          height={36}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        tagInitial
                      )}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.name}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 활동 요약 — 가입일 / 경기수 / 주최수 */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            활동
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--ink-soft)" }}>
            {activity.joinedAt && (
              <>
                가입일 ·{" "}
                <span style={{ fontFamily: "var(--ff-mono)" }}>
                  {fmtYearMonthDay(activity.joinedAt)}
                </span>
                <br />
              </>
            )}
            경기 참가 ·{" "}
            <b style={{ color: "var(--ink)" }}>{activity.gamesPlayed.toLocaleString()}</b>
            <br />
            {activity.gamesHosted > 0 && (
              <>
                주최 ·{" "}
                <b style={{ color: "var(--ink)" }}>
                  {activity.gamesHosted.toLocaleString()}
                </b>
                <br />
              </>
            )}
            {activity.lastSeen && (
              <>
                최근 접속 · {activity.lastSeen}
              </>
            )}
          </div>
        </div>

        {/* 뱃지 — 1개 이상일 때만 */}
        {badges.length > 0 && (
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              획득 뱃지
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {badges.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "12px 8px",
                    background: "var(--bg-alt)",
                    borderRadius: 6,
                    textAlign: "center",
                  }}
                  title={b.badgeName}
                >
                  <div style={{ fontSize: 22 }}>{BADGE_EMOJI[b.badgeType] ?? "🏅"}</div>
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
        )}
      </aside>
    </div>
  );
}
