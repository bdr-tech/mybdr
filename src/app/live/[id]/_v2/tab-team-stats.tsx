"use client";

// 2026-04-22: Phase 2 GameResult v2 — 팀 비교 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L251~L266
// 팀별 스탯을 좌우 비교 그래프 행으로 표시
// D5 원칙: 페인트득점/패스트브레이크/벤치득점 생략 — PBP 에 is_fastbreak 필드는 있지만 신뢰도 낮음.
//         시안 12항목 중 9항목(야투/3점/자유투/리바/어시/스틸/블록/턴오버/파울) 유지.

import type { MatchDataV2, PlayerRowV2 } from "./game-result";

export function TabTeamStats({ match }: { match: MatchDataV2 }) {
  // 팀별 합계 집계
  const homeStats = aggregateTeam(match.home_players);
  const awayStats = aggregateTeam(match.away_players);

  // 표시할 스탯 라인 — 시안 L36~L49 중 DB 산출 가능한 9항목
  const statRows: StatRow[] = [
    {
      label: "야투",
      homeValue: `${homeStats.fgm}/${homeStats.fga} (${pct(homeStats.fgm, homeStats.fga)}%)`,
      awayValue: `${awayStats.fgm}/${awayStats.fga} (${pct(awayStats.fgm, awayStats.fga)}%)`,
      homeNum: homeStats.fgm,
      awayNum: awayStats.fgm,
    },
    {
      label: "3점",
      homeValue: `${homeStats.tpm}/${homeStats.tpa} (${pct(homeStats.tpm, homeStats.tpa)}%)`,
      awayValue: `${awayStats.tpm}/${awayStats.tpa} (${pct(awayStats.tpm, awayStats.tpa)}%)`,
      homeNum: homeStats.tpm,
      awayNum: awayStats.tpm,
    },
    {
      label: "자유투",
      homeValue: `${homeStats.ftm}/${homeStats.fta} (${pct(homeStats.ftm, homeStats.fta)}%)`,
      awayValue: `${awayStats.ftm}/${awayStats.fta} (${pct(awayStats.ftm, awayStats.fta)}%)`,
      homeNum: homeStats.ftm,
      awayNum: awayStats.ftm,
    },
    {
      label: "리바운드",
      homeValue: `${homeStats.reb} (O ${homeStats.oreb} · D ${homeStats.dreb})`,
      awayValue: `${awayStats.reb} (O ${awayStats.oreb} · D ${awayStats.dreb})`,
      homeNum: homeStats.reb,
      awayNum: awayStats.reb,
    },
    { label: "어시스트", homeValue: String(homeStats.ast), awayValue: String(awayStats.ast), homeNum: homeStats.ast, awayNum: awayStats.ast },
    { label: "스틸", homeValue: String(homeStats.stl), awayValue: String(awayStats.stl), homeNum: homeStats.stl, awayNum: awayStats.stl },
    { label: "블록", homeValue: String(homeStats.blk), awayValue: String(awayStats.blk), homeNum: homeStats.blk, awayNum: awayStats.blk },
    { label: "턴오버", homeValue: String(homeStats.to), awayValue: String(awayStats.to), homeNum: homeStats.to, awayNum: awayStats.to },
    { label: "파울", homeValue: String(homeStats.fouls), awayValue: String(awayStats.fouls), homeNum: homeStats.fouls, awayNum: awayStats.fouls },
  ];

  return (
    <div className="card" style={{ padding: "20px 22px", borderRadius: 4 }}>
      {/* 상단 팀 vs 팀 헤더 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 16,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, color: "var(--ink)" }}>{match.home_team.name}</div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
            }}
          >
            HOME
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--ink-dim)",
            fontWeight: 800,
            letterSpacing: ".1em",
            textAlign: "center",
          }}
        >
          VS
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 800, color: "var(--ink)" }}>{match.away_team.name}</div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
            }}
          >
            AWAY
          </div>
        </div>
      </div>

      {statRows.map((row) => (
        <StatCompareRow
          key={row.label}
          row={row}
          homeColor={match.home_team.color}
          awayColor={match.away_team.color}
        />
      ))}
    </div>
  );
}

interface StatRow {
  label: string;
  homeValue: string;
  awayValue: string;
  homeNum: number;
  awayNum: number;
}

// 팀 합계 집계용 타입
interface TeamAgg {
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fouls: number;
}

function aggregateTeam(players: PlayerRowV2[]): TeamAgg {
  const agg: TeamAgg = {
    fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
    oreb: 0, dreb: 0, reb: 0,
    ast: 0, stl: 0, blk: 0, to: 0, fouls: 0,
  };
  for (const p of players) {
    agg.fgm += p.fgm;
    agg.fga += p.fga;
    agg.tpm += p.tpm;
    agg.tpa += p.tpa;
    agg.ftm += p.ftm;
    agg.fta += p.fta;
    agg.oreb += p.oreb;
    agg.dreb += p.dreb;
    agg.reb += p.reb;
    agg.ast += p.ast;
    agg.stl += p.stl;
    agg.blk += p.blk;
    agg.to += p.to;
    agg.fouls += p.fouls;
  }
  return agg;
}

function pct(made: number, attempt: number): number {
  if (attempt === 0) return 0;
  return Math.round((made / attempt) * 100);
}

// 좌/우 비교 바 행 — 시안 StatRow (L64~L85)
function StatCompareRow({
  row,
  homeColor,
  awayColor,
}: {
  row: StatRow;
  homeColor: string;
  awayColor: string;
}) {
  const total = row.homeNum + row.awayNum || 1;
  const homeWin = row.homeNum >= row.awayNum;
  const awayWin = row.awayNum >= row.homeNum;
  const homePct = (row.homeNum / total) * 100;
  const awayPct = (row.awayNum / total) * 100;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 110px 1fr",
        gap: 10,
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* 좌: 홈팀 값 + 막대 */}
      <div
        style={{
          textAlign: "right",
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "flex-end",
        }}
      >
        <span
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            fontWeight: homeWin ? 700 : 500,
            color: homeWin ? homeColor : "var(--ink-soft)",
            whiteSpace: "nowrap",
          }}
        >
          {row.homeValue}
        </span>
        <div
          style={{
            flex: "0 0 60px",
            height: 5,
            background: "var(--bg-alt)",
            borderRadius: 3,
            overflow: "hidden",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ width: `${homePct}%`, height: "100%", background: homeColor }} />
        </div>
      </div>

      {/* 중앙 라벨 */}
      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          color: "var(--ink-dim)",
          fontWeight: 700,
          letterSpacing: ".08em",
        }}
      >
        {row.label}
      </div>

      {/* 우: 원정팀 막대 + 값 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            flex: "0 0 60px",
            height: 5,
            background: "var(--bg-alt)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div style={{ width: `${awayPct}%`, height: "100%", background: awayColor }} />
        </div>
        <span
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            fontWeight: awayWin ? 700 : 500,
            color: awayWin ? awayColor : "var(--ink-soft)",
            whiteSpace: "nowrap",
          }}
        >
          {row.awayValue}
        </span>
      </div>
    </div>
  );
}
