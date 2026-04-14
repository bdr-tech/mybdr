"use client";

// 이유: 모바일 탭 뷰를 제거하고 모든 화면에서 SVG 트리 뷰를 표시하기 위해
// useState/useEffect 훅과 MobileMatchCard가 더 이상 필요 없음. 트리 뷰는 순수
// 렌더링이라 useMemo만 있으면 충분함.
import { useMemo, useRef, useState, useEffect } from "react";
import type {
  RoundGroup,
  BracketConfig,
} from "@/lib/tournaments/bracket-builder";
import {
  computeMatchPositions,
  computeConnectorPaths,
  computeBracketDimensions,
} from "@/lib/tournaments/bracket-builder";
import { MatchCard } from "./match-card";

type BracketViewProps = {
  rounds: RoundGroup[];
  tournamentId: string;
};

// ── 카드 크기 결정 ────────────────────────────────────
// 이유: 모바일 한 화면 우선. 4강/8강/16강 전부 sm 고정으로 통일.
// 데스크톱에서 살짝 작아 보이지만, 모바일에서 가로 스크롤 없는 게 더 중요.
function getCardSize(_rounds: RoundGroup[]): "sm" | "md" | "lg" {
  return "sm";
}

// 이유: SIZE_MAP과 동기화. match-card의 Tailwind 클래스와 이 상수가 일치해야
// bracket-builder의 좌표 계산이 정확함 (카드 실제 픽셀 크기 기준으로 선 그림).
const CARD_DIMENSIONS = {
  sm: { width: 120, height: 62 },
  md: { width: 144, height: 70 },
  lg: { width: 168, height: 80 },
} as const;

// ── 메인 컴포넌트 ──────────────────────────────────────

export function BracketView({ rounds, tournamentId: _tournamentId }: BracketViewProps) {
  // 이유: 더 이상 탭 state 없음. 트리 뷰가 전체를 한번에 그림.
  const cardSize = getCardSize(rounds);

  return (
    <section>
      {/* 섹션 헤더: 시안 bdr_3의 "토너먼트 대진표 (Knockout Stage)" 스타일 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {/* 파란 세로 막대 (시안에서 secondary-navy 사용) */}
          <span
            className="w-1.5 h-6 rounded-sm"
            style={{ backgroundColor: "var(--color-secondary)" }}
          />
          토너먼트 대진표 (Knockout Stage)
        </h3>
        {/* 범례: 실시간 / 예정 표시 */}
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} /> 실시간 진행중
          </span>
          <span className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--color-border)" }} /> 경기 예정
          </span>
        </div>
      </div>

      {/* 트리 뷰: 모든 화면에서 동일하게 렌더.
          모바일에서는 내부 overflow-x-auto로 가로 스크롤 처리됨. */}
      <BracketTreeView rounds={rounds} cardSize={cardSize} />
    </section>
  );
}

// ── 트리 뷰 (절대 위치 기반 SVG 트리) ─────────────────
// 이유: 과거 DesktopBracketView를 BracketTreeView로 이름만 정리. 로직은 동일하되
// columnGap을 40으로 줄여 모바일 가로 폭 부담을 낮춤.
function BracketTreeView({
  rounds,
  cardSize,
}: {
  rounds: RoundGroup[];
  cardSize: "sm" | "md" | "lg";
}) {
  const { width: cardWidth, height: cardHeight } = CARD_DIMENSIONS[cardSize];
  // columnGap: 카드-카드 사이 공간 (연결선 영역 포함)
  // 이유: 40 → 24. 카드가 100px로 줄어든 만큼 컬럼 간격도 줄여서
  // 모바일 375px 화면에 4강 트리(3컬럼 = 100*3 + 24*2 + padding 12*2 = 372px)가 들어오게.
  const columnGap = 24;

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

  // 라운드 헤더 위치 (각 라운드의 첫 매치 X 좌표 + 첫 매치 바로 위 Y 좌표)
  // 이유: 헤더를 각 라운드의 첫 카드 바로 위에 배치 → "헤더 + 카드 블록" 전체가 세로 중앙 정렬되는 효과
  const roundHeaders = useMemo(() => {
    return rounds.map((round) => {
      const firstMatch = round.matches[0];
      const pos = positionMap.get(firstMatch?.id ?? "");
      return {
        roundNumber: round.roundNumber,
        roundName: round.roundName,
        hasLive: round.hasLive,
        matchCount: round.matches.length,
        x: pos?.x ?? 0,
        y: pos?.y ?? 0,  // 첫 매치의 y 좌표 (헤더를 이 위에 배치)
      };
    });
  }, [rounds, positionMap]);

  // 패딩 (라운드 헤더 + 여유)
  const headerHeight = 32;
  const padding = 16;

  // 스크롤 컨트롤 (3라운드 이상일 때만 버튼 표시)
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [rounds]);

  // 한 스텝(카드폭 + columnGap)씩 스크롤
  const scrollBy = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = cardWidth + columnGap;
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  return (
    // 이유: 스크롤 컨테이너를 relative 래퍼로 감싸서 좌/우 화살표 버튼을 overlay
    <div className="relative -mx-4 sm:mx-0">
    <div
      ref={scrollRef}
      className="overflow-x-auto border-y sm:rounded-[12px] sm:border sm:p-6"
      style={{
        borderColor: "var(--color-text-muted)",
        backgroundColor: "var(--color-card)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        scrollSnapType: "x mandatory",
        paddingInline: "16px",
        paddingBlock: "16px",
      }}
    >
      <div
        className="relative"
        style={{
          width: `${dimensions.width + padding * 2}px`,
          height: `${dimensions.height + headerHeight + padding}px`,
        }}
      >
        {/* 라운드 헤더 — 각 라운드의 첫 카드 바로 위에 배치 (전체 블록 세로 중앙 정렬 효과) */}
        {roundHeaders.map((rh) => (
          <div
            key={rh.roundNumber}
            className="absolute flex items-center justify-center gap-1.5"
            style={{
              left: `${rh.x + padding}px`,
              // 이유: 첫 카드 y 좌표 바로 위(headerHeight - 헤더 여백)에 배치
              // → 라운드별 헤더+카드 블록 중심이 자연스럽게 트리 전체 중심과 일치
              top: `${rh.y + headerHeight - 28}px`,
              width: `${cardWidth}px`,
            }}
          >
            {/* 강조 버튼 스타일: primary 연한 배경 + 진한 글씨 */}
            <span
              className="inline-flex items-center rounded-md px-3 py-1 text-[11px] font-bold whitespace-nowrap"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              {rh.roundName}
            </span>
            {rh.hasLive && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
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
          {/* 이유: NBA 스타일 — 승자 경로(isActive)는 primary+굵게(2px), 예정 경로는 border색+얇게(1px).
              강약 대비로 "여기서 올라간 팀이 다음 라운드에 올라간다"는 흐름을 시각적으로 명확히 전달 */}
          {connectorPaths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              stroke={path.isActive ? "var(--color-primary)" : "var(--color-text-muted)"}
              strokeWidth={path.isActive ? 2.5 : 1.5}
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

    {/* 좌/우 스크롤 버튼 — 스크롤 가능할 때만 표시 */}
    {canScrollLeft && (
      <button
        type="button"
        onClick={() => scrollBy("left")}
        aria-label="이전 라운드"
        className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-opacity sm:left-2"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-text-muted)",
          color: "var(--color-text-primary)",
        }}
      >
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </button>
    )}
    {canScrollRight && (
      <button
        type="button"
        onClick={() => scrollBy("right")}
        aria-label="다음 라운드"
        className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-opacity sm:right-2"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-text-muted)",
          color: "var(--color-text-primary)",
        }}
      >
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </button>
    )}
    </div>
  );
}
