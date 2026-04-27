"use client";

// 2026-04-22: Phase 2 GameResult v2 — 개인 기록 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L268~L287
// 팀별 박스스코어 테이블 (No / 선수 / POS / MIN / PTS / REB / AST / STL / BLK / TOV / PF / FG / 3P / FT / +/-)
// D5 원칙:
//  - POS (포지션): tournamentTeamPlayer 에 position 필드 없음 → 생략 (14컬럼 유지)
//  - 시안 star 표시: MVP 플레이어 id 매칭으로 star 표시

import type { MatchDataV2, MvpPlayerV2, PlayerRowV2 } from "./game-result";

export function TabPlayers({ match }: { match: MatchDataV2 }) {
  const mvpId = match.mvp_player?.id ?? null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <TeamTable
        team={match.home_team}
        score={match.home_score}
        players={match.home_players}
        mvpId={mvpId}
      />
      <TeamTable
        team={match.away_team}
        score={match.away_score}
        players={match.away_players}
        mvpId={mvpId}
      />
    </div>
  );
}

function TeamTable({
  team,
  score,
  players,
  mvpId,
}: {
  team: MatchDataV2["home_team"];
  score: number;
  players: PlayerRowV2[];
  mvpId: number | null;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      {/* 팀 헤더 — 이름 + 스코어 */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: `color-mix(in oklab, ${team.color} 10%, transparent)`,
        }}
      >
        <div
          style={{
            width: 6,
            height: 28,
            background: team.color,
            borderRadius: 2,
          }}
        />
        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>{team.name}</div>
        <div
          style={{
            marginLeft: "auto",
            fontFamily: "var(--ff-display)",
            fontWeight: 900,
            fontSize: 22,
            color: team.color,
          }}
        >
          {score}
        </div>
      </div>

      {/* 테이블 — 가로 스크롤 지원 */}
      <div style={{ overflowX: "auto" }}>
        {/* 헤더 행 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr 42px 50px 40px 40px 40px 40px 40px 40px 56px 56px 56px 50px",
            gap: 6,
            padding: "8px 10px",
            background: "var(--bg-alt)",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--ink-dim)",
            letterSpacing: ".06em",
            minWidth: 860,
          }}
        >
          <span>#</span>
          <span>선수</span>
          <span>MIN</span>
          <span style={{ color: team.color, fontWeight: 800 }}>PTS</span>
          <span>REB</span>
          <span>AST</span>
          <span>STL</span>
          <span>BLK</span>
          <span>TOV</span>
          <span>PF</span>
          <span>FG</span>
          <span>3P</span>
          <span>FT</span>
          <span>+/-</span>
        </div>

        {players.map((p, i) => (
          <PlayerRow
            key={p.id}
            player={p}
            teamColor={team.color}
            isLast={i === players.length - 1}
            isMvp={mvpId !== null && p.id === mvpId}
          />
        ))}

        {players.length === 0 && (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--ink-dim)",
            }}
          >
            기록된 선수가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  teamColor,
  isLast,
  isMvp,
}: {
  player: PlayerRowV2;
  teamColor: string;
  isLast: boolean;
  isMvp: boolean;
}) {
  // DNP 는 모든 스탯 자리에 "-" 표시 (NBA 컨벤션)
  const dnp = player.dnp === true;
  // MIN 포맷 — 초 단위 → "MM:SS"
  const minStr = dnp ? "DNP" : formatMin(player.min_seconds ?? (player.min * 60));

  // +/- 부호
  const pm = player.plus_minus ?? 0;
  const pmStr = pm > 0 ? `+${pm}` : String(pm);

  const cellBase = {
    fontFamily: "var(--ff-mono)",
    fontSize: 11,
    color: "var(--ink)",
  } as const;

  if (dnp) {
    // DNP 행 — 배경 어둡게, 대부분 "-"
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 42px 50px 40px 40px 40px 40px 40px 40px 56px 56px 56px 50px",
          gap: 6,
          padding: "10px",
          fontSize: 11,
          borderBottom: isLast ? 0 : "1px solid var(--border)",
          alignItems: "center",
          minWidth: 860,
          background: "var(--bg-alt)",
          opacity: 0.6,
        }}
      >
        <span style={{ color: "var(--ink-dim)", fontWeight: 700 }}>
          {player.jersey_number ?? "-"}
        </span>
        <span
          style={{
            fontFamily: "var(--ff-sans)",
            fontWeight: 500,
            color: "var(--ink-soft)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
        </span>
        <span style={cellBase}>DNP</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
        <span style={cellBase}>-</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr 42px 50px 40px 40px 40px 40px 40px 40px 56px 56px 56px 50px",
        gap: 6,
        padding: "10px",
        fontSize: 11,
        borderBottom: isLast ? 0 : "1px solid var(--border)",
        alignItems: "center",
        minWidth: 860,
      }}
    >
      <span style={{ color: "var(--ink-dim)", fontWeight: 700, fontFamily: "var(--ff-mono)" }}>
        {player.jersey_number ?? "-"}
      </span>
      <span
        style={{
          fontFamily: "var(--ff-sans)",
          fontWeight: 700,
          color: "var(--ink)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isMvp && <span style={{ color: "var(--accent)", marginRight: 4 }}>★</span>}
        {player.name}
      </span>
      <span style={cellBase}>{minStr}</span>
      <span
        style={{
          color: teamColor,
          fontWeight: 800,
          fontSize: 12,
          fontFamily: "var(--ff-mono)",
        }}
      >
        {player.pts}
      </span>
      <span style={cellBase}>{player.reb}</span>
      <span style={cellBase}>{player.ast}</span>
      <span style={cellBase}>{player.stl}</span>
      <span style={cellBase}>{player.blk}</span>
      <span
        style={{
          ...cellBase,
          color: player.to > 2 ? "var(--err, var(--error, #ef4444))" : "var(--ink)",
        }}
      >
        {player.to}
      </span>
      <span style={cellBase}>{player.fouls}</span>
      <span style={cellBase}>
        {player.fgm}/{player.fga}
      </span>
      <span style={cellBase}>
        {player.tpm}/{player.tpa}
      </span>
      <span style={cellBase}>
        {player.ftm}/{player.fta}
      </span>
      <span
        style={{
          ...cellBase,
          color: pm > 0 ? "var(--ok, #10B981)" : pm < 0 ? "var(--err, #ef4444)" : "var(--ink)",
          fontWeight: 700,
        }}
      >
        {pmStr}
      </span>
    </div>
  );
}

// 초 → "MM:SS"
function formatMin(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
