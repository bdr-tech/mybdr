import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { listGames, type GameListFilters } from "@/lib/services/game";
import { KindTabBar, type KindTabBarCounts } from "@/components/bdr-v2/kind-tab-bar";
import {
  GamesClient,
  type GameForClient,
} from "./_components/games-client";

/* ============================================================
 * /games — BDR v2 Phase 1 재구성
 *
 * 레이아웃 (v2 Games.jsx 시안 기준):
 *   1. .page 쉘 + 헤더(eyebrow + h1 + 서브 문구 + "모집 글쓰기" 버튼)
 *   2. KindTabBar  — 전체/픽업/게스트 모집/연습경기 + 건수
 *   3. FilterChipBar (GamesClient 내부) — 7칩 (URL 4 + 클라 3)
 *   4. 카드 그리드 — auto-fill minmax(320px, 1fr) × GameCard N장
 *
 * 데이터 패칭 방침 (Home 패턴과 동일):
 *   - 서버 컴포넌트에서 listGames + groupBy(typeCounts) 병렬 prefetch
 *   - searchParams 의 q/type/city/date/skill 을 그대로 서비스 함수에 전달
 *   - 클라 전용 필터(주말/무료/초보환영) 는 GamesClient 내부에서 처리
 *
 * 기존 파일 보존:
 *   - _components/games-content.tsx / game-type-tabs.tsx 유지 (이번 재구성에서
 *     import 제거되지만 삭제하지 않음 — Phase 9 cleanup 에서 재평가)
 *   - games-filter.tsx 유지 (v2 Games 에서는 사용하지 않지만 보존)
 *
 * API/Prisma/route.ts 변경 0. listGames 함수는 기존 호출만.
 * ============================================================ */

// SEO: 경기 목록 페이지 메타데이터 (기존 유지)
export const metadata: Metadata = {
  title: "경기 찾기 | MyBDR",
  description: "내 주변 픽업 게임, 게스트 모집, 연습경기를 찾아보세요.",
};

/* -- date 쿼리 → scheduledAt 범위 변환 (route.ts 와 동일 규칙) --
 * 왜: 서버 컴포넌트에서 listGames 를 직접 부르므로 route.ts 의 변환
 * 로직을 여기서도 재현해야 한다. 규칙은 route.ts L105~125 와 동일.
 */
function resolveScheduledRange(
  date: string | undefined,
): { gte?: Date; lt?: Date } | undefined {
  if (!date || date === "all") return undefined;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (date === "today") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { gte: today, lt: tomorrow };
  }
  if (date === "week") {
    // 이번 주 월요일 ~ 다음 주 월요일
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const nextMon = new Date(mon);
    nextMon.setDate(mon.getDate() + 7);
    return { gte: mon, lt: nextMon };
  }
  if (date === "month") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }
  return undefined;
}

// Next.js 15: async page — searchParams 는 Promise
export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // searchParams 풀이 — 문자열 하나만 필요한 키들
  const sp = await searchParams;
  const pick = (k: string): string | undefined => {
    const v = sp[k];
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v[0];
    return undefined;
  };
  const q = pick("q");
  const type = pick("type");
  const city = pick("city");
  const date = pick("date");
  const skill = pick("skill");

  // 서비스 필터 인자 구성 — listGames 시그니처와 정합
  const serviceFilters: GameListFilters = {
    q,
    type,
    city,
    skillLevels: skill && skill !== "all" ? [skill] : undefined,
    scheduledAt: resolveScheduledRange(date),
    take: 60,
  };

  // 유형별 건수 집계용 WHERE — type 제외한 나머지 조건 재구성.
  // route.ts L128~159 의 countWhere 와 동일 규칙으로, 탭 클릭 후 실제 목록
  // 건수와 일치시킨다. (prefer 관련 분기는 제외 — v2 초기 구현은 비로그인 기준)
  const countWhere: {
    status: { not: number };
    title?: { contains: string; mode: "insensitive" };
    city?: { contains: string; mode: "insensitive" };
    skill_level?: { in: string[] };
    scheduled_at?: { gte?: Date; lt?: Date };
  } = {
    status: { not: 4 },
  };
  if (q) countWhere.title = { contains: q, mode: "insensitive" };
  if (city && city !== "all") {
    countWhere.city = { contains: city, mode: "insensitive" };
  }
  if (skill && skill !== "all") {
    countWhere.skill_level = { in: [skill] };
  }
  const scheduledAt = resolveScheduledRange(date);
  if (scheduledAt) countWhere.scheduled_at = scheduledAt;

  // 병렬 프리페치 — 하나 실패해도 나머지는 반영
  const [gamesResult, typeCountResult] = await Promise.allSettled([
    listGames(serviceFilters),
    prisma.games.groupBy({
      by: ["game_type"],
      where: countWhere,
      _count: { _all: true },
    }),
  ]);

  // 결과 직렬화 — GameForClient shape 로 평탄화
  const rawGames = gamesResult.status === "fulfilled" ? gamesResult.value : [];
  const games: GameForClient[] = rawGames.map((g) => ({
    id: g.id.toString(), // BigInt → string
    uuid: g.uuid,
    title: g.title,
    status: g.status,
    gameType: g.game_type,
    city: g.city,
    district: g.district,
    venueName: g.venue_name,
    scheduledAt: g.scheduled_at?.toISOString() ?? null,
    currentParticipants: g.current_participants,
    maxParticipants: g.max_participants,
    feePerPerson: g.fee_per_person?.toString() ?? null, // Decimal → string
    skillLevel: g.skill_level,
    authorNickname: g.author_nickname ?? null,
  }));

  // typeCounts 딕셔너리 변환 — route.ts L251~263 와 동일 결과
  const typeCountRows =
    typeCountResult.status === "fulfilled" ? typeCountResult.value : [];
  const typeCounts: KindTabBarCounts = {
    "0": 0,
    "1": 0,
    "2": 0,
    all: 0,
  };
  for (const row of typeCountRows) {
    const key = String(row.game_type) as "0" | "1" | "2";
    if (key === "0" || key === "1" || key === "2") {
      typeCounts[key] = row._count._all;
    }
  }
  typeCounts.all = typeCounts["0"] + typeCounts["1"] + typeCounts["2"];

  return (
    // v2 .page 쉘 — max-width + 중앙 정렬 + 상하 여백 (Home 과 동일 컨테이너)
    <div className="page">
      {/* 1. 헤더 영역 — eyebrow + h1 + 서브 문구 + 모집 글쓰기 버튼 */}
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
          <div className="eyebrow">경기 · GAMES</div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
          >
            픽업 · 게스트 모집
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            같이 뛸 사람을 찾는 {typeCounts.all}건의 모집이 열려 있습니다
          </div>
        </div>
        {/* 모집 글쓰기 — 기존 /games/new 라우트 재사용.
         * material-symbols "add" 로 시안의 Icon.plus 대체 (컨벤션). */}
        <Link href="/games/new" className="btn btn--primary">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, marginRight: 4 }}
          >
            add
          </span>
          모집 글쓰기
        </Link>
      </div>

      {/* 2. 종류 탭 — URL ?type 조작 + 건수 표시 */}
      <KindTabBar counts={typeCounts} />

      {/* 3~4. 필터 칩 + 카드 그리드 — 클라이언트 래퍼에 위임 */}
      <GamesClient games={games} />
    </div>
  );
}
