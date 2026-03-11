"use client";

import { useState, useEffect, useMemo } from "react";
import type {
  RoundGroup,
  BracketConfig,
} from "@/lib/tournaments/bracket-builder";
import {
  computeMatchPositions,
  computeConnectorPaths,
  computeBracketDimensions,
} from "@/lib/tournaments/bracket-builder";
import { MatchCard, MobileMatchCard } from "./match-card";

type BracketViewProps = {
  rounds: RoundGroup[];
  tournamentId: string;
};

// ── 카드 크기 결정 ────────────────────────────────────

function getCardSize(totalTeams: number): "sm" | "md" | "lg" {
  if (totalTeams > 16) return "sm";
  if (totalTeams > 8) return "md";
  return "lg";
}

const CARD_DIMENSIONS = {
  sm: { width: 120, height: 60 },
  md: { width: 140, height: 66 },
  lg: { width: 160, height: 72 },
} as const;

// ── 현재 활성 라운드 계산 ──────────────────────────────

function getInitialActiveRound(rounds: RoundGroup[]): number {
  const liveRound = rounds.find((r) => r.hasLive);
  if (liveRound) return liveRound.roundNumber;

  const completedRounds = rounds.filter((r) => r.hasCompleted);
  if (completedRounds.length > 0) {
    const lastCompleted = completedRounds[completedRounds.length - 1];
    const nextRound = rounds.find(
      (r) => r.roundNumber === lastCompleted.roundNumber + 1,
    );
    if (nextRound) return nextRound.roundNumber;
    return lastCompleted.roundNumber;
  }

  return rounds[0]?.roundNumber ?? 1;
}

// ── 메인 컴포넌트 ──────────────────────────────────────

export function BracketView({ rounds, tournamentId }: BracketViewProps) {
  const [activeRound, setActiveRound] = useState<number>(() =>
    getInitialActiveRound(rounds),
  );

  const totalTeams = rounds.length > 0 ? rounds[0].matches.length * 2 : 0;
  const cardSize = getCardSize(totalTeams);

  useEffect(() => {
    setActiveRound(getInitialActiveRound(rounds));
  }, [rounds]);

  const activeRoundData = rounds.find((r) => r.roundNumber === activeRound);

  return (
    <div>
      {/* 데스크톱: 전체 트리 뷰 */}
      <div className="hidden lg:block">
        <DesktopBracketView rounds={rounds} cardSize={cardSize} />
      </div>

      {/* 모바일: 라운드 탭 뷰 */}
      <div className="lg:hidden">
        {/* 라운드 탭 바 */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {rounds.map((round) => (
            <button
              key={round.roundNumber}
              onClick={() => setActiveRound(round.roundNumber)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeRound === round.roundNumber
                  ? "bg-[#F4A261] text-white"
                  : round.hasLive
                    ? "bg-white border border-[#F4A261] text-[#F4A261]"
                    : "bg-white border border-[#E8ECF0] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              {round.roundName}
              {round.hasLive && activeRound !== round.roundNumber && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F4A261] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F4A261]" />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 라운드 정보 */}
        {activeRoundData && (
          <p className="mb-3 text-xs text-[#9CA3AF]">
            {activeRoundData.roundName} · {activeRoundData.matches.length}경기
          </p>
        )}

        {/* 선택된 라운드의 매치 카드 */}
        <div className="space-y-3">
          {activeRoundData?.matches
            .slice()
            .sort((a, b) => {
              if (a.status === "in_progress" && b.status !== "in_progress") return -1;
              if (a.status !== "in_progress" && b.status === "in_progress") return 1;
              return a.bracketPosition - b.bracketPosition;
            })
            .map((match) => (
              <MobileMatchCard
                key={match.id}
                match={match}
                tournamentId={tournamentId}
              />
            ))}
        </div>

        {/* 이전/다음 라운드 이동 */}
        <div className="mt-4 flex justify-between text-sm">
          {activeRound > (rounds[0]?.roundNumber ?? 1) ? (
            <button
              onClick={() => setActiveRound(activeRound - 1)}
              className="text-[#0066FF] hover:underline"
            >
              ← {rounds.find((r) => r.roundNumber === activeRound - 1)?.roundName}
            </button>
          ) : (
            <div />
          )}
          {activeRound < (rounds[rounds.length - 1]?.roundNumber ?? 1) ? (
            <button
              onClick={() => setActiveRound(activeRound + 1)}
              className="text-[#0066FF] hover:underline"
            >
              {rounds.find((r) => r.roundNumber === activeRound + 1)?.roundName} →
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

// ── 데스크톱 트리 뷰 (절대 위치 기반) ─────────────────

function DesktopBracketView({
  rounds,
  cardSize,
}: {
  rounds: RoundGroup[];
  cardSize: "sm" | "md" | "lg";
}) {
  const { width: cardWidth, height: cardHeight } = CARD_DIMENSIONS[cardSize];
  // columnGap: 카드-카드 사이 공간 (연결선 영역 포함)
  const columnGap = 72;

  const config: BracketConfig = { cardWidth, cardHeight, columnGap };

  // 모든 좌표 계산은 순수 함수 — useMemo로 캐싱
  const positions = useMemo(
    () => computeMatchPositions(rounds, config),
    [rounds, cardWidth, cardHeight, columnGap],
  );
  const connectorPaths = useMemo(
    () => computeConnectorPaths(rounds, config),
    [rounds, cardWidth, cardHeight, columnGap],
  );
  const dimensions = useMemo(
    () => computeBracketDimensions(rounds, config),
    [rounds, cardWidth, cardHeight, columnGap],
  );

  // 매치 ID → 위치 맵
  const positionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const p of positions) {
      map.set(p.matchId, { x: p.x, y: p.y });
    }
    return map;
  }, [positions]);

  // 라운드 헤더 위치 (각 라운드의 첫 매치 X좌표)
  const roundHeaders = useMemo(() => {
    return rounds.map((round) => {
      const firstMatch = round.matches[0];
      const pos = positionMap.get(firstMatch?.id ?? "");
      return {
        roundNumber: round.roundNumber,
        roundName: round.roundName,
        hasLive: round.hasLive,
        x: pos?.x ?? 0,
      };
    });
  }, [rounds, positionMap]);

  // 패딩 (라운드 헤더 + 여유)
  const headerHeight = 32;
  const padding = 16;

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[#E8ECF0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div
        className="relative"
        style={{
          width: `${dimensions.width + padding * 2}px`,
          height: `${dimensions.height + headerHeight + padding}px`,
        }}
      >
        {/* 라운드 헤더 */}
        {roundHeaders.map((rh) => (
          <div
            key={rh.roundNumber}
            className="absolute flex items-center gap-2"
            style={{
              left: `${rh.x + padding}px`,
              top: 0,
              width: `${cardWidth}px`,
            }}
          >
            <span className="text-sm font-semibold text-[#6B7280] whitespace-nowrap">
              {rh.roundName}
            </span>
            {rh.hasLive && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F4A261] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F4A261]" />
              </span>
            )}
          </div>
        ))}

        {/* SVG 연결선 레이어 */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: `${padding}px`,
            top: `${headerHeight}px`,
          }}
          width={dimensions.width}
          height={dimensions.height}
        >
          {connectorPaths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              stroke={path.isActive ? "rgba(244,162,97,0.5)" : "#D1D5DB"}
              strokeWidth={1.5}
              fill="none"
            />
          ))}
        </svg>

        {/* 매치 카드 (절대 위치) */}
        {rounds.flatMap((round) =>
          round.matches.map((match) => {
            const pos = positionMap.get(match.id);
            if (!pos) return null;
            return (
              <div
                key={match.id}
                className="absolute"
                style={{
                  left: `${pos.x + padding}px`,
                  top: `${pos.y + headerHeight}px`,
                }}
              >
                <MatchCard match={match} size={cardSize} />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
