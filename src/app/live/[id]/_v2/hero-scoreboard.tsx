"use client";

// 2026-04-22: Phase 2 GameResult v2 — Hero 스코어보드
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L118~L179
// 어두운 그라디언트 카드 + 팀명/큰 스코어(96px)/WINNER 라벨 + 쿼터 스코어 표
// D5 원칙(DB 없는 필드 생략):
//  - 시드 (e.g. "#1 SEED") 생략 — tournament_teams 에 seed 필드 없음
//  - 팀 전적 (e.g. "15W 4L · 1684") 생략 — 경기별 시점 전적 미산출
//  - 관중수 412명 생략 — DB 필드 없음
//  - 하이라이트/공유/기록지 버튼 생략 — 기능 없음

import type { MatchDataV2 } from "./game-result";

export function HeroScoreboard({ match }: { match: MatchDataV2 }) {
  const homeScore = match.home_score;
  const awayScore = match.away_score;
  const homeWin = homeScore > awayScore;
  const awayWin = awayScore > homeScore;

  // 쿼터 스코어 배열 구성 — Q1~Q4 + OT (있는 경우만)
  const qs = match.quarter_scores;
  const quarters: { label: string; home: number; away: number }[] = [
    { label: "Q1", home: qs?.home.q1 ?? 0, away: qs?.away.q1 ?? 0 },
    { label: "Q2", home: qs?.home.q2 ?? 0, away: qs?.away.q2 ?? 0 },
    { label: "Q3", home: qs?.home.q3 ?? 0, away: qs?.away.q3 ?? 0 },
    { label: "Q4", home: qs?.home.q4 ?? 0, away: qs?.away.q4 ?? 0 },
    ...(qs?.home.ot ?? []).map((v, i) => ({
      label: `OT${i + 1}`,
      home: v,
      away: qs?.away.ot?.[i] ?? 0,
    })),
  ];

  // 경기 일시 포맷 — "YYYY.MM.DD (요일) HH:MM"
  // scheduled_at 우선, 없으면 started_at, 둘 다 없으면 빈 문자열
  const isoStr = match.scheduled_at ?? match.started_at ?? null;
  const dateLine = isoStr ? formatMatchDate(isoStr) : "";

  // 라운드명이 있으면 tournament_name 뒤에 " · {round}" 형태로 붙임 (시안 L123 참조)
  const tournamentLine = match.round_name
    ? `${match.tournament_name} · ${match.round_name}`
    : match.tournament_name;

  return (
    <div
      className="card"
      style={{
        padding: "32px 24px",
        marginBottom: 18,
        // 어두운 그라디언트 배경 — 시안 L118
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      {/* 장식용 radial gradient 오버레이 — 시안 L119 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(220,38,38,.2), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(15,95,204,.2), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        {/* 상단 배지 — FINAL + 토너먼트/라운드 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <span
            style={{
              background: "rgba(16,185,129,.2)",
              color: "#10B981",
              border: "1px solid #10B981",
              fontSize: 10,
              padding: "3px 10px",
              borderRadius: 3,
              fontWeight: 700,
              letterSpacing: ".1em",
            }}
          >
            경기종료 · FINAL
          </span>
          {tournamentLine && (
            <span
              style={{
                background: "rgba(255,255,255,.15)",
                color: "#fff",
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 3,
                fontWeight: 700,
                letterSpacing: ".1em",
              }}
            >
              {tournamentLine}
            </span>
          )}
        </div>

        {/* 날짜/장소 라인 */}
        {(dateLine || match.venue_name) && (
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              opacity: 0.7,
              fontFamily: "var(--ff-mono)",
              marginBottom: 16,
            }}
          >
            {dateLine}
            {dateLine && match.venue_name ? " · " : ""}
            {match.venue_name ?? ""}
          </div>
        )}

        {/* 팀 스코어 3단 그리드 — 홈 / VS / 원정 */}
        {/* 모바일에서 가독성을 위해 세로 스택으로 전환 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 16,
            alignItems: "center",
          }}
        >
          {/* 홈팀 — 우측 정렬 */}
          <TeamScoreBlock
            team={match.home_team}
            score={homeScore}
            isWinner={homeWin}
            align="right"
          />

          {/* 중앙 구분선 — "–" + FINAL 라벨 */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 40,
                fontWeight: 900,
                opacity: 0.4,
              }}
            >
              –
            </div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.6,
                fontFamily: "var(--ff-mono)",
                letterSpacing: ".15em",
                marginTop: 6,
              }}
            >
              FINAL
            </div>
          </div>

          {/* 원정팀 — 좌측 정렬 */}
          <TeamScoreBlock
            team={match.away_team}
            score={awayScore}
            isWinner={awayWin}
            align="left"
          />
        </div>

        {/* 쿼터 스코어 표 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `1fr repeat(${quarters.length}, 56px) 60px`,
            gap: 6,
            marginTop: 24,
            padding: "12px 16px",
            background: "rgba(255,255,255,.08)",
            borderRadius: 6,
            overflow: "auto",
          }}
        >
          {/* 첫 행 — 헤더 (빈칸 + Q1~Q4 + TOTAL) */}
          <div />
          {quarters.map((q) => (
            <div
              key={`h-${q.label}`}
              style={{
                textAlign: "center",
                fontSize: 11,
                opacity: 0.7,
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
              }}
            >
              {q.label}
            </div>
          ))}
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              fontWeight: 800,
            }}
          >
            TOTAL
          </div>

          {/* 홈팀 행 */}
          <div style={{ fontSize: 12, fontWeight: 700, color: match.home_team.color }}>
            {match.home_team.name}
          </div>
          {quarters.map((q) => (
            <div
              key={`home-${q.label}`}
              style={{
                textAlign: "center",
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 15,
                color: q.home > q.away ? match.home_team.color : "rgba(255,255,255,.6)",
              }}
            >
              {q.home}
            </div>
          ))}
          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 17,
              color: match.home_team.color,
            }}
          >
            {homeScore}
          </div>

          {/* 원정팀 행 */}
          <div style={{ fontSize: 12, fontWeight: 700, color: match.away_team.color }}>
            {match.away_team.name}
          </div>
          {quarters.map((q) => (
            <div
              key={`away-${q.label}`}
              style={{
                textAlign: "center",
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 15,
                color: q.away > q.home ? match.away_team.color : "rgba(255,255,255,.6)",
              }}
            >
              {q.away}
            </div>
          ))}
          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 17,
            }}
          >
            {awayScore}
          </div>
        </div>
      </div>
    </div>
  );
}

// 팀 + 스코어 단일 블록 — 좌/우 정렬만 다름
function TeamScoreBlock({
  team,
  score,
  isWinner,
  align,
}: {
  team: MatchDataV2["home_team"];
  score: number;
  isWinner: boolean;
  align: "left" | "right";
}) {
  return (
    <div style={{ textAlign: align, minWidth: 0 }}>
      {/* 팀명 */}
      <div
        style={{
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: 20,
          letterSpacing: "-0.02em",
          // 모바일 좁은 화면에서 팀명 긴 경우 말줄임
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {team.name}
      </div>
      {/* 큰 스코어 */}
      <div
        style={{
          fontFamily: "var(--ff-display)",
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: isWinner ? "#fff" : "rgba(255,255,255,.55)",
          lineHeight: 1,
          marginTop: 10,
        }}
      >
        {score}
      </div>
      {/* WINNER 라벨 — 승자만 */}
      {isWinner && (
        <div
          style={{
            color: "#10B981",
            fontWeight: 800,
            letterSpacing: ".15em",
            fontSize: 11,
            marginTop: 4,
          }}
        >
          WINNER
        </div>
      )}
    </div>
  );
}

// ISO 문자열 → "YYYY.MM.DD (요일) HH:MM"
// 이유: 시안 L125 과 동일한 포맷. 브라우저 로컬 타임존 기준.
function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  // 요일: 일월화수목금토
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const day = days[d.getDay()];
  return `${yyyy}.${mm}.${dd} (${day}) ${hh}:${mi}`;
}
