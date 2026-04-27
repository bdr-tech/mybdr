"use client";

// 2026-04-22: Phase 2 GameResult v2 — 타임라인 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L289~L308
// play_by_plays 기반 경기 이벤트 역순 표시 (쿼터 + 게임클럭 + 팀 배지 + 설명)
// D5 원칙:
//  - 자동 내러티브 body 문장 생성은 action_type 매핑 테이블로 조립
//  - PBP 필드에 아이콘 매핑(🛡/🎯/💥) 없음 → 생략
//  - "big" 플래그(중요 이벤트 하이라이트) 없음 → 생략

import type { MatchDataV2, PlayByPlayRowV2 } from "./game-result";

export function TabTimeline({ match }: { match: MatchDataV2 }) {
  const events = match.play_by_plays ?? [];

  if (events.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "32px 24px",
          textAlign: "center",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-dim)",
            lineHeight: 1.6,
          }}
        >
          이 경기에는 play-by-play 기록이 없습니다.
          <br />
          (최종 스탯 입력 모드로 기록된 경기일 수 있습니다)
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "18px 22px", borderRadius: 4 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
        경기 타임라인
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {events.map((e) => (
          <TimelineRow key={e.id} event={e} match={match} />
        ))}
      </div>
    </div>
  );
}

function TimelineRow({ event, match }: { event: PlayByPlayRowV2; match: MatchDataV2 }) {
  const isHome = event.team_id === match.home_team.id;
  const isAway = event.team_id === match.away_team.id;
  const teamTag = isHome
    ? match.home_team.name
    : isAway
      ? match.away_team.name
      : "";
  const teamColor = isHome ? match.home_team.color : isAway ? match.away_team.color : "var(--ink-dim)";

  const body = formatEventBody(event);
  const clockStr = formatGameClock(event.game_clock_seconds);
  const qLabel = event.quarter <= 4 ? `Q${event.quarter}` : `OT${event.quarter - 4}`;

  // 득점 이벤트는 굵게 강조
  const isScore = event.is_made === true && event.points_scored > 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "70px 60px 1fr",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        alignItems: "center",
        background: isScore ? "color-mix(in oklab, var(--accent) 4%, transparent)" : "transparent",
      }}
    >
      <div
        style={{
          fontFamily: "var(--ff-mono)",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--ink-dim)",
        }}
      >
        {qLabel} {clockStr}
      </div>
      <div>
        {teamTag && (
          <span
            style={{
              background: teamColor,
              color: "#fff",
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 3,
              fontWeight: 700,
              display: "inline-block",
              maxWidth: 56,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {teamTag}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: isScore ? 700 : 500,
          color: "var(--ink)",
        }}
      >
        {body}
      </div>
    </div>
  );
}

// action_type/subtype → 한국어 설명
function formatEventBody(e: PlayByPlayRowV2): string {
  const name = e.player_name || `#${e.jersey_number ?? "-"}`;
  const made = e.is_made === true;
  const missed = e.is_made === false;
  const pts = e.points_scored;
  const sub = e.action_subtype ?? "";
  const isThree = sub === "3pt" || pts === 3;
  const isTwo = sub === "2pt" || pts === 2;

  switch (e.action_type) {
    case "shot":
    case "made_shot":
      if (made) {
        if (isThree) return `${name} 3점 성공 (+3)`;
        if (isTwo) return `${name} 2점 성공 (+2)`;
        return `${name} ${pts}점 성공`;
      }
      return `${name} 슛`;
    case "missed_shot":
      if (isThree) return `${name} 3점 실패`;
      if (isTwo) return `${name} 2점 실패`;
      return `${name} 슛 실패`;
    case "free_throw":
      return made ? `${name} 자유투 성공 (+1)` : `${name} 자유투 실패`;
    case "rebound":
      if (sub === "offensive") return `${name} 공격 리바운드`;
      if (sub === "defensive") return `${name} 수비 리바운드`;
      return `${name} 리바운드`;
    case "assist":
      return `${name} 어시스트`;
    case "steal":
      return `${name} 스틸`;
    case "block":
      return `${name} 블록`;
    case "turnover":
      return `${name} 턴오버`;
    case "foul":
    case "foul_personal":
      return `${name} 파울`;
    case "foul_technical":
      return `${name} 테크니컬 파울`;
    case "substitution":
      return `${name} 교체`;
    case "timeout":
      return `타임아웃`;
    case "team_foul":
      return `팀 파울`;
    case "jump_ball":
      return `점프볼`;
    default:
      if (missed) return `${name} ${e.action_type} 실패`;
      if (made) return `${name} ${e.action_type} 성공`;
      return `${name} ${e.action_type}`;
  }
}

// 초 → "M:SS" (게임클럭)
function formatGameClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
