"use client";

// 2026-04-22: Phase 2 GameResult v2 — 요약 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L210~L249
// 좌: 경기 요약 내러티브 + 통계 3블록 / 우: TOP 퍼포머 4항목
// D5 원칙:
//  - 리드 변동/최다 점수차/동점 블록 생략 — PBP score_at_time 으로 계산은 가능하지만
//    시안 확정 우선순위 밖이라 생략. 대신 간단한 쿼터 요약 치환.
//  - 경기 내러티브(자동 생성 문장) 생략 — LLM/수작업 없이 채울 수 없음
//  - TOP 퍼포머 4항목은 playerStats 기반으로 계산 가능하므로 유지

import type { MatchDataV2, PlayerRowV2 } from "./game-result";

export function TabSummary({ match }: { match: MatchDataV2 }) {
  // TOP 퍼포머 계산 — 득점/리바/어시/스틸 각 1위
  const allPlayers = [...match.home_players, ...match.away_players].filter((p) => !p.dnp);
  const topScorer = maxByStat(allPlayers, (p) => p.pts);
  const topRebounder = maxByStat(allPlayers, (p) => p.reb);
  const topAssister = maxByStat(allPlayers, (p) => p.ast);
  const topStealer = maxByStat(allPlayers, (p) => p.stl);

  // 팀 판정 헬퍼 — player.team_id 로 홈/원정 태그 반환
  const teamTag = (teamId: number): string => {
    if (teamId === match.home_team.id) return match.home_team.name;
    if (teamId === match.away_team.id) return match.away_team.name;
    return "";
  };

  // 쿼터 스코어 간단 요약 — 쿼터별 승자 카운트
  const qs = match.quarter_scores;
  let homeQuarterWins = 0;
  let awayQuarterWins = 0;
  if (qs) {
    const quarters = [
      { h: qs.home.q1, a: qs.away.q1 },
      { h: qs.home.q2, a: qs.away.q2 },
      { h: qs.home.q3, a: qs.away.q3 },
      { h: qs.home.q4, a: qs.away.q4 },
      ...qs.home.ot.map((v, i) => ({ h: v, a: qs.away.ot[i] ?? 0 })),
    ];
    for (const q of quarters) {
      if (q.h > q.a) homeQuarterWins += 1;
      else if (q.a > q.h) awayQuarterWins += 1;
    }
  }

  const homeTotal = match.home_score;
  const awayTotal = match.away_score;
  const scoreDiff = Math.abs(homeTotal - awayTotal);
  const winnerName = homeTotal > awayTotal ? match.home_team.name : match.away_team.name;

  // 요약 블록 3종 — 시안 L218~L227 그대로. DB 없는 필드는 치환.
  const summaryBlocks = [
    { l: "점수차", v: `${scoreDiff}점` },
    { l: "쿼터 승", v: `${winnerName} ${homeTotal > awayTotal ? homeQuarterWins : awayQuarterWins}쿼터` },
    { l: "총 득점", v: `${homeTotal + awayTotal}점` },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) 1fr",
        gap: 18,
      }}
      className="gr-summary-grid"
    >
      <div className="card" style={{ padding: "18px 20px", borderRadius: 4 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          경기 요약
        </h3>
        {/* 내러티브 자리 — 단순한 요약 문장 (LLM 없이 조립) */}
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--ink-soft)",
          }}
        >
          {winnerName}이(가) {match.home_team.name} vs {match.away_team.name} 경기에서{" "}
          <b>
            {homeTotal}–{awayTotal}
          </b>
          로 {scoreDiff}점 차 승리를 거뒀다.
          {match.round_name ? ` ${match.round_name} 경기.` : ""}
        </p>

        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {summaryBlocks.map((s) => (
            <div
              key={s.l}
              style={{
                padding: "10px 12px",
                background: "var(--bg-alt)",
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--ink-dim)",
                  fontWeight: 800,
                  letterSpacing: ".1em",
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 16,
                  fontWeight: 900,
                  marginTop: 3,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: "18px 20px", borderRadius: 4 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          TOP 퍼포머
        </h3>
        <TopPerformerRow
          label="득점"
          player={topScorer}
          value={topScorer ? `${topScorer.pts}점` : null}
          teamName={topScorer ? teamTag(topScorer.team_id) : ""}
        />
        <TopPerformerRow
          label="리바운드"
          player={topRebounder}
          value={topRebounder ? `${topRebounder.reb}개` : null}
          teamName={topRebounder ? teamTag(topRebounder.team_id) : ""}
        />
        <TopPerformerRow
          label="어시스트"
          player={topAssister}
          value={topAssister ? `${topAssister.ast}개` : null}
          teamName={topAssister ? teamTag(topAssister.team_id) : ""}
        />
        <TopPerformerRow
          label="스틸"
          player={topStealer}
          value={topStealer ? `${topStealer.stl}개` : null}
          teamName={topStealer ? teamTag(topStealer.team_id) : ""}
        />
      </div>

      {/* 모바일: 1열 전환 */}
      <style jsx>{`
        @media (max-width: 720px) {
          .gr-summary-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function TopPerformerRow({
  label,
  player,
  value,
  teamName,
}: {
  label: string;
  player: PlayerRowV2 | null;
  value: string | null;
  teamName: string;
}) {
  if (!player || !value) {
    return (
      <div
        style={{
          padding: "8px 0",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--ink-dim)",
              fontWeight: 700,
              letterSpacing: ".08em",
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>—</div>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            color: "var(--ink-dim)",
            fontWeight: 700,
            letterSpacing: ".08em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
          {teamName && (
            <span
              style={{
                fontSize: 10,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
                marginLeft: 4,
                fontWeight: 500,
              }}
            >
              {teamName}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: 16,
          color: "var(--ink)",
          flex: "0 0 auto",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// 최대값 선수 반환 — 0 이하면 null
function maxByStat(players: PlayerRowV2[], fn: (p: PlayerRowV2) => number): PlayerRowV2 | null {
  let best: PlayerRowV2 | null = null;
  let bestVal = 0;
  for (const p of players) {
    const v = fn(p);
    if (v > bestVal) {
      bestVal = v;
      best = p;
    }
  }
  return best;
}
