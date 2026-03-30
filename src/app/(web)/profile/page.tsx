"use client";

/**
 * 내 프로필 페이지 (/profile) - 토스 스타일
 *
 * 변경: 기존 2열 레이아웃 -> 1열 세로 스택 (max-w-640px)
 * - 상단: 큰 아바타 + 이름 + 레벨
 * - 통계: TossCard에 숫자 크게 표시 (토스의 숫자 강조 패턴)
 * - 팀/경기: TossListItem 리스트
 * - 하단: 설정 메뉴 TossListItem
 *
 * API/데이터 패칭 100% 유지 - UI만 교체
 */

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { TossCard } from "@/components/toss/toss-card";
import { TossListItem } from "@/components/toss/toss-list-item";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { XpLevelCard } from "./_components/xp-level-card";
import { StreakCard } from "./_components/streak-card";
import { BadgeCollection } from "./_components/badge-collection";
import { CourtStamps } from "./_components/court-stamps";

// 기존 컴포넌트는 import 제거하되 파일은 삭제하지 않음

interface ProfileData {
  user: {
    nickname: string | null;
    email: string;
    position: string | null;
    height: number | null;
    city: string | null;
    bio: string | null;
    profile_image_url: string | null;
    total_games_participated: number | null;
    created_at: string | null;
  };
  teams?: { id: string; name: string; role: string }[];
  recent_games?: { id: string; title: string | null; scheduled_at: string | null; status: number }[];
  tournaments?: { id: string; name: string; status: string | null }[];
}

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

interface StatsData {
  career_averages: {
    games_played: number;
    avg_points: number;
    avg_rebounds: number;
    avg_assists: number;
    avg_steals: number;
    avg_blocks: number;
  } | null;
  season_highs: {
    max_points: number;
    max_rebounds: number;
    max_assists: number;
  } | null;
  monthly_games: number;
  win_rate: number | null;
}

// 포지션 한글 매핑
const POSITION_LABEL: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

// 티어 배지 계산 (총 경기수 기반)
function getTierInfo(totalGames: number): { label: string; color: string; icon: string } {
  if (totalGames >= 100) return { label: "플래티넘", color: "var(--color-tertiary)", icon: "diamond" };
  if (totalGames >= 60) return { label: "골드", color: "var(--color-tier-gold)", icon: "workspace_premium" };
  if (totalGames >= 30) return { label: "실버", color: "var(--color-tier-silver)", icon: "military_tech" };
  if (totalGames >= 10) return { label: "브론즈", color: "var(--color-tier-bronze)", icon: "shield" };
  return { label: "루키", color: "var(--color-text-muted)", icon: "star" };
}

// 경기 상태 라벨
function getGameStatus(status: number): string {
  switch (status) {
    case 0: return "예정";
    case 1: return "진행중";
    case 2: return "종료";
    default: return "예정";
  }
}

// ============================================================
// 업적 배지 컴포넌트
// 조건: 총 경기수, 팀장 역할, 평균 득점 등 기존 데이터에서 계산
// 달성한 배지는 컬러, 미달성은 회색 잠금 처리
// ============================================================
interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;          // Material Symbols 아이콘
  color: string;         // 달성 시 배경색
  condition: boolean;    // 달성 여부
}

function AchievementBadges({
  totalGames,
  avgPoints,
  teams,
}: {
  totalGames: number;
  avgPoints: number;
  teams: { id: string; name: string; role: string }[];
}) {
  // 팀장 여부 확인 (role이 "owner"인 팀이 있는지)
  const isTeamLeader = teams.some((t) => t.role === "owner");

  // 배지 목록 정의: 각 배지의 달성 조건을 계산
  const badges: Badge[] = [
    {
      id: "hot-player",
      label: "핫플레이어",
      description: "경기 10회 이상 참가",
      icon: "local_fire_department",
      color: "var(--color-primary)",
      condition: totalGames >= 10,
    },
    {
      id: "veteran",
      label: "베테랑",
      description: "경기 50회 이상 참가",
      icon: "military_tech",
      color: "var(--color-tier-gold)",
      condition: totalGames >= 50,
    },
    {
      id: "team-leader",
      label: "팀 리더",
      description: "팀장 역할 수행 중",
      icon: "shield_person",
      color: "var(--color-info)",
      condition: isTeamLeader,
    },
    {
      id: "scorer",
      label: "슈터",
      description: "평균 득점 15점 이상",
      icon: "sports_score",
      color: "var(--color-accent)",
      condition: avgPoints >= 15,
    },
    {
      id: "rookie",
      label: "첫 경기",
      description: "첫 번째 경기 참가",
      icon: "celebration",
      color: "var(--color-tertiary)",
      condition: totalGames >= 1,
    },
    {
      id: "multi-team",
      label: "소셜 플레이어",
      description: "2개 이상 팀 소속",
      icon: "diversity_3",
      color: "var(--color-navy, #1B3C87)",
      condition: teams.length >= 2,
    },
  ];

  // 달성한 배지를 먼저, 미달성은 뒤로 정렬
  const sorted = [...badges].sort((a, b) => (b.condition ? 1 : 0) - (a.condition ? 1 : 0));
  const achieved = sorted.filter((b) => b.condition).length;

  return (
    <div>
      <TossSectionHeader
        title="업적 배지"
        actionLabel={`${achieved}/${badges.length} 달성`}
      />
      <TossCard>
        <div className="grid grid-cols-3 gap-3">
          {sorted.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center text-center py-3"
              style={{ opacity: badge.condition ? 1 : 0.35 }}
            >
              {/* 원형 배지 아이콘 */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full mb-2"
                style={{
                  backgroundColor: badge.condition ? badge.color : "var(--color-surface)",
                }}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{
                    color: badge.condition ? "#FFFFFF" : "var(--color-text-disabled)",
                  }}
                >
                  {badge.condition ? badge.icon : "lock"}
                </span>
              </div>
              {/* 배지 이름 */}
              <p
                className="text-xs font-bold"
                style={{ color: badge.condition ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}
              >
                {badge.label}
              </p>
              {/* 배지 설명 */}
              <p
                className="text-[10px] mt-0.5 leading-tight"
                style={{ color: "var(--color-text-muted)" }}
              >
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </TossCard>
    </div>
  );
}

export default function ProfilePage() {
  // API 호출 로직 100% 유지
  const { data: profile, isLoading } = useSWR<ProfileData>("/api/web/profile", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const { data: statsRaw } = useSWR<StatsData>("/api/web/profile/stats", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  // 게이미피케이션 데이터 (XP/레벨/스트릭/뱃지/도장깨기)
  const { data: gamification } = useSWR<GamificationData>("/api/web/profile/gamification", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // 로딩 상태: 토스 스타일 심플 로더
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

  // 에러/미로그인 상태
  if (!profile || "error" in profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span
            className="material-symbols-outlined text-5xl mb-4 block"
            style={{ color: "var(--color-text-disabled)" }}
          >
            person_off
          </span>
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>로그인이 필요합니다</p>
          <Link
            href="/login"
            className="inline-block rounded-xl px-8 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  const { user, teams = [], recent_games: recentGames = [] } = profile;
  const displayName = user.nickname ?? "사용자";
  const initial = displayName.trim()[0]?.toUpperCase() || "U";
  const totalGames = user.total_games_participated ?? 0;
  // 게이미피케이션 기반 레벨/칭호 (기존 getTierInfo 대체)
  const gLevel = gamification?.level ?? 1;
  const gTitle = gamification?.title ?? "루키";
  const gEmoji = gamification?.emoji ?? "";
  const tier = getTierInfo(totalGames); // 기존 호환성 유지
  const winRate = statsRaw?.win_rate;

  // 스탯 데이터 추출
  const avgPoints = statsRaw?.career_averages?.avg_points ?? 0;
  const avgRebounds = statsRaw?.career_averages?.avg_rebounds ?? 0;
  const avgAssists = statsRaw?.career_averages?.avg_assists ?? 0;

  return (
    /* 토스 스타일: 1열 세로 스택, 최대 640px */
    <div className="max-w-[640px] mx-auto space-y-8">

      {/* ==== 1. 프로필 헤더: 큰 아바타 + 이름 + 레벨 ==== */}
      <div className="flex flex-col items-center text-center pt-4">
        {/* 큰 원형 아바타 (80px) */}
        <div
          className="w-20 h-20 rounded-full overflow-hidden mb-4 relative"
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

        {/* 이름 */}
        <h1
          className="text-xl font-bold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {displayName}
        </h1>

        {/* 레벨 배지 + 포지션 (XP 기반) */}
        <div className="flex items-center gap-2 mb-2">
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

        {/* 부가 정보: 지역 + 가입일 */}
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {[
            user.city,
            user.created_at ? `${new Date(user.created_at).getFullYear()}년 가입` : null,
          ].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* ==== 2. 핵심 통계: 토스 숫자 강조 패턴 ==== */}
      <div className="grid grid-cols-3 gap-3">
        {/* 총 경기 */}
        <TossCard className="text-center">
          <p
            className="text-3xl font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {totalGames}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            총 경기
          </p>
        </TossCard>

        {/* 승률 */}
        <TossCard className="text-center">
          <p
            className="text-3xl font-bold mb-1"
            style={{ color: "var(--color-primary)" }}
          >
            {winRate != null ? `${winRate}%` : "-"}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            승률
          </p>
        </TossCard>

        {/* PPG */}
        <TossCard className="text-center">
          <p
            className="text-3xl font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {avgPoints > 0 ? avgPoints.toFixed(1) : "-"}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            PPG
          </p>
        </TossCard>
      </div>

      {/* ==== 3. 세부 스탯 카드 ==== */}
      {statsRaw?.career_averages && (
        <TossCard>
          <TossSectionHeader title="커리어 평균" />
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                {avgRebounds.toFixed(1)}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>RPG</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                {avgAssists.toFixed(1)}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>APG</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                {(statsRaw.career_averages.avg_steals ?? 0).toFixed(1)}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>SPG</p>
            </div>
          </div>
        </TossCard>
      )}

      {/* ==== 4. 소속 팀: TossListItem 리스트 ==== */}
      <div>
        <TossSectionHeader title="소속 팀" actionLabel="전체보기" actionHref="/teams" />
        <TossCard className="p-0">
          {teams.length > 0 ? (
            teams.map((team) => (
              <TossListItem
                key={team.id}
                icon="groups"
                iconBg="var(--color-primary)"
                title={team.name}
                subtitle={team.role === "owner" ? "팀장" : "팀원"}
                href={`/teams/${team.id}`}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <span
                className="material-symbols-outlined text-3xl mb-2 block"
                style={{ color: "var(--color-text-disabled)" }}
              >
                group_add
              </span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                소속 팀이 없어요
              </p>
              <Link
                href="/teams"
                className="inline-block mt-2 text-xs font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                팀 찾아보기
              </Link>
            </div>
          )}
        </TossCard>
      </div>

      {/* ==== 5. 최근 경기: TossListItem 리스트 ==== */}
      <div>
        <TossSectionHeader title="최근 경기" actionLabel="전체보기" actionHref="/games" />
        <TossCard className="p-0">
          {recentGames.length > 0 ? (
            recentGames.slice(0, 5).map((game) => (
              <TossListItem
                key={game.id}
                icon="sports_basketball"
                iconBg="var(--color-accent)"
                title={game.title ?? "경기"}
                subtitle={game.scheduled_at
                  ? new Date(game.scheduled_at).toLocaleDateString("ko-KR")
                  : "일정 미정"}
                rightText={getGameStatus(game.status)}
                href={`/games/${game.id}`}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <span
                className="material-symbols-outlined text-3xl mb-2 block"
                style={{ color: "var(--color-text-disabled)" }}
              >
                sports_basketball
              </span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                아직 경기 기록이 없어요
              </p>
              {/* 빈 상태 CTA: 경기 찾기로 유도 */}
              <Link
                href="/games"
                className="mt-3 inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-light)]"
              >
                <span className="material-symbols-outlined text-base">search</span>
                경기 찾아보기
              </Link>
            </div>
          )}
        </TossCard>
      </div>

      {/* ==== 6. 게이미피케이션 섹션: XP/스트릭/도장깨기/뱃지 ==== */}
      {gamification && (
        <>
          {/* XP 진행률 + 레벨 */}
          <XpLevelCard
            xp={gamification.xp}
            level={gamification.level}
            title={gamification.title}
            emoji={gamification.emoji}
            progress={gamification.progress}
            nextLevelXp={gamification.next_level_xp}
            xpToNextLevel={gamification.xp_to_next_level}
          />

          {/* 연속 출석 스트릭 */}
          <StreakCard streak={gamification.streak} />

          {/* 도장깨기 진행률 */}
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
        </>
      )}

      {/* ==== 7. 기존 업적 배지 (경기 기반): 조건 기반 달성 배지 ==== */}
      <AchievementBadges
        totalGames={totalGames}
        avgPoints={avgPoints}
        teams={teams}
      />

      {/* ==== 8. 설정 메뉴: TossListItem 리스트 ==== */}
      <div>
        <TossSectionHeader title="설정" />
        <TossCard className="p-0">
          {/* 주간 운동 리포트 진입점 */}
          <TossListItem
            icon="bar_chart"
            iconBg="var(--color-info, #0079B9)"
            title="주간 운동 리포트"
            subtitle="이번주 운동 요약과 지난주 비교"
            href="/profile/weekly-report"
          />
          <TossListItem
            icon="edit"
            iconBg="var(--color-text-secondary)"
            title="프로필 편집"
            subtitle="이름, 포지션, 프로필 사진 변경"
            href="/profile/edit"
          />
          <TossListItem
            icon="tune"
            iconBg="var(--color-text-secondary)"
            title="선호 설정"
            subtitle="관심 카테고리, 알림 설정"
            href="/profile/preferences"
          />
          {/* 로그아웃: 빨간 아이콘으로 구분 */}
          <TossListItem
            icon="logout"
            iconBg="var(--color-error, #EF4444)"
            title="로그아웃"
            showArrow={false}
            onClick={async () => {
              await fetch("/api/web/logout", { method: "POST", credentials: "include" });
              window.location.href = "/login";
            }}
          />
        </TossCard>
      </div>
    </div>
  );
}
