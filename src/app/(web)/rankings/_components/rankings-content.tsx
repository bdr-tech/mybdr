"use client";

import { useState, useEffect } from "react";
import { BdrRankingTable } from "./bdr-ranking-table";
import { V2Podium } from "./v2-podium";
import { V2TeamBoard, type TeamRanking } from "./v2-team-board";
import {
  V2PlayerBoard,
  type PlayerRanking,
  type PlayerSortKey,
} from "./v2-player-board";

/* ============================================================
 * RankingsContent — V2 시안 충실 + 외부BDR 보존
 *
 * 시안 (Dev/design/BDR v2/screens/Rank.jsx) 기반으로
 * 토글 3종(팀/선수/외부BDR)으로 확장한 구조.
 *
 * - 팀/선수 탭: V2 포디움 + 보드 (시안 그대로)
 * - 외부BDR 탭: 기존 BdrRankingTable 보존(시즌/검색/일반·대학)
 *
 * API 변경 없음:
 *   - /api/web/rankings?type=team
 *   - /api/web/rankings?type=player
 *   - /api/web/rankings/bdr?division=...
 * ============================================================ */

// 토글 모드
type Mode = "team" | "player" | "bdr";

// 외부BDR 부 (탭 선택 후 추가 전환)
type BdrDivision = "general" | "university";

export function RankingsContent() {
  // 상위 토글 (팀/선수/외부BDR)
  const [mode, setMode] = useState<Mode>("team");
  // 외부BDR 부 (BDR 탭에서만 노출)
  const [bdrDivision, setBdrDivision] = useState<BdrDivision>("general");
  // 선수 보드 정렬 키
  const [playerSort, setPlayerSort] = useState<PlayerSortKey>("rating");

  // 데이터 상태
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
  const [playerRankings, setPlayerRankings] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);

  // 모드 변경 시 데이터 fetch
  // 이유: 외부BDR 탭은 BdrRankingTable이 자체적으로 fetch하므로
  //      여기서는 team/player만 처리한다.
  useEffect(() => {
    if (mode === "bdr") {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/web/rankings?type=${mode}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (mode === "team") {
          setTeamRankings(data.rankings ?? []);
        } else {
          setPlayerRankings(data.rankings ?? []);
        }
      })
      .catch(() => {
        if (mode === "team") setTeamRankings([]);
        else setPlayerRankings([]);
      })
      .finally(() => setLoading(false));
  }, [mode]);

  // 포디움 데이터 가공: 팀 / 선수 모드별
  // 이유: V2Podium 컴포넌트는 모드를 모르므로 순수한 PodiumItem만 받음
  const podiumItems = (() => {
    if (mode === "team") {
      return teamRankings.slice(0, 3).map((t) => ({
        rank: t.rank,
        accentColor:
          t.primary_color &&
          t.primary_color.toLowerCase() !== "#ffffff" &&
          t.primary_color.toLowerCase() !== "#fff"
            ? t.primary_color
            : t.secondary_color ?? "var(--accent)",
        displayName: t.name,
        // 시안 형식: "{tag} · {rating}" → 여기선 도시 + 승수로 대체
        meta: `${t.city ?? "지역 미설정"} · ${t.wins}승`,
      }));
    }
    if (mode === "player") {
      return playerRankings.slice(0, 3).map((p) => ({
        rank: p.rank,
        // 선수는 cafe-blue로 통일 (시안 그대로)
        accentColor: "var(--cafe-blue)",
        displayName: p.name,
        // PPG가 레이팅 대용 (DB rating 없음)
        meta: `${p.team_name} · ${p.avg_points} PPG`,
      }));
    }
    return [];
  })();

  return (
    <div className="page">
      {/* ─── 상단 헤더 + 토글 ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          {/* 시안의 eyebrow 라벨 */}
          <div className="eyebrow">랭킹 · LEADERBOARD</div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
            }}
          >
            2026 시즌 랭킹
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            공식전 · 프리시즌 반영 · 매주 월요일 갱신
          </div>
        </div>

        {/* theme-switch 3종 (팀/선수/외부BDR) */}
        <div className="theme-switch" role="group" aria-label="랭킹 모드 선택">
          <button
            type="button"
            className="theme-switch__btn"
            data-active={mode === "team"}
            onClick={() => setMode("team")}
          >
            팀
          </button>
          <button
            type="button"
            className="theme-switch__btn"
            data-active={mode === "player"}
            onClick={() => setMode("player")}
          >
            선수
          </button>
          <button
            type="button"
            className="theme-switch__btn"
            data-active={mode === "bdr"}
            onClick={() => setMode("bdr")}
          >
            외부BDR
          </button>
        </div>
      </div>

      {/* ─── 모드별 콘텐츠 ─── */}

      {/* 팀/선수: 포디움 + 보드 */}
      {mode === "team" && (
        <>
          {loading ? (
            <BoardSkeleton />
          ) : teamRankings.length === 0 ? (
            <EmptyState icon="groups" message="등록된 팀 랭킹이 없습니다" />
          ) : (
            <>
              <V2Podium items={podiumItems} />
              <V2TeamBoard teams={teamRankings} />
            </>
          )}
        </>
      )}

      {mode === "player" && (
        <>
          {loading ? (
            <BoardSkeleton />
          ) : playerRankings.length === 0 ? (
            <EmptyState icon="person" message="등록된 선수 랭킹이 없습니다" />
          ) : (
            <>
              <V2Podium items={podiumItems} />
              <V2PlayerBoard
                players={playerRankings}
                sort={playerSort}
                onSortChange={setPlayerSort}
              />
            </>
          )}
        </>
      )}

      {/* 외부BDR: 기존 컴포넌트 보존 + 일반/대학 부 전환 */}
      {mode === "bdr" && (
        <>
          {/* 부 전환 (theme-switch 톤 유지) */}
          <div
            className="theme-switch"
            role="group"
            aria-label="부 선택"
            style={{ marginBottom: 16 }}
          >
            <button
              type="button"
              className="theme-switch__btn"
              data-active={bdrDivision === "general"}
              onClick={() => setBdrDivision("general")}
            >
              일반부
            </button>
            <button
              type="button"
              className="theme-switch__btn"
              data-active={bdrDivision === "university"}
              onClick={() => setBdrDivision("university")}
            >
              대학부
            </button>
          </div>
          <BdrRankingTable division={bdrDivision} />
        </>
      )}
    </div>
  );
}

/* ============================================================
 * 보조 컴포넌트
 * ============================================================ */

// 보드 로딩 스켈레톤 (v2 톤)
// 이유: shadcn Skeleton 대신 v2 톤(.board)에 맞춘 가벼운 표시
function BoardSkeleton() {
  return (
    <div className="board">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="board__row"
          style={{
            gridTemplateColumns: "56px 1fr 80px",
            opacity: 0.4,
          }}
        >
          <div style={{ height: 14, background: "var(--bg-alt)", borderRadius: 2 }} />
          <div style={{ height: 14, background: "var(--bg-alt)", borderRadius: 2 }} />
          <div style={{ height: 14, background: "var(--bg-alt)", borderRadius: 2 }} />
        </div>
      ))}
    </div>
  );
}

// 빈 상태 표시 (Material Symbols 사용)
function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ padding: "60px 0", textAlign: "center" }}>
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 48,
          color: "var(--ink-dim)",
          marginBottom: 12,
          display: "block",
        }}
      >
        {icon}
      </span>
      <p style={{ fontSize: 14, color: "var(--ink-mute)" }}>{message}</p>
    </div>
  );
}
