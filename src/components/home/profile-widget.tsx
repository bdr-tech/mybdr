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

// D-Day 계산 헬퍼 (짧은 형태)
function getDDayShort(dateStr: string): string {
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return "오늘";
  return `D-${diff}`;
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

  // 로딩 중: 스켈레톤 카드
  if (isLoading) {
    return (
      <div
        className="rounded-md border p-5 animate-pulse bg-[var(--color-card)] border-[var(--color-border)]"
      >
        {/* 스켈레톤도 가로 레이아웃에 맞춤 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-md shrink-0" style={{ backgroundColor: "var(--color-surface)" }} />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
            <div className="h-3 w-16 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
          </div>
        </div>
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
      className="rounded-md border p-5 bg-[var(--color-card)] border-[var(--color-border)] shadow-sm hover:shadow-glow-primary transition-shadow duration-300"
    >
      {/* 상단: 아바타(좌) + 정보(우) 가로 배치 */}
      <div className="flex items-center gap-4 mb-4">
        {/* 아바타: 좌측 고정, 가로 레이아웃에 맞게 크기 확대 */}
        <div
          className="w-16 h-16 rounded-md flex items-center justify-center text-2xl font-black italic text-white shrink-0 shadow-inner"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, rgba(0,0,0,0.5) 100%)" }}
        >
          {initial}
        </div>
        {/* 우측: 닉네임 + 레벨뱃지를 세로 스택 */}
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <p
            className="text-lg font-black italic uppercase tracking-wide truncate pr-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {displayName}
          </p>
          {/* 레벨 뱃지 */}
          <span
            className="inline-flex items-center gap-1 text-[10px] font-black italic uppercase px-2 py-0.5 clip-slant w-fit"
            style={{
              backgroundColor: "var(--color-surface-bright)",
              color: "var(--color-text-primary)",
            }}
          >
            {gData.emoji} Lv.{gData.level} {gData.title}
          </span>
        </div>
      </div>

      {/* XP 진행률 바 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: "var(--color-text-muted)" }}>
            XP {gData.xp}
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>
            다음 레벨까지 {gData.xp_to_next_level}
          </span>
        </div>
        {/* 배경 바 */}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {/* 진행률 바: primary 색상, 부드러운 애니메이션 */}
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: "var(--color-primary)",
              width: `${Math.min(gData.progress * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* 3칸 통계: 연속 출석 / 체크인 / 뱃지 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox icon="local_fire_department" value={gData.streak} label="연속 출석" />
        <StatBox icon="location_on" value={gData.court_stamps.count} label="체크인" />
        <StatBox icon="military_tech" value={gData.badges.length} label="뱃지" />
      </div>

      {/* 구분선 */}
      <div
        className="border-t mb-3"
        style={{ borderColor: "var(--color-border)" }}
      />

      {/* 오늘의 미션 */}
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-outlined text-xl"
          style={{ color: "var(--color-primary)" }}
        >
          {missionIcon}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-black italic uppercase tracking-wide truncate pr-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {missionText}
          </p>
        </div>
        <span
          className="text-[10px] font-black italic uppercase whitespace-nowrap"
          style={{ color: "var(--color-primary)" }}
        >
          +{missionXp} XP
        </span>
      </div>

      {/* ─── 개인화 정보: 자주 가는 코트 + 다음 경기 ─── */}
      {dashboardData && (dashboardData.frequentCourts?.length > 0 || dashboardData.nextGame) && (
        <>
          <div
            className="border-t mt-3 mb-3"
            style={{ borderColor: "var(--color-border)" }}
          />
          <div className="space-y-2">
            {/* 자주 가는 코트 */}
            {dashboardData.frequentCourts.length > 0 && (
              <Link
                href={`/courts/${dashboardData.frequentCourts[0].id}`}
                className="flex items-center gap-2 group"
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  pin_drop
                </span>
                <span
                  className="text-[11px] font-bold italic uppercase tracking-wider truncate flex-1 group-hover:text-[var(--color-primary)] transition-colors pr-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {dashboardData.frequentCourts[0].name}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--color-text-disabled)" }}
                >
                  {dashboardData.frequentCourts[0].visitCount}회
                </span>
              </Link>
            )}
            {/* 다음 경기 */}
            {dashboardData.nextGame && (
              <Link
                href={`/games/${dashboardData.nextGame.uuid}`}
                className="flex items-center gap-2 group"
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={{ color: "var(--color-info)" }}
                >
                  sports_basketball
                </span>
                <span
                  className="text-[11px] font-bold italic uppercase tracking-wider truncate flex-1 group-hover:text-[var(--color-primary)] transition-colors pr-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {dashboardData.nextGame.title}
                </span>
                {dashboardData.nextGame.scheduledAt && (
                  <span
                    className="text-[10px] font-black italic text-[var(--color-card)] bg-[var(--color-info)] whitespace-nowrap px-1.5 py-0.5 clip-slant"
                  >
                    {getDDayShort(dashboardData.nextGame.scheduledAt)}
                  </span>
                )}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* 3칸 통계용 작은 박스 컴포넌트 */
function StatBox({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-2 clip-slant bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-card)] border-b-2 border-transparent hover:border-[var(--color-primary)] transition-all group"
    >
      <span
        className="material-symbols-outlined text-xl group-hover:text-[var(--color-primary)] transition-colors"
        style={{ color: "var(--color-text-muted)" }}
      >
        {icon}
      </span>
      <span
        className="text-[18px] font-black italic tracking-tighter"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-black italic uppercase tracking-widest"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}
