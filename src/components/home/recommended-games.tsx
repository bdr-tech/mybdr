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
  match_reason: string | null;
}

interface RecommendedData {
  user_name: string | null;
  games: RecommendedGame[];
}

const TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  "0": { label: "PICKUP",  bg: "#2563EB", text: "#FFFFFF" },
  "1": { label: "GUEST",   bg: "#16A34A", text: "#FFFFFF" },
  "2": { label: "PRACTICE", bg: "#D97706", text: "#FFFFFF" },
};

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
      <section>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[16px]" />
          ))}
        </div>
      </section>
    );
  }

  const games = data?.games ?? [];
  const userName = data?.user_name;
  const title = userName ? `${userName}님을 위한 추천` : "추천 경기";

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h2>
        <Link href="/games" prefetch={true} className="text-sm font-semibold text-[#E31B23] hover:underline">
          전체보기 →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {games.map((g) => {
          const badge = TYPE_BADGE[g.game_type ?? ""] ?? null;
          const dateStr = g.scheduled_at
            ? new Date(g.scheduled_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
            : "";
          return (
            <Link key={g.id} href={`/games/${g.uuid?.slice(0, 8) ?? g.id}`} prefetch={true}>
              <div className="group flex h-full flex-col rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] p-3.5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1B3C87]/30">
                {/* 뱃지 행 */}
                <div className="mb-2 flex items-center gap-1.5">
                  {badge && (
                    <span
                      className="rounded-[6px] px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  )}
                  {g.spots_left !== null && g.spots_left > 0 && (
                    <span className="rounded-[6px] bg-[#E31B23] px-1.5 py-0.5 text-xs font-bold text-white">
                      {g.spots_left}자리
                    </span>
                  )}
                </div>

                {/* 제목 */}
                <h3 className="text-sm font-bold text-[#111827] line-clamp-1 group-hover:text-[#1B3C87] transition-colors">
                  {g.title}
                </h3>

                {/* 날짜 · 장소 */}
                <p className="mt-1.5 text-xs text-[#9CA3AF] line-clamp-1">
                  {dateStr}
                  {dateStr && (g.venue_name ?? g.city) ? " · " : ""}
                  {g.venue_name ?? g.city ?? "장소 미정"}
                </p>

                {/* 매칭 이유 */}
                {g.match_reason && (
                  <p className="mt-auto pt-2 text-[11px] font-semibold text-[#1B3C87]">{g.match_reason}</p>
                )}
              </div>
            </Link>
          );
        })}
        {games.length === 0 && (
          <div className="col-span-2 rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] py-10 text-center text-[#9CA3AF]">
            추천 경기가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
