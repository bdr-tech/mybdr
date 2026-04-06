"use client";

/**
 * 내 성장 페이지 (/profile/growth)
 *
 * 기존 /profile 페이지에서 게이미피케이션 섹션을 분리한 페이지.
 * XP/레벨 + 연속 출석(연속 출석) + 뱃지 컬렉션 + 코트 도장깨기
 * API: /api/web/profile/gamification 엔드포인트 사용
 */

import useSWR from "swr";
import Link from "next/link";
import { XpLevelCard } from "../_components/xp-level-card";
import { StreakCard } from "../_components/streak-card";
import { BadgeCollection } from "../_components/badge-collection";
import { CourtStamps } from "../_components/court-stamps";

// 게이미피케이션 API 응답 타입
interface GamificationData {
  xp: number;
  level: number;
  title: string;
  emoji: string;
  progress: number;
  next_level_xp: number | null;
  xp_to_next_level: number;
  streak: number;
  badges: {
    id: string;
    badge_type: string;
    badge_name: string;
    earned_at: string;
  }[];
  court_stamps: {
    count: number;
    milestones: {
      count: number;
      name: string;
      icon: string;
      achieved: boolean;
    }[];
    next_milestone: {
      count: number;
      name: string;
      icon: string;
      achieved: boolean;
    } | null;
  };
}

export default function GrowthPage() {
  // 게이미피케이션 API 호출 (기존과 동일한 엔드포인트)
  const { data: gamification, isLoading } = useSWR<GamificationData>("/api/web/profile/gamification", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 비로그인 or 에러
  if (!gamification || "error" in gamification) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: "var(--color-text-disabled)" }}>person_off</span>
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>로그인이 필요합니다</p>
          <Link href="/login" className="inline-block rounded-md px-8 py-3 text-sm font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>로그인</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface)]">
          <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-text-secondary)" }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>내 성장</h1>
      </div>

      {/* XP 진행률 + 레벨 카드 */}
      <XpLevelCard
        xp={gamification.xp}
        level={gamification.level}
        title={gamification.title}
        emoji={gamification.emoji}
        progress={gamification.progress}
        nextLevelXp={gamification.next_level_xp}
        xpToNextLevel={gamification.xp_to_next_level}
      />

      {/* 연속 출석 연속 출석 */}
      <StreakCard streak={gamification.streak} />

      {/* 코트 도장깨기 진행률 */}
      <CourtStamps
        courtCount={gamification.court_stamps.count}
        milestones={gamification.court_stamps.milestones}
        nextMilestone={gamification.court_stamps.next_milestone}
      />

      {/* 획득 뱃지 컬렉션 */}
      <BadgeCollection
        badges={gamification.badges.map((b) => ({
          id: b.id,
          badgeType: b.badge_type,
          badgeName: b.badge_name,
          earnedAt: b.earned_at,
        }))}
      />
    </div>
  );
}
