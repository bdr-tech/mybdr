"use client";

/* ============================================================
 * ProfileWidget — 로그인 유저 게이미피케이션 위젯
 *
 * 홈 히어로 상단에 표시되는 프로필 카드.
 * XP 진행률, 연속 출석, 체크인, 뱃지 + 오늘의 미션을 보여준다.
 * 비로그인 시에는 home-hero에서 이 컴포넌트를 렌더링하지 않는다.
 * ============================================================ */

import useSWR from "swr";
import Link from "next/link";
// DashboardData는 props에서 유지 (home-hero에서 전달) — 컴팩트 뷰에서는 렌더링하지 않음
import type { DashboardData } from "./home-hero";

// API 응답 타입 — /api/web/profile/gamification
interface GamificationData {
  xp: number;
  level: number;
  title: string;
  emoji: string;
  progress: number; // 0~1 사이 진행률
  next_level_xp: number;
  xp_to_next_level: number;
  streak: number;
  streak_last_date: string | null;
  badges: { id: string; badge_type: string; badge_name: string }[];
  court_stamps: { count: number };
}

// API 응답 타입 — /api/web/me
interface MeData {
  name: string;
  nickname?: string;
}

// 오늘 날짜를 YYYY-MM-DD 문자열로 반환 (한국 시간)
function getKoreanDateString(date: Date): string {
  return date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/\. /g, "-").replace(".", "");
}

// 날짜를 간단히 YYYY-MM-DD로 비교하기 위한 헬퍼
function toDateOnly(isoString: string): string {
  return isoString.split("T")[0];
}

interface ProfileWidgetProps {
  dashboardData?: DashboardData | null;
}

export function ProfileWidget({ dashboardData }: ProfileWidgetProps) {
  // 게이미피케이션 데이터 (XP, 레벨, 연속 출석, 뱃지)
  const { data: gData, isLoading: gLoading } = useSWR<GamificationData>(
    "/api/web/profile/gamification",
    { dedupingInterval: 30000 }
  );

  // 유저 기본 정보 (닉네임)
  const { data: meData, isLoading: meLoading } = useSWR<MeData>(
    "/api/web/me",
    { dedupingInterval: 30000 }
  );

  const isLoading = gLoading || meLoading;

  // 로딩 중: 2줄 컴팩트 스켈레톤
  if (isLoading) {
    return (
      <div
        className="rounded-md border p-3 animate-pulse bg-[var(--color-card)] border-[var(--color-border)]"
      >
        {/* 1줄: 아바타 + 닉네임 스켈레톤 */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-md shrink-0" style={{ backgroundColor: "var(--color-surface)" }} />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-20 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
            <div className="h-2.5 w-14 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
          </div>
        </div>
        {/* 2줄: XP 바 스켈레톤 */}
        <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-surface)" }} />
      </div>
    );
  }

  // 데이터 없으면 렌더링 안 함
  if (!gData || !meData) return null;

  const displayName = meData.nickname || meData.name;
  // 아바타 이니셜: 이름의 첫 글자
  const initial = displayName.charAt(0).toUpperCase();

  // 오늘의 미션 결정 로직
  const today = new Date();
  const todayStr = getKoreanDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getKoreanDateString(yesterday);

  let missionIcon = "location_on";
  let missionText = "코트에 체크인하기";
  let missionXp = 10;

  if (gData.streak_last_date) {
    const lastDate = toDateOnly(gData.streak_last_date);
    if (lastDate === todayStr) {
      // 오늘 이미 체크인함 → 리뷰 미션
      missionIcon = "rate_review";
      missionText = "리뷰 작성하기";
      missionXp = 15;
    } else if (lastDate === yesterdayStr) {
      // 어제 체크인함 → 연속 출석 이어가기
      missionIcon = "local_fire_department";
      missionText = "연속 출석 이어가기! 체크인";
      missionXp = 10;
    }
  }

  return (
    <div
      className="rounded-md border p-3 bg-[var(--color-card)] border-[var(--color-border)] shadow-sm hover:shadow-glow-primary transition-shadow duration-300"
    >
      {/* ─── 1줄: 아바타 + 닉네임 + 레벨뱃지 (좌) | 통계 3개 인라인 (우) ─── */}
      <div className="flex items-center gap-2.5 mb-2">
        {/* 아바타: 40x40으로 축소 */}
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center text-base font-black text-white shrink-0 shadow-inner"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, rgba(0,0,0,0.5) 100%)" }}
        >
          {initial}
        </div>

        {/* 닉네임 + 레벨뱃지 */}
        <div className="min-w-0 flex items-center gap-2 flex-1">
          <p
            className="text-base font-black uppercase tracking-wide truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {displayName}
          </p>
          {/* 레벨 뱃지: 크기 축소 */}
          <span
            className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0"
            style={{
              backgroundColor: "var(--color-surface-bright)",
              color: "var(--color-text-primary)",
            }}
          >
            {gData.emoji} Lv.{gData.level} {gData.title}
          </span>
        </div>

        {/* 우측 통계 3개: 아이콘+숫자 인라인 */}
        <div className="flex items-center gap-2.5 shrink-0">
          <StatInline icon="local_fire_department" value={gData.streak} />
          <StatInline icon="location_on" value={gData.court_stamps.count} />
          <StatInline icon="military_tech" value={gData.badges.length} />
        </div>
      </div>

      {/* ─── 2줄: XP 바 + 미션 ─── */}
      <div className="flex items-center gap-3">
        {/* XP 바 영역: 좌측 절반~2/3 */}
        <div className="flex-1 min-w-0">
          {/* XP 텍스트 */}
          <div className="flex justify-between text-[10px] mb-0.5">
            <span style={{ color: "var(--color-text-muted)" }}>
              XP {gData.xp}
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>
              {gData.next_level_xp}
            </span>
          </div>
          {/* XP 프로그레스 바: 얇게 */}
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: "var(--color-primary)",
                width: `${Math.min(gData.progress * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 미션: 우측에 한 줄로 */}
        <Link
          href="/profile#gamification"
          className="flex items-center gap-1.5 shrink-0 group"
        >
          <span
            className="material-symbols-outlined text-base"
            style={{ color: "var(--color-primary)" }}
          >
            {missionIcon}
          </span>
          <span
            className="text-[10px] font-black uppercase tracking-wide whitespace-nowrap group-hover:text-[var(--color-primary)] transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {missionText}
          </span>
          <span
            className="text-[10px] font-black uppercase whitespace-nowrap"
            style={{ color: "var(--color-primary)" }}
          >
            +{missionXp}XP
          </span>
          <span
            className="material-symbols-outlined text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            chevron_right
          </span>
        </Link>
      </div>
    </div>
  );
}

/* 인라인 통계: 아이콘(14px) + 숫자를 가로로 나열하는 컴팩트 컴포넌트 */
function StatInline({
  icon,
  value,
}: {
  icon: string;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span
        className="material-symbols-outlined text-sm"
        style={{ color: "var(--color-text-muted)", fontSize: "14px" }}
      >
        {icon}
      </span>
      <span
        className="text-xs font-black"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </span>
    </span>
  );
}
