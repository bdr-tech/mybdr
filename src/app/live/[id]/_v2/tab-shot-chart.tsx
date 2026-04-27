"use client";

// 2026-04-22: Phase 2 GameResult v2 — 샷차트 탭
// D2-B 확정: 탭 유지. "샷차트 준비 중" 안내 카드 + 코트 SVG 배경만 렌더.
// PBP.court_x / court_y 가 있으나 녹화 앱이 아직 채우지 않아 전부 null.
// 향후 DB 채워지면 shots 배열 map 으로 확장 가능한 구조로 둠.

import type { MatchDataV2 } from "./game-result";

export function TabShotChart({ match }: { match: MatchDataV2 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
      }}
      className="gr-shotchart-grid"
    >
      <TeamCourt team={match.home_team} />
      <TeamCourt team={match.away_team} />

      {/* 하단 전체폭 안내 카드 */}
      <div
        className="card"
        style={{
          gridColumn: "1 / -1",
          padding: "16px 20px",
          background: "color-mix(in oklab, var(--accent) 6%, transparent)",
          borderLeft: "3px solid var(--accent)",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--accent)",
            fontWeight: 800,
            letterSpacing: ".1em",
            marginBottom: 4,
          }}
        >
          샷차트 준비 중
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            lineHeight: 1.6,
          }}
        >
          슛 좌표(court_x, court_y) 기록 기능이 앱에 반영되면 이 화면에 자동으로 성공/실패 마커가
          표시됩니다.
        </div>
      </div>

      {/* 모바일: 1열로 전환 */}
      <style jsx>{`
        @media (max-width: 720px) {
          .gr-shotchart-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function TeamCourt({ team }: { team: MatchDataV2["home_team"] }) {
  return (
    <div className="card" style={{ padding: "18px 20px", borderRadius: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              width: 8,
              height: 22,
              background: team.color,
              borderRadius: 2,
            }}
          />
          <div style={{ fontWeight: 800, color: "var(--ink)" }}>{team.name}</div>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--ink-dim)",
            fontFamily: "var(--ff-mono)",
          }}
        >
          데이터 없음
        </div>
      </div>

      {/* 농구 코트 SVG — 시안 L321~L326 구조 */}
      <svg
        viewBox="0 0 300 280"
        style={{
          width: "100%",
          height: "auto",
          background: "#F5F0E8",
          borderRadius: 6,
          opacity: 0.55,
        }}
      >
        {/* 코트 외곽 */}
        <rect x="20" y="20" width="260" height="240" fill="none" stroke="#A08870" strokeWidth="2" />
        {/* 페인트존 */}
        <rect x="95" y="20" width="110" height="140" fill="none" stroke="#A08870" strokeWidth="2" />
        {/* 탑 서클 */}
        <circle cx="150" cy="20" r="22" fill="none" stroke="#A08870" strokeWidth="2" />
        {/* 자유투 서클 */}
        <circle cx="150" cy="160" r="18" fill="none" stroke="#A08870" strokeWidth="2" />
        {/* 3점 라인 */}
        <path
          d="M 50 20 Q 50 180 150 180 Q 250 180 250 20"
          fill="none"
          stroke="#A08870"
          strokeWidth="2"
        />
        {/* 골대 */}
        <circle cx="150" cy="30" r="5" fill={team.color} />
      </svg>

      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 8,
          fontSize: 10,
          color: "var(--ink-dim)",
          justifyContent: "center",
        }}
      >
        <span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              background: team.color,
              borderRadius: "50%",
              marginRight: 4,
            }}
          />
          성공
        </span>
        <span style={{ fontFamily: "var(--ff-mono)" }}>✕ 실패</span>
      </div>
    </div>
  );
}
