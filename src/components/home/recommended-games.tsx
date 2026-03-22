"use client";

/* ============================================================
 * RecommendedGames — 추천/인기 경기 섹션 (리디자인)
 *
 * 왜 리디자인했는가: 기존 벤토 그리드를 모바일 가로 스크롤 + 데스크탑 2열 그리드로
 * 변경하여 다양한 카드 유형(Pickup Game / 대회)을 일관되게 보여준다.
 *
 * 구조:
 * - 빨간 세로 막대 + 제목 + "전체보기" 링크
 * - Pickup Game 카드: 이미지 + 뱃지 + 제목 + 일시 + "예약하기" 버튼
 * - 대회 카드: 타입/제목/RECRUITING 뱃지 + 참가팀/개최일/상금 + "참가 신청" 버튼
 * ============================================================ */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
/* 세션 정보: 서버에서 getWebSession()으로 받은 JwtPayload를 전달받는다 */
interface UserSession {
  sub: string;
  name: string;
  email: string;
  role: string;
}

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

interface RecommendedGamesProps {
  session: UserSession | null;
}

export function RecommendedGames({ session }: RecommendedGamesProps) {
  const [data, setData] = useState<RecommendedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/web/recommended-games", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  /* 로그인 시 "~님을 위한 추천", 비로그인 시 "인기 경기 및 토너먼트" */
  /* API 응답의 user_name이 있으면 사용, 없으면 세션의 name 사용 */
  const userName = data?.user_name ?? session?.name;
  const title = session
    ? `"${userName ?? "Player"}"님을 위한 추천`
    : "인기 경기 및 토너먼트";

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* 섹션 헤더: 빨간 세로 막대 + 제목 + 전체보기 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-3">
          {/* 빨간 세로 막대 */}
          <span className="w-1.5 h-6 bg-primary" />
          {title}
        </h3>
        <Link
          href="/games"
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          전체보기
        </Link>
      </div>

      {/* 반응형 레이아웃: 모바일 가로 스크롤 / 데스크탑 2열 그리드 */}
      <div className="flex flex-row overflow-x-auto gap-6 no-scrollbar -mx-6 px-6 md:grid md:grid-cols-2 md:overflow-visible md:mx-0 md:px-0">

        {/* === Pickup Game 카드 1 === */}
        <div className="min-w-[280px] md:min-w-0 bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group">
          {/* 이미지 영역 */}
          <div className="relative h-40">
            <img
              alt="Basketball Pickup Game"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=60"
            />
            {/* 뱃지 */}
            <div className="absolute top-3 left-3 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded">
              PICKUP GAME
            </div>
          </div>
          {/* 카드 본문 */}
          <div className="p-5">
            <h4 className="text-lg font-bold text-text-primary mb-2">
              토요일 밤 5vs5 풀코트 매치
            </h4>
            <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                11.04
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                19:00
              </span>
            </div>
            <button className="w-full py-2.5 bg-primary text-on-primary text-sm font-bold rounded hover:brightness-110 transition-all active:scale-95">
              예약하기
            </button>
          </div>
        </div>

        {/* === Pickup Game 카드 2 === */}
        <div className="min-w-[280px] md:min-w-0 bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group">
          <div className="relative h-40">
            <img
              alt="Basketball Game 2"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              src="https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=400&q=60"
            />
            <div className="absolute top-3 left-3 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded">
              PICKUP GAME
            </div>
          </div>
          <div className="p-5">
            <h4 className="text-lg font-bold text-text-primary mb-2">
              서초 일요 조기 농구 5:5
            </h4>
            <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                11.05
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                07:00
              </span>
            </div>
            <button className="w-full py-2.5 bg-primary text-on-primary text-sm font-bold rounded hover:brightness-110 transition-all active:scale-95">
              예약하기
            </button>
          </div>
        </div>

        {/* === 대회 카드 1 === */}
        <div className="min-w-[280px] md:min-w-0 bg-surface border border-border p-5 rounded-lg hover:border-primary/50 transition-colors group">
          {/* 헤더: 타입 + 제목 + RECRUITING 뱃지 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase">
                {session ? "Tournament" : "Trending Tournament"}
              </span>
              <span className="text-lg font-bold text-text-primary">
                BDR 오픈 챌린지 윈터
              </span>
            </div>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              RECRUITING
            </span>
          </div>
          {/* 참가팀 / 개최일 / 상금 3열 */}
          <div className="grid grid-cols-3 gap-2 mb-6 py-3 border-y border-border/30">
            <div className="text-center">
              <div className="text-[9px] text-text-muted mb-1">참가팀</div>
              <div className="text-xs font-bold text-text-primary">12/16</div>
            </div>
            <div className="text-center border-l border-border/30">
              <div className="text-[9px] text-text-muted mb-1">개최일</div>
              <div className="text-xs font-bold text-text-primary">12.24</div>
            </div>
            <div className="text-center border-l border-border/30">
              <div className="text-[9px] text-text-muted mb-1">상금</div>
              <div className="text-xs font-bold text-text-primary">100만</div>
            </div>
          </div>
          {/* 참가 신청 버튼: 호버 시 빨간색으로 변경 */}
          <button className="w-full py-2.5 bg-card group-hover:bg-primary text-text-primary group-hover:text-on-primary text-sm font-bold transition-all rounded active:scale-95">
            참가 신청
          </button>
        </div>

        {/* === 대회 카드 2 === */}
        <div className="min-w-[280px] md:min-w-0 bg-surface border border-border p-5 rounded-lg hover:border-primary/50 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase">
                {session ? "Basketball" : "Big Match"}
              </span>
              <span className="text-lg font-bold text-text-primary">
                연말 왕중왕전 토너먼트
              </span>
            </div>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-bold uppercase">
              {session ? "RECRUITING" : "FULL"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-6 py-3 border-y border-border/30">
            <div className="text-center">
              <div className="text-[9px] text-text-muted mb-1">참가팀</div>
              <div className="text-xs font-bold text-text-primary">8/8</div>
            </div>
            <div className="text-center border-l border-border/30">
              <div className="text-[9px] text-text-muted mb-1">개최일</div>
              <div className="text-xs font-bold text-text-primary">12.30</div>
            </div>
            <div className="text-center border-l border-border/30">
              <div className="text-[9px] text-text-muted mb-1">
                {session ? "대기팀" : "대기팀"}
              </div>
              <div className="text-xs font-bold text-text-primary">2</div>
            </div>
          </div>
          <button className="w-full py-2.5 bg-card group-hover:bg-primary text-text-primary group-hover:text-on-primary text-sm font-bold transition-all rounded active:scale-95">
            대기 신청
          </button>
        </div>
      </div>
    </section>
  );
}
