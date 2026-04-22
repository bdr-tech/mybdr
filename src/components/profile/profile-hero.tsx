"use client";

/**
 * ProfileHero — 공용 프로필 헤더 (본인 / 타인 통합)
 *
 * 왜:
 * - 기존에는 `/profile` 전용 profile-hero.tsx(274L)와 `/users/[id]/page.tsx` 인라인 JSX(~140L)에
 *   동일 디자인의 Hero가 두 벌로 존재해 유지보수 비용이 컸다.
 * - L2 설계에서 "단일 `/users/[id]` + 본인 분기"가 확정되었고, 본인 대시보드(/profile)도
 *   동일 Hero 컴포넌트를 재사용하게끔 정리.
 *
 * 어떻게:
 * - viewMode="owner" | "visitor" 플래그는 쓰지 않고, 액션 영역을 **슬롯(ReactNode) 주입**으로 처리.
 *   → 본인=편집 버튼, 타인=ActionButtons(팔로우/메시지) 외부에서 렌더.
 *   → 컴포넌트 내부 조건 분기 최소화, 확장 용이.
 * - 레벨 배지(levelInfo)는 본인·타인 공통으로 주입 (L2 Q4: 티어 제거, 레벨 통합).
 * - 포지션/지역/신장 메타는 그대로 유지.
 * - 통계 그리드는 4칸 (경기수/팔로워/승률/팔로잉) — 기존 /profile Hero와 동일 구성.
 * - 색상은 전부 CSS 변수. 4px radius.
 */

import Image from "next/image";
import type { ReactNode } from "react";

import { MiniStat } from "./mini-stat";

// 포지션 코드 → 한글 풀네임 매핑 (Hero에서 "PG (포인트가드)"처럼 병기)
const POSITION_LABEL: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

/** Hero에 필요한 User 필드 최소 집합 (본인/타인 공통) */
export interface ProfileHeroUser {
  id?: bigint;
  name?: string | null;
  nickname: string | null;
  profile_image_url: string | null;
  position: string | null;
  city: string | null;
  district?: string | null;
  height: number | null;
  bio?: string | null;
  total_games_participated: number | null;
}

/** 승률 등 통계 (getPlayerStats에서 오는 값) */
export interface ProfileHeroStats {
  winRate: number | null;
}

/** 레벨 배지 (본인·타인 동일 포맷) */
export interface ProfileHeroLevelInfo {
  level: number;
  title: string;
  emoji: string;
}

export interface ProfileHeroProps {
  user: ProfileHeroUser;
  stats: ProfileHeroStats | null;
  /** 레벨 배지 — null일 경우 배지 자체를 숨김 */
  levelInfo: ProfileHeroLevelInfo | null;
  followersCount: number;
  followingCount: number;
  /**
   * 이름 옆~아래 영역에 들어갈 액션 버튼 슬롯.
   * - 본인: "프로필 편집" 버튼 (OwnerEditButton)
   * - 타인: ActionButtons (팔로우/메시지)
   * - 비로그인 방문자: 버튼 없음 (undefined 허용)
   */
  actionSlot?: ReactNode;
}

export function ProfileHero({
  user,
  stats,
  levelInfo,
  followersCount,
  followingCount,
  actionSlot,
}: ProfileHeroProps) {
  // 표시 이름 우선순위: nickname > name > "사용자"
  const displayName = user.nickname ?? user.name ?? "사용자";
  // 이미지 없을 때 이니셜 fallback (한글 첫 글자 대비해 trim 후 첫 글자 추출)
  const initial = displayName.trim()[0]?.toUpperCase() ?? "U";
  // 지역 문자열: "서울 강남구" 형태 (둘 중 하나 null이면 있는 것만)
  const location = [user.city, user.district].filter(Boolean).join(" ");
  const totalGames = user.total_games_participated ?? 0;

  return (
    <section
      className="relative overflow-hidden rounded-lg border p-5 sm:p-6"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 배경 장식 — BDR Red 5% 투명도 (color-mix로 하드코딩 rgba 배제) */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-primary) 5%, transparent)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* ========== 아바타 ========== */}
        <div
          className="flex-shrink-0 overflow-hidden rounded-full border-4 p-1"
          style={{
            borderColor: "var(--color-primary)",
            backgroundColor: "var(--color-background)",
            width: "108px",
            height: "108px",
          }}
        >
          <div className="h-full w-full md:h-36 md:w-36 md:-m-1">
            {user.profile_image_url ? (
              <Image
                src={user.profile_image_url}
                alt={displayName}
                width={144}
                height={144}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-full text-4xl font-bold"
                style={{
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                {initial}
              </div>
            )}
          </div>
        </div>

        {/* ========== 이름 + 레벨 배지 + 메타 + 액션 슬롯 ========== */}
        <div className="flex-1 text-center md:text-left">
          {/* 이름 + 레벨 배지 가로 나란히 */}
          <div className="mb-2 flex flex-col items-center gap-2 md:flex-row md:items-center">
            <h1
              className="text-2xl font-semibold md:text-3xl"
              style={{ color: "var(--color-text-primary)" }}
            >
              {displayName}
            </h1>
            {/* 레벨 배지 — levelInfo가 null이면 렌더 안 함 */}
            {levelInfo && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary, #FFFFFF)",
                }}
              >
                {levelInfo.emoji && (
                  <span style={{ fontSize: "12px" }}>{levelInfo.emoji}</span>
                )}
                Lv.{levelInfo.level} {levelInfo.title}
              </span>
            )}
          </div>

          {/* 포지션 / 지역 / 신장 메타 (Material Symbols 고정) */}
          <div
            className="mb-4 flex flex-wrap items-center justify-center gap-4 text-sm md:justify-start"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {user.position && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  sports_basketball
                </span>
                {user.position}
                {POSITION_LABEL[user.position]
                  ? ` (${POSITION_LABEL[user.position]})`
                  : ""}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  location_on
                </span>
                {location}
              </span>
            )}
            {user.height && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  straighten
                </span>
                {user.height}cm
              </span>
            )}
          </div>

          {/* 액션 슬롯 — 본인: 편집, 타인: 팔로우/메시지 */}
          {actionSlot && (
            <div className="flex justify-center md:justify-start">
              {actionSlot}
            </div>
          )}
        </div>

        {/* ========== 통계 4칸 ========== */}
        <div className="grid w-full grid-cols-4 gap-2 md:w-auto md:grid-cols-2 md:gap-3">
          <MiniStat label="경기수" value={totalGames} />
          <MiniStat label="팔로워" value={followersCount} />
          <MiniStat
            label="승률"
            value={stats?.winRate != null ? `${stats.winRate}%` : "-%"}
            highlight
          />
          <MiniStat label="팔로잉" value={followingCount} />
        </div>
      </div>

      {/* 바이오는 구분선 아래 표시 */}
      {user.bio && (
        <p
          className="relative mt-5 border-t pt-4 text-sm leading-relaxed"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          {user.bio}
        </p>
      )}
    </section>
  );
}
