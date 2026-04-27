"use client";

/* ============================================================
 * AwardsContent — /awards 클라이언트 본체
 *
 * 왜 클라이언트인가:
 * - 시안 (Awards.jsx) L4 React.useState('2026 Spring') — 시즌 셀렉터가 클라 인터랙션.
 * - 셀렉터 클릭 시 ?series=<slug> 로 router.push → 서버에서 재페치.
 *
 * 어떻게:
 * - props.data 로 page.tsx 에서 사전 페칭한 5블록(seasons/seasonMvp/finalsMvp/leaders/champions) 수신.
 * - 셀렉터는 useRouter / useSearchParams 로 URL 파라미터 동기화.
 * - DB 미지원 블록은 "준비 중" 빈 상태 카드로 렌더 (절대 숨기지 않음 — 사용자 원칙).
 * ============================================================ */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { AwardsDataDTO, PlayerRefDTO } from "../page";
import {
  HONOR_CATALOG,
  ALL_STAR_POSITIONS,
  ALL_STAR_GROUPS,
} from "./awards-catalog";

interface Props {
  data: AwardsDataDTO;
}

/** 팀 태그 자동 생성 — DB Team.tag 컬럼 미존재 폴백 (이름 첫 3글자 대문자) */
function teamTag(name: string | null | undefined): string {
  if (!name) return "—";
  const trimmed = name.trim();
  if (!trimmed) return "—";
  // 영문은 앞 3자, 한글은 앞 2자만 (시안 폴백 패턴과 동일)
  if (/^[a-zA-Z]/.test(trimmed)) {
    return trimmed.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  }
  return trimmed.slice(0, 2);
}

/** 메트릭 표시용 포맷 — null 이면 "—" */
function fmtMetric(v: number | null, suffix: string): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return `${v.toFixed(1)} ${suffix}`;
}

/** Honor 카드 데이터 매핑: kind → leader DTO */
function pickHonorPlayer(kind: string, data: AwardsDataDTO): PlayerRefDTO | null {
  switch (kind) {
    case "finals_mvp":
      return data.finalsMvp;
    case "scoring_leader":
      return data.scoringLeader;
    case "assists_leader":
      return data.assistsLeader;
    case "rebounds_leader":
      return data.reboundsLeader;
    default:
      return null; // coach_of_year / new_face → DB 미지원
  }
}

export function AwardsContent({ data }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 시즌 셀렉터 onClick 핸들러 — ?series=<slug> 로 URL 동기화
  // 왜 router.push 인가: 서버 컴포넌트가 다시 페치되도록 하기 위해.
  const handleSeasonChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("series");
    } else {
      params.set("series", slug);
    }
    const query = params.toString();
    router.push(`/awards${query ? "?" + query : ""}`);
  };

  const mvp = data.seasonMvp;
  const mvpPlayer = mvp?.player ?? null;

  return (
    <div className="page">
      {/* Breadcrumb — 시안 L52-55 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <Link href="/" style={{ cursor: "pointer" }}>
          홈
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>수상·아카이브</span>
      </div>

      {/* Season picker — 시안 L57-71 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div className="eyebrow">AWARDS · 수상 아카이브</div>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.025em",
              fontFamily: "var(--ff-display)",
            }}
          >
            {data.currentSeasonLabel}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: "var(--bg-alt)",
            borderRadius: 6,
            flexWrap: "wrap",
          }}
        >
          {data.seasons.map((s) => {
            const active = s.slug === data.currentSeasonSlug;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => handleSeasonChange(s.slug)}
                style={{
                  padding: "6px 12px",
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--bg)" : "var(--ink-mute)",
                  border: 0,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 4,
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* MVP hero + 팀 레이팅 — 시안 L73-117 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 340px",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* 시즌 MVP Hero — 데이터 있으면 그라디언트, 없으면 빈 카드 */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            // 우승팀 컬러 그라디언트. 미지원이면 BDR 디폴트.
            background: mvpPlayer
              ? `linear-gradient(135deg, ${mvpPlayer.teamColor || "#0F5FCC"} 0%, #000 110%)`
              : "var(--bg-alt)",
            color: mvpPlayer ? "#fff" : "var(--ink)",
            minHeight: 240,
          }}
        >
          {mvpPlayer ? (
            <div
              style={{
                padding: "36px 40px",
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 24,
                alignItems: "center",
              }}
            >
              {/* MVP 이니셜/트로피 자리 — DB 이미지 미사용, 트로피 이모지 fallback */}
              <div
                style={{
                  width: 140,
                  height: 140,
                  background: "rgba(255,255,255,.08)",
                  border: "2px solid rgba(255,255,255,.25)",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontSize: 48,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                  }}
                >
                  🏆
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: ".2em",
                    opacity: 0.75,
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  시즌 MVP
                </div>
                <div
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontSize: 56,
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    margin: "8px 0 6px",
                  }}
                >
                  {mvpPlayer.name}
                </div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>
                  <span
                    style={{
                      background: "rgba(255,255,255,.15)",
                      padding: "2px 8px",
                      borderRadius: 3,
                      fontFamily: "var(--ff-mono)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: ".06em",
                      marginRight: 8,
                    }}
                  >
                    {teamTag(mvpPlayer.teamName)}
                  </span>
                  {mvpPlayer.teamName ?? "—"}
                  {mvpPlayer.position ? ` · ${mvpPlayer.position}` : ""}
                </div>
                {/* 4개 스탯 셀 (PPG/APG/RPG/WIN%) — null 이면 "—" */}
                <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
                  {[
                    ["PPG", mvp?.ppg],
                    ["APG", mvp?.apg],
                    ["RPG", mvp?.rpg],
                    ["WIN%", mvp?.winPct],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div
                        style={{
                          fontFamily: "var(--ff-display)",
                          fontSize: 26,
                          fontWeight: 900,
                        }}
                      >
                        {val === null || val === undefined || isNaN(Number(val))
                          ? "—"
                          : Number(val).toFixed(1)}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          opacity: 0.65,
                          letterSpacing: ".08em",
                          fontWeight: 700,
                        }}
                      >
                        {label as string}
                      </div>
                    </div>
                  ))}
                </div>
                {/* MVP 코멘트 — DB 미지원 폴백 */}
                <p
                  style={{
                    margin: "16px 0 0",
                    fontSize: 13,
                    opacity: 0.85,
                    fontStyle: "italic",
                    borderLeft: "2px solid rgba(255,255,255,.4)",
                    paddingLeft: 10,
                  }}
                  title="MVP 코멘트 수집 준비 중"
                >
                  &ldquo;수상 코멘트는 준비 중입니다.&rdquo;
                </p>
              </div>
            </div>
          ) : (
            // MVP 데이터 없음 — 빈 상태
            <div
              style={{
                padding: "60px 40px",
                textAlign: "center",
                color: "var(--ink-mute)",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                시즌 MVP
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
                선정된 MVP가 없습니다
              </div>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                해당 시즌 종료 대회에 MVP가 등록되면 자동으로 표시됩니다.
              </p>
            </div>
          )}
        </div>

        {/* 올-시즌 팀 레이팅 — DB 미지원 → 빈 5행 placeholder */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              color: "var(--ink-dim)",
            }}
          >
            올-시즌 팀 레이팅
          </h3>
          {/* DB Team.rating 컬럼 미존재 — 5행 placeholder 카드 */}
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              color: "var(--ink-mute)",
              fontSize: 12,
            }}
            title="ELO 레이팅 시스템 도입 준비 중"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 28,
                color: "var(--ink-dim)",
                display: "block",
                marginBottom: 8,
              }}
            >
              query_stats
            </span>
            <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
              집계 준비 중
            </div>
            <div style={{ fontSize: 11 }}>
              팀 ELO 레이팅 시스템 도입 후 표시됩니다.
            </div>
          </div>
          {/* 빈 5행 dashed border placeholder — 시안 5행 형태 유지 */}
          {[1, 2, 3, 4, 5].map((rank, i) => (
            <div
              key={rank}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 40px 1fr auto auto",
                gap: 10,
                alignItems: "center",
                padding: "8px 0",
                borderBottom: i < 4 ? "1px dashed var(--border)" : 0,
                opacity: 0.4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--ff-display)",
                  fontWeight: 900,
                  color: "var(--ink-dim)",
                }}
              >
                {rank}
              </span>
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--ink-dim)",
                }}
              >
                —
              </span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-mute)" }}>
                —
              </span>
              <span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>—</span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--ff-mono)",
                  color: "var(--ink-dim)",
                  fontWeight: 700,
                  minWidth: 36,
                  textAlign: "right",
                }}
              >
                —
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Honor cards — 시안 L119-135 (3열 6카드) */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          margin: "0 0 12px",
        }}
      >
        주요 수상
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {HONOR_CATALOG.map((h) => {
          const player = pickHonorPlayer(h.kind, data);
          const isReady = !h.notReady; // notReady 표시되면 DB 미지원
          const tag = teamTag(player?.teamName);

          return (
            <div
              key={h.kind}
              className="card"
              style={{
                padding: "20px 22px",
                borderTop: `3px solid ${h.color}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: ".12em",
                  color: h.color,
                  textTransform: "uppercase",
                }}
              >
                {h.label}
              </div>

              {/* 데이터 있으면 선수 카드, 없으면 "준비 중" 빈 상태 */}
              {player && isReady ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        background: h.color,
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--ff-mono)",
                        fontSize: 11,
                        fontWeight: 800,
                        borderRadius: 4,
                      }}
                    >
                      {tag}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 16,
                          letterSpacing: "-0.01em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {player.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                        {player.teamName ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 10px",
                      background: "var(--bg-alt)",
                      borderRadius: 4,
                      fontFamily: "var(--ff-mono)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {/* finals_mvp 는 metricLabel 자체가 "31.0 PPG · 9.0 APG" 처럼 완성형 */}
                    {h.kind === "finals_mvp"
                      ? player.metricLabel
                      : fmtMetric(player.metricValue, player.metricLabel)}
                  </div>
                </>
              ) : (
                // 빈 상태 — 시안 카드 높이 유지
                <div
                  style={{
                    marginTop: 10,
                    padding: "20px 0",
                    textAlign: "center",
                    color: "var(--ink-mute)",
                    fontSize: 12,
                  }}
                  title={h.notReady ?? "데이터 없음"}
                >
                  <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                    {h.notReady ?? "수상자가 없습니다"}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    {h.notReady
                      ? "추후 시스템 도입 후 표시됩니다."
                      : "해당 시즌 데이터 없음"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All-star teams — 시안 L137-157 (1st/2nd 그룹 × 5포지션) */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          margin: "0 0 12px",
        }}
      >
        올-스타 팀
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {ALL_STAR_GROUPS.map((group) => (
          <div key={group.id} className="card" style={{ padding: "20px 22px" }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                fontWeight: 800,
                color: group.color,
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              {group.label}
            </div>
            {/* DB 미지원 → 5포지션 모두 "준비 중" 슬롯 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
              }}
            >
              {ALL_STAR_POSITIONS.map((pos) => (
                <div
                  key={pos}
                  style={{
                    textAlign: "center",
                    padding: "12px 6px",
                    background: "var(--bg-alt)",
                    borderRadius: 6,
                    opacity: 0.5,
                  }}
                  title="올-스타 선정 시스템 준비 중"
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--ff-mono)",
                      color: group.color,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                    }}
                  >
                    {pos}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      marginTop: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--ink-mute)",
                    }}
                  >
                    —
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-dim)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    준비 중
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                background: "var(--bg)",
                borderRadius: 4,
                fontSize: 11,
                color: "var(--ink-mute)",
                textAlign: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 14,
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              >
                schedule
              </span>
              올-스타 선정 시스템 준비 중
            </div>
          </div>
        ))}
      </div>

      {/* Champions list — 시안 L159-175 */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          margin: "0 0 12px",
        }}
      >
        역대 우승팀
      </h2>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          className="board__head"
          style={{ gridTemplateColumns: "110px 1fr 1.2fr 1.2fr 80px 1fr" }}
        >
          <div>시즌</div>
          <div style={{ textAlign: "left" }}>대회</div>
          <div style={{ textAlign: "left" }}>우승</div>
          <div style={{ textAlign: "left" }}>준우승</div>
          <div>스코어</div>
          <div style={{ textAlign: "left" }}>MVP</div>
        </div>
        {data.champions.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--ink-mute)",
              fontSize: 14,
            }}
          >
            우승팀 기록이 아직 없습니다.
          </div>
        ) : (
          data.champions.map((c, i) => (
            <div
              key={i}
              className="board__row"
              style={{ gridTemplateColumns: "110px 1fr 1.2fr 1.2fr 80px 1fr" }}
            >
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  color: "var(--ink-dim)",
                  fontSize: 12,
                }}
              >
                {c.seasonLabel}
              </div>
              <div className="title">{c.tournamentName}</div>
              <div className="title">
                <span style={{ color: "var(--accent)", marginRight: 4 }}>🏆</span>
                <b>{c.championName ?? "—"}</b>
              </div>
              <div className="title" style={{ color: "var(--ink-mute)" }}>
                {c.runnerUpName ?? "—"}
              </div>
              <div style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>
                {c.finalScore ?? "—"}
              </div>
              <div
                className="title"
                style={{ fontFamily: "var(--ff-mono)", fontSize: 12 }}
              >
                {c.finalsMvpName ?? "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
