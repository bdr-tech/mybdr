"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendedGame {
  id: string;
  uuid: string | null;
  title: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  city: string | null;
  game_type: string | null;
  spots_left: number | null;
  match_reason: string[];
}

interface RecommendedData {
  user_name: string | null;
  games: RecommendedGame[];
}

/* 게임 타입별 뱃지 스타일 */
const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  "0": { label: "PICKUP",   color: "var(--color-tertiary)" },
  "1": { label: "GUEST",    color: "var(--color-success)" },
  "2": { label: "PRACTICE", color: "var(--color-warning)" },
};

/* ============================================================
 * RecommendedGames — bdr_6 "Recommended for You" 벤토 그리드
 * - 섹션 헤더: text-2xl font-heading + "전체보기" 링크
 * - 벤토 그리드: grid 1열 / md:3열
 * - 큰 카드(md:col-span-2): 게스트 모집 리스트
 * - 사이드 카드: gradient 배경, RECRUITING 뱃지
 * ============================================================ */
export function RecommendedGames() {
  const [data, setData] = useState<RecommendedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/web/recommended-games", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl md:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </section>
    );
  }

  const games = data?.games ?? [];
  const userName = data?.user_name;
  const title = userName ? `${userName}님을 위한 추천` : "Recommended for You";

  /* 메인 카드용 게임(최대 3개) + 사이드 카드용 게임 */
  const mainGames = games.slice(0, 3);

  return (
    <section className="space-y-6">
      {/* 섹션 헤더: bdr_6 스타일 */}
      <div className="flex items-end justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>
        <Link
          href="/games"
          prefetch={true}
          className="text-sm font-semibold transition-colors hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          전체보기
        </Link>
      </div>

      {games.length === 0 ? (
        <div
          className="rounded-2xl py-12 text-center"
          style={{ backgroundColor: "var(--color-surface-low)", color: "var(--color-text-muted)" }}
        >
          추천 경기가 없습니다.
        </div>
      ) : (
        /* bdr_6 벤토 그리드: 큰 카드(2열) + 사이드 카드(1열) */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 큰 카드 영역 (md:col-span-2): 게스트 모집 리스트 스타일 */}
          <div
            className="group relative overflow-hidden rounded-2xl p-8 md:col-span-2"
            style={{ backgroundColor: "var(--color-surface-low)" }}
          >
            <div className="relative z-10">
              {/* 섹션 제목 */}
              <h3
                className="mb-2 text-sm font-bold tracking-widest"
                style={{ color: "var(--color-primary)" }}
              >
                맞춤형 게스트 모집
              </h3>
              <div
                className="mb-6 text-2xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                최근 플레이 스타일 기준
                <br />
                추천 매칭 리스트
              </div>

              {/* 게스트 모집 리스트 아이템들 */}
              <div className="space-y-4">
                {mainGames.map((g) => {
                  const badge = TYPE_BADGE[g.game_type ?? ""] ?? null;
                  const dateStr = g.scheduled_at
                    ? new Date(g.scheduled_at).toLocaleDateString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                        weekday: "short",
                      })
                    : "";
                  const timeStr = g.scheduled_at
                    ? new Date(g.scheduled_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";
                  return (
                    <Link key={g.id} href={`/games/${g.uuid?.slice(0, 8) ?? g.id}`} prefetch={true}>
                      <div
                        className="flex items-center justify-between rounded-lg p-4 backdrop-blur-sm transition-colors hover:bg-surface-bright"
                        style={{ backgroundColor: "var(--color-surface-high)", opacity: 0.9 }}
                      >
                        <div className="flex items-center gap-4">
                          {/* 아바타 자리 (게임 타입 뱃지로 대체) */}
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full text-lg"
                            style={{
                              backgroundColor: badge
                                ? `color-mix(in srgb, ${badge.color} 20%, transparent)`
                                : "var(--color-surface-bright)",
                            }}
                          >
                            🏀
                          </div>
                          <div>
                            <div
                              className="text-sm font-bold"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {g.title}
                            </div>
                            <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                              {g.venue_name ?? g.city ?? "장소 미정"} · {dateStr} {timeStr}
                            </div>
                          </div>
                        </div>
                        {/* 신청 버튼 */}
                        <span
                          className="rounded px-4 py-2 text-sm font-bold"
                          style={{
                            backgroundColor: "var(--color-primary-light)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {g.spots_left !== null && g.spots_left > 0
                            ? `${g.spots_left}자리`
                            : "신청"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 장식용 배경 아이콘 (bdr_6 스타일) */}
            <div className="absolute -bottom-20 -right-20 opacity-10 transition-transform duration-1000 group-hover:scale-110">
              <span className="text-[300px]">🏀</span>
            </div>
          </div>

          {/* 사이드 카드: bdr_6 스타일 gradient 배경 + RECRUITING 뱃지 */}
          <div
            className="flex flex-col justify-between rounded-2xl p-8"
            style={{
              background: "linear-gradient(to bottom right, var(--color-accent), var(--color-secondary))",
            }}
          >
            <div>
              {/* RECRUITING 뱃지 */}
              <div className="mb-4 inline-block rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white">
                RECRUITING
              </div>
              <h3
                className="text-2xl font-bold leading-snug text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                대회에 참가해서
                <br />
                실력을 겨뤄보세요
              </h3>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-white/80">
                토너먼트 / 리그 / 챌린지
              </div>
              <Link href="/tournaments" prefetch={true}>
                <button
                  className="w-full rounded py-4 font-black uppercase tracking-tighter transition-all active:scale-95"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "var(--color-accent)",
                  }}
                >
                  신청하기
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
