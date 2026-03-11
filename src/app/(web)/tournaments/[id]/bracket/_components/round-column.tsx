// 이 파일은 현재 사용되지 않습니다.
// 데스크톱 뷰는 bracket-view.tsx에서 절대 위치 방식으로 구현됨.
// 향후 대안 레이아웃(flexbox 기반)이 필요한 경우를 위해 보존.

"use client";

import type { RoundGroup } from "@/lib/tournaments/bracket-builder";
import { MatchCard } from "./match-card";

type RoundColumnProps = {
  round: RoundGroup;
  roundIndex: number;
  totalRounds: number;
  cardSize?: "sm" | "md" | "lg";
};

export function RoundColumn({
  round,
  roundIndex,
  totalRounds,
  cardSize = "lg",
}: RoundColumnProps) {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-[#6B7280] whitespace-nowrap">
          {round.roundName}
        </h3>
        {round.hasLive && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F4A261] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F4A261]" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-around">
        {round.matches.map((match) => (
          <div key={match.id} className="py-2">
            <MatchCard match={match} size={cardSize} />
          </div>
        ))}
      </div>
    </div>
  );
}
