"use client";

/**
 * 프로필 허브 페이지 (/profile) — M1 Day 7 통합 대시보드
 *
 * 왜:
 *  - Day 6까지는 4개 카테고리 카드만 있는 얕은 허브였으나,
 *    사용자가 자주 확인하는 "내 정보" 가 한 번 더 클릭해야 보이는 구조였다.
 *  - Day 7 부터는 /profile === "내 정보 통합 대시보드" 로 통일.
 *    좌측 네비의 "내 정보"와 동일한 화면.
 *
 * 어떻게:
 *  - 기존 useSWR 데이터 패칭 로직은 보존 (/api/web/profile + /api/web/profile/gamification + /api/web/profile/stats).
 *  - 응답에 Day 7 API 확장으로 추가된 followers_count/following_count/next_game 필드를 활용
 *    (apiSuccess 미들웨어가 자동 snake_case 변환하므로 프론트도 snake_case 접근).
 *  - 구성: ProfileHero (1) + 2x2 카드 그리드 (기본정보/팀·대회/환불계좌/위험영역) + 로그아웃.
 *
 * 리디자인 원칙 (CLAUDE.md): API/데이터 패칭 유지, UI 렌더링만 교체.
 */

import useSWR from "swr";
import Link from "next/link";

import { ProfileHero } from "./_components/profile-hero";
import { BasicInfoCard } from "./_components/basic-info-card";
import {
  TeamsTournamentsCard,
  type NextGameSummary,
} from "./_components/teams-tournaments-card";
import { RefundAccountCard } from "./_components/refund-account-card";
import { DangerZoneCard } from "./_components/danger-zone-card";

// /api/web/profile 응답 타입 — 기존 필드 + Day 7 신규 3개
interface ProfileData {
  user: {
    nickname: string | null;
    name: string | null;
    email: string;
    phone: string | null;
    birth_date: string | null; // "YYYY-MM-DD"
    position: string | null;
    height: number | null;
    weight: number | null;
    city: string | null;
    district: string | null;
    bio: string | null;
    profile_image_url: string | null;
    total_games_participated: number | null;
    created_at: string | null;
    // 계좌 필드
    has_account: boolean;
    bank_name: string | null;
    bank_code: string | null;
    account_number_masked: string | null;
    account_holder: string | null;
  };
  teams?: { id: string; name: string; role: string }[];
  tournaments?: { id: string; name: string; status: string | null }[];
  // M1 Day 7 신규 — apiSuccess()가 응답을 자동으로 snake_case 변환하므로 (src/lib/api/response.ts:5)
  // 프론트도 snake_case로 접근해야 한다. 기존 user.birth_date/has_account 패턴과 통일.
  // (재발 5회차 방지: errors.md "apiSuccess 미들웨어 놓치고 컴포넌트 인터페이스 거꾸로 변환")
  followers_count?: number;
  following_count?: number;
  next_game?: NextGameSummary | null;
}

// /api/web/profile/gamification 응답
interface GamificationData {
  level: number;
  title: string;
  emoji: string;
}

// /api/web/profile/stats 응답 — 승률(winRate) 만 히어로에서 사용
interface StatsData {
  winRate: number | null;
}

export default function ProfilePage() {
  // 기존 페치 로직 유지 — 재사용 간격 60초 (여러 화면이 동시에 부르면 1회만)
  const { data: profile, isLoading } = useSWR<ProfileData>(
    "/api/web/profile",
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
  const { data: gamification } = useSWR<GamificationData>(
    "/api/web/profile/gamification",
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
  // 승률 표시용. 없어도 히어로에서 "-%"로 fallback 처리됨.
  const { data: stats } = useSWR<StatsData>("/api/web/profile/stats", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // 로딩 상태 — 기존 허브와 동일 톤
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

  // 비로그인 or 에러 — 기존 허브와 동일 톤
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
            // conventions.md: primary 배경 위 텍스트는 --color-on-primary 사용 (text-white 금지)
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

  return (
    <div className="max-w-5xl space-y-6">
      {/* ===== 1) 히어로 ===== */}
      <ProfileHero
        user={{
          nickname: user.nickname,
          name: user.name,
          position: user.position,
          height: user.height,
          city: user.city,
          district: user.district,
          bio: user.bio,
          profile_image_url: user.profile_image_url,
          total_games_participated: user.total_games_participated,
        }}
        stats={stats ? { winRate: stats.winRate } : null}
        gamification={gamification ?? null}
        followersCount={profile.followers_count ?? 0}
        followingCount={profile.following_count ?? 0}
      />

      {/* ===== 2) 4개 그룹 카드 (모바일 1열, lg 2열) ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BasicInfoCard
          nickname={user.nickname}
          email={user.email}
          phone={user.phone}
          birthDate={user.birth_date}
        />
        <TeamsTournamentsCard
          teamsCount={profile.teams?.length ?? 0}
          tournamentsCount={profile.tournaments?.length ?? 0}
          nextGame={profile.next_game ?? null}
        />
        <RefundAccountCard
          hasAccount={user.has_account}
          bankName={user.bank_name}
          accountNumberMasked={user.account_number_masked}
          accountHolder={user.account_holder}
        />
        <DangerZoneCard />
      </div>

      {/* ===== 3) 로그아웃 버튼 — 기존 위치 유지 ===== */}
      <div className="pb-4 pt-2">
        <button
          onClick={async () => {
            // 로그아웃: 서버에서 세션 제거 후 로그인 페이지로 이동
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
