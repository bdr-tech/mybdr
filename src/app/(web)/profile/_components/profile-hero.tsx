"use client";

/* ============================================================
 * ProfileHero — /profile 허브 통합 대시보드의 상단 히어로
 *
 * 왜:
 *  - /profile 이 4카드 허브에서 통합 대시보드로 바뀌면서,
 *    타인 프로필(/users/[id])의 히어로와 시각적으로 유사하지만
 *    "본인 프로필 전용 액션"(편집 버튼)만 노출되는 헤더가 필요.
 *  - 팔로우/메시지 버튼은 본인에게 무의미 → 제거.
 *
 * 어떻게:
 *  - /users/[id]/page.tsx 라인 180~335의 서버 JSX를 클라이언트 컴포넌트로 이식.
 *  - props: user (프로필 기본) + stats (승률) + gamification (레벨/칭호) + followersCount/followingCount.
 *  - 이미지 없으면 이니셜 fallback (기존 /users 히어로와 동일 패턴).
 * ============================================================ */

import Image from "next/image";
import Link from "next/link";

// 포지션 한글 매핑 — 타인 프로필과 동일
const POSITION_LABEL: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

export interface ProfileHeroUser {
  nickname: string | null;
  name?: string | null;
  position: string | null;
  height: number | null;
  city: string | null;
  district?: string | null;
  bio?: string | null;
  profile_image_url: string | null;
  total_games_participated: number | null;
}

export interface ProfileHeroStats {
  // winRate: getPlayerStats 응답 — 경기 없으면 null
  winRate: number | null;
}

export interface ProfileHeroGamification {
  level: number;
  title: string;
  emoji: string;
}

export interface ProfileHeroProps {
  user: ProfileHeroUser;
  stats: ProfileHeroStats | null;
  gamification: ProfileHeroGamification | null;
  followersCount: number;
  followingCount: number;
}

export function ProfileHero({
  user,
  stats,
  gamification,
  followersCount,
  followingCount,
}: ProfileHeroProps) {
  // 표시 이름: nickname > name > "사용자"
  const displayName = user.nickname ?? user.name ?? "사용자";
  const initial = displayName.trim()[0]?.toUpperCase() || "U";
  // 지역 표시: "서울 강남구" 형태
  const location = [user.city, user.district].filter(Boolean).join(" ");
  const totalGames = user.total_games_participated ?? 0;
  // 레벨/칭호 기본값 (로딩 중 또는 응답 실패 시)
  const gLevel = gamification?.level ?? 1;
  const gTitle = gamification?.title ?? "루키";
  const gEmoji = gamification?.emoji ?? "";

  return (
    <section
      className="relative overflow-hidden rounded-lg border p-5 sm:p-6"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 배경 장식 — 타인 프로필과 동일 톤 (BDR Red 살짝).
          color-mix로 --color-primary 5% 투명도 적용 → 하드코딩 rgba 제거로 브랜드 리프레시 대응 용이. */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-primary) 5%, transparent)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* ========== 아바타 — 모바일 108 / PC 144, BDR Red 원형 테두리 ========== */}
        <div
          className="flex-shrink-0 overflow-hidden rounded-full border-4 p-1"
          style={{
            borderColor: "var(--color-primary)",
            backgroundColor: "var(--color-background)",
            width: "108px",
            height: "108px",
          }}
        >
          {/* md 이상에서는 144x144로 렌더링. Tailwind에서 sm:w-36 md:h-36 대신 */}
          {/* 고정 px로 두는 편이 렌더 안정적이라 inline style 유지. */}
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
              // 이미지 없으면 이니셜 + 그라디언트 배경 fallback (CLAUDE.md 디자인 규칙)
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

        {/* ========== 중앙: 이름 + 레벨 배지 + 포지션/지역/신장 + 편집 버튼 ========== */}
        <div className="flex-1 text-center md:text-left">
          {/* 이름 + 레벨 배지 */}
          <div className="mb-2 flex flex-col items-center gap-2 md:flex-row md:items-center">
            <h1
              className="text-2xl font-semibold md:text-3xl"
              style={{ color: "var(--color-text-primary)" }}
            >
              {displayName}
            </h1>
            {/* 레벨 배지 — 기존 허브 페이지의 배지 패턴 유지 (BDR Red + 흰 텍스트) */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary, #FFFFFF)",
              }}
            >
              {gEmoji && <span style={{ fontSize: "12px" }}>{gEmoji}</span>}
              Lv.{gLevel} {gTitle}
            </span>
          </div>

          {/* 포지션 / 지역 / 신장 — 작은 회색 메타 정보 */}
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

          {/* 프로필 편집 버튼 — BDR Red outline + 4px radius + Material Symbols edit */}
          <div className="flex justify-center md:justify-start">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-surface-bright,var(--color-surface))]"
              style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
                // 4px border-radius — CLAUDE.md 컨벤션
                borderRadius: "4px",
              }}
            >
              <span className="material-symbols-outlined text-base">edit</span>
              프로필 편집
            </Link>
          </div>
        </div>

        {/* ========== 미니 통계 4칸 (경기수 / 팔로워 / 승률 / 팔로잉) ========== */}
        {/* 모바일: 2x2 그리드로 접기, md+ 부터 우측 배치 */}
        <div className="grid w-full grid-cols-4 gap-2 md:w-auto md:grid-cols-2 md:gap-3">
          <MiniStat label="경기수" value={totalGames.toString()} />
          <MiniStat label="팔로워" value={followersCount.toString()} />
          <MiniStat
            label="승률"
            // winRate이 null인 경우 "-%" 로 표시 (DB 미지원 기능 처리 규칙)
            value={stats?.winRate != null ? `${stats.winRate}%` : "-%"}
            highlight
          />
          <MiniStat label="팔로잉" value={followingCount.toString()} />
        </div>
      </div>

      {/* 바이오가 있으면 하단 구분선 아래 표시 */}
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

/** 미니 통계 1칸 — 라벨(상단, 작은 회색) + 숫자(하단, 큰 볼드) */
function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  // 승률 등 강조 칸: BDR Red 숫자
  highlight?: boolean;
}) {
  return (
    <div
      className="min-w-[72px] rounded-md p-3 text-center md:min-w-[90px]"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <p
        className="mb-1 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-lg font-bold md:text-xl"
        style={{
          color: highlight
            ? "var(--color-primary)"
            : "var(--color-text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
