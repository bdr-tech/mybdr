"use client";

/**
 * 프로필 허브 페이지 (/profile)
 *
 * 기존의 긴 프로필 페이지를 4개 카테고리 카드로 간소화.
 * 각 카드 클릭 시 하위 페이지로 이동.
 * - 내 농구 → /profile/basketball
 * - 내 성장 → /profile/growth
 * - 내 정보 → /profile/edit
 * - 계정 → /profile/subscription
 *
 * API: 프로필 기본 정보 + 게이미피케이션 레벨만 가져옴
 */

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { TossCard } from "@/components/toss/toss-card";

// 프로필 기본 정보만 필요
interface ProfileData {
  user: {
    nickname: string | null;
    email: string;
    position: string | null;
    city: string | null;
    profile_image_url: string | null;
    total_games_participated: number | null;
    created_at: string | null;
  };
  teams?: { id: string; name: string; role: string }[];
}

// 게이미피케이션: 레벨/칭호만 사용
interface GamificationData {
  level: number;
  title: string;
  emoji: string;
}

// 포지션 한글 매핑
const POSITION_LABEL: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

// 4개 카테고리 카드 정의
const categoryCards = [
  {
    id: "basketball",
    label: "내 농구",
    description: "소속 팀, 경기, 대회, 커리어 통계",
    icon: "sports_basketball",
    href: "/profile/basketball",
    color: "var(--color-primary)",
  },
  {
    id: "growth",
    label: "내 성장",
    description: "XP/레벨, 뱃지, 연속 출석, 도장깨기",
    icon: "trending_up",
    href: "/profile/growth",
    color: "var(--color-accent)",
  },
  {
    id: "info",
    label: "내 정보",
    description: "프로필 편집, 소셜 계정",
    icon: "person",
    href: "/profile/edit",
    color: "var(--color-info)",
  },
  {
    id: "account",
    label: "계정",
    description: "구독 관리, 결제 내역, 알림 설정",
    icon: "settings",
    href: "/profile/subscription",
    color: "var(--color-navy, #1B3C87)",
  },
];

export default function ProfilePage() {
  // 프로필 기본 정보만 호출
  const { data: profile, isLoading } = useSWR<ProfileData>("/api/web/profile", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  // 게이미피케이션: 레벨/칭호 표시용
  const { data: gamification } = useSWR<GamificationData>("/api/web/profile/gamification", {
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
  if (!profile || "error" in profile) {
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

  const { user } = profile;
  const displayName = user.nickname ?? "사용자";
  const initial = displayName.trim()[0]?.toUpperCase() || "U";
  const gLevel = gamification?.level ?? 1;
  const gTitle = gamification?.title ?? "루키";
  const gEmoji = gamification?.emoji ?? "";

  return (
    <div className="max-w-[640px] mx-auto space-y-8">

      {/* ==== 프로필 헤더: 아바타(좌) + 정보(우) 가로 배치 ==== */}
      <div className="flex items-center gap-4 pt-4">
        {/* 아바타 (80px) — 좌측 고정 */}
        <div
          className="w-20 h-20 shrink-0 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {user.profile_image_url ? (
            <Image
              src={user.profile_image_url}
              alt={displayName}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl font-bold"
              style={{ color: "var(--color-primary)", backgroundColor: "var(--color-surface)" }}
            >
              {initial}
            </div>
          )}
        </div>

        {/* 이름 + 레벨 + 부가정보 — 우측 세로 나열 */}
        <div className="flex flex-col gap-1">
          {/* 이름 */}
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {displayName}
          </h1>

          {/* 레벨 배지 + 포지션 */}
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--color-primary)", color: "#FFFFFF" }}
            >
              {gEmoji && <span style={{ fontSize: "12px" }}>{gEmoji}</span>}
              Lv.{gLevel} {gTitle}
            </span>
            {user.position && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {POSITION_LABEL[user.position] ?? user.position}
              </span>
            )}
          </div>

          {/* 부가 정보 */}
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {[
              user.city,
              user.created_at ? `${new Date(user.created_at).getFullYear()}년 가입` : null,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* ==== 4개 카테고리 카드 그리드 ==== */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {categoryCards.map((card) => (
          <Link key={card.id} href={card.href}>
            <TossCard className="h-full transition-colors hover:bg-[var(--color-surface)]">
              {/* 아이콘 원형 - 모바일에서 약간 축소 */}
              <div
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full mb-3"
                style={{ backgroundColor: card.color }}
              >
                <span className="material-symbols-outlined text-lg sm:text-xl text-white">{card.icon}</span>
              </div>
              {/* 카테고리명 */}
              <p className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
                {card.label}
              </p>
              {/* 설명 */}
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                {card.description}
              </p>
            </TossCard>
          </Link>
        ))}
      </div>

      {/* ==== 로그아웃 버튼 ==== */}
      <div className="pb-4">
        <button
          onClick={async () => {
            await fetch("/api/web/logout", { method: "POST", credentials: "include" });
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
