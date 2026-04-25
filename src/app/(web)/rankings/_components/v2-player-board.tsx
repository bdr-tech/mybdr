"use client";

import { useMemo } from "react";
import Link from "next/link";

/* ============================================================
 * V2 Player Board — 시안 충실 8열 보드 + 정렬 pills
 *
 * 컬럼: 순위 / 선수 / 팀 / PPG / APG / RPG / 레이팅 / 변동
 * - PPG/APG/RPG: API의 avg_points / total_assists / total_rebounds
 *   를 games_played로 나누어 클라에서 계산
 * - 레이팅: DB users.rating(ELO) 컬럼 없음 → "—"
 * - 변동: DB trend(지난주 대비) 없음 → "—"
 * (scratchpad "🚧 추후 구현 — Phase 5 Rank"에 기록)
 *
 * 정렬 pills로 4가지 기준(레이팅/PPG/APG/RPG) 전환.
 * 레이팅은 데이터가 없으니 정렬 클릭해도 API 순서(서버 rank) 유지.
 * ============================================================ */

// API 응답 항목 (apiSuccess가 snake_case로 변환된 형태)
export interface PlayerRanking {
  rank: number;
  user_id: string;
  name: string;
  team_name: string;
  games_played: number;
  total_points: number;
  avg_points: number;
  total_rebounds: number;
  total_assists: number;
}

// 정렬 키
export type PlayerSortKey = "rating" | "ppg" | "apg" | "rpg";

interface V2PlayerBoardProps {
  players: PlayerRanking[];
  sort: PlayerSortKey;
  onSortChange: (key: PlayerSortKey) => void;
}

// 0으로 나누기 방지 + 소수 1자리
// 이유: games_played가 0인 경우 NaN 방지
function perGame(total: number, games: number): number {
  if (!games || games <= 0) return 0;
  return Math.round((total / games) * 10) / 10;
}

export function V2PlayerBoard({ players, sort, onSortChange }: V2PlayerBoardProps) {
  // 클라 정렬: 레이팅이 아닌 경우만 PPG/APG/RPG 순으로 재정렬
  // 이유: API는 avg_points 기준 내림차순 → 레이팅(=avg_points 임시 대체) 정렬과 동일
  const sortedPlayers = useMemo(() => {
    if (sort === "rating") return players;
    const arr = [...players];
    if (sort === "ppg") {
      arr.sort((a, b) => b.avg_points - a.avg_points);
    } else if (sort === "apg") {
      arr.sort(
        (a, b) =>
          perGame(b.total_assists, b.games_played) -
          perGame(a.total_assists, a.games_played)
      );
    } else if (sort === "rpg") {
      arr.sort(
        (a, b) =>
          perGame(b.total_rebounds, b.games_played) -
          perGame(a.total_rebounds, a.games_played)
      );
    }
    return arr;
  }, [players, sort]);

  // 정렬 pill 정의
  const SORT_KEYS: { key: PlayerSortKey; label: string }[] = [
    { key: "rating", label: "레이팅" },
    { key: "ppg", label: "득점" },
    { key: "apg", label: "어시" },
    { key: "rpg", label: "리바" },
  ];

  return (
    <>
      {/* 정렬 pills (시안의 정렬 박스) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 10,
          alignItems: "center",
          padding: "10px 12px",
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-chip)",
        }}
      >
        <span style={{ color: "var(--ink-dim)", fontSize: 12, fontWeight: 600 }}>
          정렬
        </span>
        {SORT_KEYS.map(({ key, label }) => {
          const isActive = sort === key;
          return (
            <button
              key={key}
              onClick={() => onSortChange(key)}
              style={{
                padding: "4px 10px",
                border: 0,
                background: isActive ? "var(--cafe-blue-soft)" : "transparent",
                color: isActive ? "var(--cafe-blue-deep)" : "var(--ink-mute)",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 보드 */}
      <div className="board">
        <div
          className="board__head"
          style={{ gridTemplateColumns: "56px 1fr 72px 72px 72px 72px 80px 64px" }}
        >
          <div>순위</div>
          <div>선수</div>
          <div>팀</div>
          <div>PPG</div>
          <div>APG</div>
          <div>RPG</div>
          <div>레이팅</div>
          <div>변동</div>
        </div>

        {sortedPlayers.map((p, i) => {
          const ppg = p.avg_points;
          const apg = perGame(p.total_assists, p.games_played);
          const rpg = perGame(p.total_rebounds, p.games_played);

          return (
            <div
              key={p.user_id}
              className="board__row"
              style={{ gridTemplateColumns: "56px 1fr 72px 72px 72px 72px 80px 64px" }}
            >
              {/* 순위: 정렬 후 인덱스 기반 (1~3위 강조) */}
              <div
                className="num"
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 15,
                  fontWeight: 900,
                  color: i < 3 ? "var(--accent)" : "var(--ink-dim)",
                }}
              >
                {i + 1}
              </div>

              {/* 선수: 이니셜 원 + 이름 링크 */}
              <div className="title">
                <span
                  style={{
                    width: 22,
                    height: 22,
                    background: "var(--bg-alt)",
                    color: "var(--ink-soft)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                >
                  {p.name?.charAt(0) ?? "?"}
                </span>
                <Link href={`/users/${p.user_id}`} style={{ fontWeight: 600 }}>
                  {p.name}
                </Link>
              </div>

              {/* 팀명 (텍스트, 모노폰트) */}
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {p.team_name}
              </div>

              {/* PPG — 현재 정렬 기준이면 강조 */}
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontWeight: sort === "ppg" ? 800 : 500,
                  color: sort === "ppg" ? "var(--ink)" : "var(--ink-mute)",
                }}
              >
                {ppg}
              </div>

              {/* APG */}
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontWeight: sort === "apg" ? 800 : 500,
                  color: sort === "apg" ? "var(--ink)" : "var(--ink-mute)",
                }}
              >
                {apg}
              </div>

              {/* RPG */}
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontWeight: sort === "rpg" ? 800 : 500,
                  color: sort === "rpg" ? "var(--ink)" : "var(--ink-mute)",
                }}
              >
                {rpg}
              </div>

              {/* 레이팅 — DB 컬럼 없음 → "—" */}
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 800,
                  color: "var(--ink-dim)",
                }}
              >
                —
              </div>

              {/* 변동 — DB 컬럼 없음 → "—" */}
              <div style={{ color: "var(--ink-dim)", fontFamily: "var(--ff-mono)" }}>
                —
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
