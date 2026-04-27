"use client";

/* ============================================================
 * GamesClient — BDR v2 Games 페이지의 클라이언트 래퍼
 *
 * 왜 이 컴포넌트가 있는가:
 * page.tsx 는 서버 컴포넌트로 DB 프리페치(listGames + typeCounts) 를
 * 수행하고, 결과 배열을 prop 으로 이 래퍼에 내려준다. 래퍼는:
 *   1. FilterChipBar 의 "클라이언트 전용 필터"(weekend/free/beginner)
 *      상태를 useState 로 관리
 *   2. 서버가 내려준 games 배열을 클라 필터로 한번 더 걸러냄
 *   3. 자동 파생 태그(DQ3: 무료/초보환영/주말)를 계산해 GameCard 에 주입
 *   4. 결과 그리드를 v2 시안 대로 auto-fill minmax(320px, 1fr) 렌더
 *
 * 서버→클라 경계의 단일 포인트. 상위 page.tsx 는 데이터 모양만 책임지고,
 * UI 인터랙션은 전부 여기로 격리된다.
 * ============================================================ */

import { useMemo, useState, useCallback } from "react";
import { GameCard } from "@/components/bdr-v2/game-card";
import {
  FilterChipBar,
  type ClientFilterKey,
} from "@/components/bdr-v2/filter-chip-bar";

// 서버(page.tsx)가 내려주는 정규화된 게임 shape.
// - listGames 원시 결과에서 BigInt/Date/Decimal 을 평탄화해 직렬화된 문자열/숫자로.
// - snake_case 가 아닌 camelCase 로 내림: 서버 컴포넌트→클라 컴포넌트 경계는
//   apiSuccess 변환 파이프를 타지 않으므로 의도적 camelCase 로 통일.
export interface GameForClient {
  id: string;
  uuid: string | null;
  title: string | null;
  status: number;
  gameType: number;
  city: string | null;
  district: string | null;
  venueName: string | null;
  scheduledAt: string | null;
  currentParticipants: number | null;
  maxParticipants: number | null;
  feePerPerson: string | null; // Decimal → string
  skillLevel: string | null;
  authorNickname: string | null;
}

export interface GamesClientProps {
  /** 서버 프리페치 결과 — listGames 반환분을 직렬화한 배열 */
  games: GameForClient[];
}

/* -- 태그 자동 파생 유틸 (DQ3) --
 * DB 에 tags 필드가 없어 카드별로 3종 조건을 검사해 최대 3개까지 문자열 생성.
 * 순서: 무료 → 초보환영 → 주말. (시안의 tags 예시 분위기 매칭)
 */
const BEGINNER_SKILLS = new Set(["beginner", "lowest", "low"]);
function deriveTags(g: GameForClient): string[] {
  const tags: string[] = [];
  // 1. 무료 판정 — fee 가 null 이거나 0
  const fee = g.feePerPerson ? Number(g.feePerPerson) : 0;
  if (!g.feePerPerson || fee === 0) tags.push("무료");
  // 2. 초보환영 — skill_level 이 초보 범주
  if (g.skillLevel && BEGINNER_SKILLS.has(g.skillLevel)) tags.push("초보환영");
  // 3. 주말 — scheduled_at 이 토(6) / 일(0)
  if (g.scheduledAt) {
    const d = new Date(g.scheduledAt);
    if (!Number.isNaN(d.getTime())) {
      const dow = d.getDay();
      if (dow === 0 || dow === 6) tags.push("주말");
    }
  }
  return tags;
}

/* -- areaLabel 유틸 — city + district 조합 (공백 정리) -- */
function formatArea(g: GameForClient): string {
  const city = g.city?.trim() ?? "";
  const district = g.district?.trim() ?? "";
  if (city && district) return `${city} ${district}`;
  return city || district || "";
}

/* -- 카드 href — 기존 /games/[id] 규약 유지 (uuid 앞 8자 or id) -- */
function gameHref(g: GameForClient): string {
  const short = g.uuid?.slice(0, 8);
  return `/games/${short ?? g.id}`;
}

export function GamesClient({ games }: GamesClientProps) {
  // 클라 전용 필터 상태 (weekend/free/beginner) — Set 으로 다중 활성 관리
  const [clientFilters, setClientFilters] = useState<Set<ClientFilterKey>>(
    () => new Set(),
  );

  // 칩 토글 콜백 — Set 불변성 유지(새 Set 생성)
  const handleToggleClientFilter = useCallback((key: ClientFilterKey) => {
    setClientFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // 클라 필터 적용 — 서버에서 내려온 games 배열을 한 번 더 거른다.
  // 세 필터는 모두 AND 결합 (활성화된 칩은 "반드시 포함해야 함").
  const filtered = useMemo(() => {
    if (clientFilters.size === 0) return games;
    return games.filter((g) => {
      // 무료: fee null/0
      if (clientFilters.has("free")) {
        const fee = g.feePerPerson ? Number(g.feePerPerson) : 0;
        if (g.feePerPerson && fee > 0) return false;
      }
      // 초보환영: skill_level in {beginner/lowest/low}
      if (clientFilters.has("beginner")) {
        if (!g.skillLevel || !BEGINNER_SKILLS.has(g.skillLevel)) return false;
      }
      // 주말: scheduled_at 요일이 토/일
      if (clientFilters.has("weekend")) {
        if (!g.scheduledAt) return false;
        const dow = new Date(g.scheduledAt).getDay();
        if (dow !== 0 && dow !== 6) return false;
      }
      return true;
    });
  }, [games, clientFilters]);

  return (
    <>
      {/* 필터 칩 7종 — URL 조작 4 + 클라 필터 3 혼합 */}
      <FilterChipBar
        activeClientFilters={clientFilters}
        onToggleClientFilter={handleToggleClientFilter}
      />

      {/* 카드 그리드 — 시안과 동일한 auto-fill minmax(320px, 1fr).
       * 최소 320px 이라 모바일(≤480) 에서는 1열, 태블릿 2열, 데스크톱 3~4열. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 14,
        }}
      >
        {filtered.map((g) => (
          <GameCard
            key={g.id}
            href={gameHref(g)}
            gameType={g.gameType}
            status={g.status}
            title={g.title}
            venueName={g.venueName}
            areaLabel={formatArea(g)}
            scheduledAt={g.scheduledAt}
            skillLevel={g.skillLevel}
            feePerPerson={g.feePerPerson}
            currentParticipants={g.currentParticipants}
            maxParticipants={g.maxParticipants}
            authorNickname={g.authorNickname}
            tags={deriveTags(g)}
          />
        ))}
      </div>

      {/* 빈 상태 — 필터 결과가 0일 때 */}
      {filtered.length === 0 && (
        <div
          style={{
            padding: "48px 18px",
            textAlign: "center",
            color: "var(--ink-dim)",
            fontSize: 14,
          }}
        >
          {games.length === 0
            ? "등록된 경기가 없습니다."
            : "조건에 맞는 경기가 없습니다. 필터를 조정해 보세요."}
        </div>
      )}
    </>
  );
}
