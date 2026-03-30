"use client";

/**
 * 주간 운동 리포트 페이지 (/profile/weekly-report)
 *
 * 이번주 + 지난주 운동 데이터를 카드형으로 시각화
 * - 핵심 수치: 운동 시간, 방문 코트, 운동 일수, 획득 XP
 * - 지난주 대비 변화율 표시
 * - 자주 방문한 코트 TOP 3
 * - 토스 디자인 시스템 적용 (TossCard, CSS 변수)
 */

import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

// ── 타입 정의 ──
interface WeekData {
  session_count: number;
  total_minutes: number;
  unique_courts: number;
  active_days: number;
  total_xp: number;
  top_courts: { court_id: string; name: string; visits: number }[];
}

interface ReportData {
  nickname: string;
  level: number;
  title: string;
  emoji: string;
  streak: number;
  this_week: WeekData;
  last_week: WeekData;
  minutes_change: number;
  period: {
    this_week_start: string;
    last_week_start: string;
    last_week_end: string;
  };
}

// 분 -> "1시간 30분" 또는 "45분" 포맷
function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0분";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

// 날짜 포맷: "3/24 (월)"
function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  // KST 변환
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const month = kst.getUTCMonth() + 1;
  const day = kst.getUTCDate();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[kst.getUTCDay()];
  return `${month}/${day} (${dayName})`;
}

// 변화율 표시 컴포넌트: +12% 녹색, -5% 빨간색
function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return null;

  const isPositive = value > 0;
  const color = isPositive ? "var(--color-success, #22C55E)" : "var(--color-primary)";
  const icon = isPositive ? "trending_up" : "trending_down";

  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold" style={{ color }}>
      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
        {icon}
      </span>
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}

// ── 핵심 통계 카드 컴포넌트 ──
function StatCard({
  icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <TossCard className="text-center py-5">
      {/* 아이콘 */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full mx-auto mb-3"
        style={{ backgroundColor: iconColor }}
      >
        <span className="material-symbols-outlined text-xl text-white">{icon}</span>
      </div>
      {/* 큰 숫자 */}
      <p
        className="text-2xl font-bold mb-0.5"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </p>
      {/* 라벨 */}
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      {/* 부가 정보 (변화율 등) */}
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          {sub}
        </p>
      )}
    </TossCard>
  );
}

export default function WeeklyReportPage() {
  const router = useRouter();

  // 주간 리포트 데이터 패칭
  const { data, isLoading, error } = useSWR<ReportData>(
    "/api/web/profile/weekly-report",
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // 로딩 상태
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
            리포트를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 에러 또는 미인증 상태
  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span
            className="material-symbols-outlined text-5xl mb-4 block"
            style={{ color: "var(--color-text-disabled)" }}
          >
            error_outline
          </span>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            리포트를 불러올 수 없습니다
          </p>
          <Link
            href="/profile"
            className="inline-block rounded-xl px-6 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            프로필로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { this_week: tw, last_week: lw } = data;

  // 이번주가 비어있으면 "아직 운동 기록이 없어요" 안내
  const hasThisWeekData = tw.session_count > 0;
  const hasLastWeekData = lw.session_count > 0;

  return (
    <div className="max-w-[640px] mx-auto space-y-6 pb-8">
      {/* ── 헤더: 뒤로가기 + 제목 ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface-bright)]"
          aria-label="뒤로가기"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            arrow_back
          </span>
        </button>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          주간 운동 리포트
        </h1>
      </div>

      {/* ── 인사 + 요약 카드 ── */}
      <TossCard>
        <div className="text-center">
          {/* 레벨 이모지 + 인사 */}
          <p className="text-3xl mb-2">{data.emoji || ""}</p>
          <p
            className="text-lg font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {data.nickname}님의 주간 리포트
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Lv.{data.level} {data.title}
            {data.streak > 0 && (
              <span className="ml-2">
                <span className="material-symbols-outlined align-middle" style={{ fontSize: "14px", color: "var(--color-accent, #F59E0B)" }}>
                  local_fire_department
                </span>
                {" "}{data.streak}일 연속 출석
              </span>
            )}
          </p>
        </div>
      </TossCard>

      {/* ── 이번주 핵심 통계 (2x2 그리드) ── */}
      <div>
        <TossSectionHeader title="이번주" />

        {hasThisWeekData ? (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="schedule"
              iconColor="var(--color-primary)"
              label="운동 시간"
              value={formatMinutes(tw.total_minutes)}
            />
            <StatCard
              icon="location_on"
              iconColor="var(--color-info, #0079B9)"
              label="방문 코트"
              value={`${tw.unique_courts}곳`}
            />
            <StatCard
              icon="calendar_today"
              iconColor="var(--color-accent, #F59E0B)"
              label="운동 일수"
              value={`${tw.active_days}일`}
            />
            <StatCard
              icon="bolt"
              iconColor="var(--color-tertiary, #8B5CF6)"
              label="획득 XP"
              value={`+${tw.total_xp}`}
            />
          </div>
        ) : (
          // 이번주 데이터 없음
          <TossCard className="text-center py-8">
            <span
              className="material-symbols-outlined text-4xl mb-3 block"
              style={{ color: "var(--color-text-disabled)" }}
            >
              fitness_center
            </span>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              이번주는 아직 운동 기록이 없어요
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              코트에서 체크인하면 리포트에 반영됩니다
            </p>
            <Link
              href="/courts"
              className="mt-4 inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined text-base">search</span>
              근처 코트 찾기
            </Link>
          </TossCard>
        )}
      </div>

      {/* ── 지난주 대비 비교 ── */}
      {hasLastWeekData && (
        <div>
          <TossSectionHeader title="지난주 비교" />
          <TossCard>
            {/* 기간 표시 */}
            <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
              {formatDate(data.period.last_week_start)} ~ {formatDate(data.period.last_week_end)}
            </p>

            {/* 비교 행 목록 */}
            <div className="space-y-3">
              {/* 운동 시간 비교 */}
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  운동 시간
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {formatMinutes(lw.total_minutes)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
                    →
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {formatMinutes(tw.total_minutes)}
                  </span>
                  <ChangeIndicator value={data.minutes_change} />
                </div>
              </div>

              {/* 운동 횟수 비교 */}
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  운동 횟수
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {lw.session_count}회
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
                    →
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {tw.session_count}회
                  </span>
                </div>
              </div>

              {/* 방문 코트 비교 */}
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  방문 코트
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {lw.unique_courts}곳
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
                    →
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {tw.unique_courts}곳
                  </span>
                </div>
              </div>

              {/* 획득 XP 비교 */}
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  획득 XP
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    +{lw.total_xp}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
                    →
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    +{tw.total_xp}
                  </span>
                </div>
              </div>
            </div>
          </TossCard>
        </div>
      )}

      {/* ── 자주 방문한 코트 TOP 3 ── */}
      {tw.top_courts.length > 0 && (
        <div>
          <TossSectionHeader title="자주 방문한 코트" />
          <TossCard className="p-0">
            {tw.top_courts.map((court, idx) => (
              <Link
                key={court.court_id}
                href={`/courts/${court.court_id}`}
                className="block"
              >
                <div className="flex items-center gap-3 py-4 px-5 border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-surface-bright)]">
                  {/* 순위 뱃지 */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor:
                        idx === 0
                          ? "var(--color-accent, #F59E0B)"
                          : idx === 1
                            ? "var(--color-tier-silver, #94A3B8)"
                            : "var(--color-tier-bronze, #CD7F32)",
                      color: "#FFFFFF",
                    }}
                  >
                    {idx + 1}
                  </div>
                  {/* 코트 이름 */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {court.name}
                    </p>
                  </div>
                  {/* 방문 횟수 */}
                  <span
                    className="text-sm font-bold shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {court.visits}회
                  </span>
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: "var(--color-text-disabled)" }}
                  >
                    chevron_right
                  </span>
                </div>
              </Link>
            ))}
          </TossCard>
        </div>
      )}

      {/* ── 지난주 자주 방문 코트 (이번주 데이터 없을 때 지난주 보여주기) ── */}
      {!hasThisWeekData && lw.top_courts.length > 0 && (
        <div>
          <TossSectionHeader title="지난주 자주 방문한 코트" />
          <TossCard className="p-0">
            {lw.top_courts.map((court, idx) => (
              <Link
                key={court.court_id}
                href={`/courts/${court.court_id}`}
                className="block"
              >
                <div className="flex items-center gap-3 py-4 px-5 border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-surface-bright)]">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor:
                        idx === 0
                          ? "var(--color-accent, #F59E0B)"
                          : idx === 1
                            ? "var(--color-tier-silver, #94A3B8)"
                            : "var(--color-tier-bronze, #CD7F32)",
                      color: "#FFFFFF",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {court.name}
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {court.visits}회
                  </span>
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: "var(--color-text-disabled)" }}
                  >
                    chevron_right
                  </span>
                </div>
              </Link>
            ))}
          </TossCard>
        </div>
      )}

      {/* ── 하단 안내 ── */}
      <div className="text-center pb-4">
        <p className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
          매주 월요일에 새로운 리포트가 업데이트됩니다
        </p>
      </div>
    </div>
  );
}
