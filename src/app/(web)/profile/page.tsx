"use client";

/**
 * 프로필 대시보드 (/profile) — L2 재정의
 *
 * 왜:
 * - L2 본 설계 (Q5=①): /profile은 "대시보드" 정체성으로 재정의.
 *   · 기본 정보/환불계좌 카드는 `/profile/edit`에서 읽기+편집 통합으로 이관 (별도 작업)
 *   · 여기서는 "한눈에 보는 현황 + 빠른 진입"에 집중
 * - 공용 ProfileHero 사용 (본인·타인 통합, Q4 레벨 배지).
 *
 * 어떻게:
 * - useSWR 3개 그대로 유지 (/api/web/profile + gamification + stats). 구조 안정 우선.
 * - Hero → 다음 경기/팀·대회 요약 카드 → 빠른 메뉴 그리드 → 위험 영역.
 * - Hero 액션 슬롯에 "프로필 편집" 버튼(/profile/edit).
 */

import useSWR from "swr";
import Link from "next/link";

import { ProfileHero } from "@/components/profile/profile-hero";
// 편집 버튼 — /users/[id] 본인 분기와 공용화된 컴포넌트 (2곳 중복 해소)
import { OwnerEditButton } from "@/components/profile/owner-edit-button";
import {
  TeamsTournamentsCard,
  type NextGameSummary,
} from "./_components/teams-tournaments-card";
import { DangerZoneCard } from "./_components/danger-zone-card";

// /api/web/profile 응답 타입
// apiSuccess가 snake_case로 변환하므로 프론트도 snake_case로 접근 (errors.md 재발 5회 방지)
interface ProfileData {
  user: {
    nickname: string | null;
    name: string | null;
    email: string;
    phone: string | null;
    birth_date: string | null;
    position: string | null;
    height: number | null;
    weight: number | null;
    city: string | null;
    district: string | null;
    bio: string | null;
    profile_image_url: string | null;
    total_games_participated: number | null;
    created_at: string | null;
    has_account: boolean;
    bank_name: string | null;
    bank_code: string | null;
    account_number_masked: string | null;
    account_holder: string | null;
  };
  teams?: { id: string; name: string; role: string }[];
  tournaments?: { id: string; name: string; status: string | null }[];
  followers_count?: number;
  following_count?: number;
  next_game?: NextGameSummary | null;
}

interface GamificationData {
  level: number;
  title: string;
  emoji: string;
}

interface StatsData {
  winRate: number | null;
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useSWR<ProfileData>("/api/web/profile", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const { data: gamification } = useSWR<GamificationData>(
    "/api/web/profile/gamification",
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );
  const { data: stats } = useSWR<StatsData>("/api/web/profile/stats", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // 로딩 스피너
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-8 w-8 animate-spin"
              style={{ color: "var(--color-primary)" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 비로그인 / 에러 — 로그인 유도
  if (!profile || "error" in profile || !profile.user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span
            className="material-symbols-outlined text-5xl mb-4 block"
            style={{ color: "var(--color-text-disabled)" }}
          >
            person_off
          </span>
          <p
            className="mb-4 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            로그인이 필요합니다
          </p>
          <Link
            href="/login"
            className="inline-block rounded-md px-8 py-3 text-sm font-bold text-[var(--color-on-primary)]"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  const { user } = profile;

  // 공용 Hero가 기대하는 형태로 user 변환 (기존 snake_case 유지)
  const heroUser = {
    name: user.name,
    nickname: user.nickname,
    profile_image_url: user.profile_image_url,
    position: user.position,
    city: user.city,
    district: user.district,
    height: user.height,
    bio: user.bio,
    total_games_participated: user.total_games_participated,
  };

  // 레벨 배지 — /api/web/profile/gamification이 이미 {level, title, emoji}를 반환하므로 직접 매핑
  const levelInfo = gamification
    ? {
        level: gamification.level,
        title: gamification.title,
        emoji: gamification.emoji,
      }
    : null;

  return (
    <div className="max-w-5xl space-y-6">
      {/* ===== 1) 공용 Hero — 본인용 actionSlot은 편집 버튼 ===== */}
      <ProfileHero
        user={heroUser}
        stats={stats ? { winRate: stats.winRate } : null}
        levelInfo={levelInfo}
        followersCount={profile.followers_count ?? 0}
        followingCount={profile.following_count ?? 0}
        actionSlot={<OwnerEditButton />}
      />

      {/* ===== 2) 대시보드 카드 2열 — 팀·대회(다음 경기) + 빠른 메뉴 ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 다음 경기/활동 요약 유지 */}
        <TeamsTournamentsCard
          teamsCount={profile.teams?.length ?? 0}
          tournamentsCount={profile.tournaments?.length ?? 0}
          nextGame={profile.next_game ?? null}
        />

        {/* 빠른 메뉴 — 이관된 기본정보/계좌는 /profile/edit로 유도 */}
        <QuickMenuCard />
      </div>

      {/* ===== 3) 위험 영역 (회원 탈퇴 등) ===== */}
      <DangerZoneCard />

      {/* ===== 4) 로그아웃 ===== */}
      <div className="pb-4 pt-2">
        <button
          onClick={async () => {
            await fetch("/api/web/logout", {
              method: "POST",
              credentials: "include",
            });
            window.location.href = "/login";
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-medium transition-colors hover:bg-[var(--color-surface)]"
          style={{ color: "var(--color-error, #EF4444)" }}
        >
          <span className="material-symbols-outlined text-base">logout</span>
          로그아웃
        </button>
      </div>
    </div>
  );
}

/**
 * QuickMenuCard — 대시보드 빠른 메뉴
 *
 * 왜:
 * - 기본정보/환불계좌 카드가 제거되면서 편집 진입점이 필요.
 * - 대신 "프로필 편집", "설정", "활동 내역", "주간 리포트" 4개 타일로 자주 쓰는 서브 페이지 진입 제공.
 *
 * 어떻게:
 * - 2x2 그리드. 각 타일은 Material Symbols 아이콘 + 레이블.
 * - 기본정보/환불계좌도 "프로필 편집"으로 통합 진입 (/profile/edit에서 모두 관리).
 */
function QuickMenuCard() {
  const items: { href: string; icon: string; label: string }[] = [
    { href: "/profile/edit", icon: "manage_accounts", label: "프로필 편집" },
    { href: "/profile/activity", icon: "insights", label: "활동 내역" },
    { href: "/profile/weekly-report", icon: "bar_chart", label: "주간 리포트" },
    { href: "/profile/settings", icon: "settings", label: "설정" },
  ];

  return (
    <section
      className="rounded-lg border p-4 sm:p-5"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        borderRadius: "4px",
      }}
    >
      <header className="mb-3">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          빠른 메뉴
        </h2>
      </header>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-2 rounded border p-3 text-sm transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
              borderRadius: "4px",
            }}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ color: "var(--color-primary)" }}
            >
              {it.icon}
            </span>
            {it.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
