"use client";

import Link from "next/link";

/* ============================================================
 * V2 Team Board — 시안 충실 6열 보드
 *
 * 컬럼: 순위 / 팀 / 레이팅 / 승 / 패 / 승률
 * 시안에 ELO 기반 rating 컬럼이 있는데 DB에는 아직 없음 →
 * 임시로 wins 값을 레이팅 자리에 채워 넣는다.
 * 추후 teams.rating(ELO) 컬럼이 추가되면 그쪽으로 교체 예정.
 * (scratchpad "🚧 추후 구현 — Phase 5 Rank"에 기록)
 * ============================================================ */

// API 응답 항목 (apiSuccess가 snake_case로 변환된 형태)
export interface TeamRanking {
  rank: number;
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  city: string | null;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  member_count: number;
  tournaments_count: number;
}

interface V2TeamBoardProps {
  teams: TeamRanking[];
}

// 팀 색상 결정: 흰색이면 보조색 사용 (시인성 보존)
// 이유: primary_color에 #FFFFFF가 들어 있는 팀은 어두운 배경에서 보이지 않음
function resolveColor(primary: string | null, secondary?: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "var(--accent)";
  }
  return primary;
}

// 팀 태그 만들기: 팀명 첫 글자 (한글이든 영문이든)
// 이유: 시안의 22x22 색상 배지에 들어갈 짧은 식별자가 필요
function teamTag(name: string): string {
  return name?.[0] ?? "?";
}

export function V2TeamBoard({ teams }: V2TeamBoardProps) {
  return (
    <div className="board">
      {/* 헤더: grid-template-columns로 6열 정의 */}
      <div
        className="board__head"
        style={{ gridTemplateColumns: "64px 1fr 90px 90px 90px 90px" }}
      >
        <div>순위</div>
        <div>팀</div>
        <div>레이팅</div>
        <div>승</div>
        <div>패</div>
        <div>승률</div>
      </div>

      {/* 본문 행들 */}
      {teams.map((t, i) => {
        const color = resolveColor(t.primary_color, t.secondary_color);
        return (
          <div
            key={t.id}
            className="board__row"
            style={{ gridTemplateColumns: "64px 1fr 90px 90px 90px 90px" }}
          >
            {/* 순위 — 1~3위는 accent(BDR 레드)로 강조 */}
            <div
              className="num"
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 16,
                fontWeight: 900,
                color: i < 3 ? "var(--accent)" : "var(--ink-dim)",
              }}
            >
              {t.rank}
            </div>

            {/* 팀: 색상 배지 + 팀명 링크 */}
            <div className="title">
              <span
                style={{
                  width: 22,
                  height: 22,
                  background: color,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 3,
                  flexShrink: 0,
                }}
              >
                {teamTag(t.name)}
              </span>
              <Link href={`/teams/${t.id}`} style={{ fontWeight: 700 }}>
                {t.name}
              </Link>
            </div>

            {/* 레이팅 — DB rating 컬럼 없음. 임시로 wins 표시 */}
            <div style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>{t.wins}</div>

            {/* 승 — 성공 색상으로 강조 */}
            <div
              style={{
                color: "var(--ok)",
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
              }}
            >
              {t.wins}
            </div>

            {/* 패 — 회색 톤 */}
            <div
              style={{ color: "var(--ink-mute)", fontFamily: "var(--ff-mono)" }}
            >
              {t.losses}
            </div>

            {/* 승률 — API에서 0~100(정수) 그대로 옴 */}
            <div style={{ fontFamily: "var(--ff-mono)" }}>{t.win_rate}%</div>
          </div>
        );
      })}
    </div>
  );
}
