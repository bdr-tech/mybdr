"use client";

// 2026-04-22: Phase 2 GameResult v2 — MVP 배너
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L181~L190
// 팀컬러 원 + 이름 + 주요 스탯 라인
// D5 원칙: 프로필 링크 버튼 유지(users/[id] 존재). 단 user_id 가 MVP 응답에 없으므로
// 팀 색상 기반 원형 이니셜 배지만 렌더, 네비게이션 버튼은 일단 렌더 후 disabled 처리.

import type { MatchDataV2, MvpPlayerV2 } from "./game-result";

export function MvpBanner({ mvp, match }: { mvp: MvpPlayerV2; match: MatchDataV2 }) {
  // MVP 가 소속된 팀 색/정보 찾기
  const mvpTeam = mvp.team_id === match.home_team.id ? match.home_team : match.away_team;
  const teamColor = mvpTeam.color;

  // 야투율 문자열 — 0/0 이면 "0%" 대신 "-"
  const fgPct = mvp.fga > 0 ? Math.round((mvp.fgm / mvp.fga) * 100) : null;
  const tpPct = mvp.tpa > 0 ? Math.round((mvp.tpm / mvp.tpa) * 100) : null;
  // +/- 포맷 — 양수는 "+N", 음수는 그대로 "-N", 0은 "0"
  const pmStr = mvp.plus_minus > 0 ? `+${mvp.plus_minus}` : String(mvp.plus_minus);

  // 주요 스탯 라인 — 시안 L187 과 유사하게 구성
  const statLine = [
    `${mvp.pts}점`,
    `${mvp.ast}어시스트`,
    `${mvp.reb}리바운드`,
    `${mvp.stl}스틸`,
    pmStr,
    mvp.fga > 0 ? `야투 ${mvp.fgm}/${mvp.fga}${fgPct != null ? ` (${fgPct}%)` : ""}` : null,
    mvp.tpa > 0 ? `3점 ${mvp.tpm}/${mvp.tpa}${tpPct != null ? ` (${tpPct}%)` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="card"
      style={{
        padding: "16px 18px",
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
        // 시안 L182 — accent 컬러 12% 블렌드 그라디언트
        background: "linear-gradient(90deg, color-mix(in oklab, var(--accent) 12%, transparent), transparent)",
        borderRadius: 4,
        flexWrap: "wrap",
      }}
    >
      {/* 등번호 원형 배지 — 팀 색상 배경 */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: teamColor,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--ff-mono)",
          fontWeight: 800,
          fontSize: 14,
          flex: "0 0 auto",
        }}
      >
        #{mvp.jersey_number ?? "-"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--accent)",
            fontWeight: 800,
            letterSpacing: ".12em",
          }}
        >
          GAME MVP
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            margin: "2px 0",
            color: "var(--ink)",
          }}
        >
          {mvp.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            fontFamily: "var(--ff-mono)",
            lineHeight: 1.5,
            wordBreak: "keep-all",
          }}
        >
          {statLine}
        </div>
      </div>
    </div>
  );
}
