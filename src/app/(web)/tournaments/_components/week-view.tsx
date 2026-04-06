"use client";

/**
 * WeekView -- 주간 뷰 (7일 타임라인)
 *
 * 구조:
 * - 상단: 주 네비게이션 (이전주/다음주/이번주)
 * - 7열 CSS Grid (일~토), 각 열에 해당일 대회를 세로로 나열
 * - 모바일에서는 가로 스크롤 가능
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getCalendarColor } from "@/lib/constants/calendar-colors";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";

// 캘린더 API 응답 타입 (calendar-view와 동일)
interface CalendarTournament {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  venue_name: string | null;
  categories: Record<string, boolean> | null;
  division_tiers: string[] | null;
  format: string | null;
}

interface CalendarApiResponse {
  tournaments: CalendarTournament[];
  year: number;
  month: number;
}

const calendarFetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API error");
    return res.json() as Promise<CalendarApiResponse>;
  });

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface WeekViewProps {
  categoryFilter?: string;
  genderFilter?: string;
}

/**
 * 주의 시작일(일요일) 계산 유틸
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // 일요일로 이동
  return d;
}

/**
 * 날짜를 "M/D" 형식으로 포맷
 */
function formatMD(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function WeekView({ categoryFilter = "all", genderFilter = "all" }: WeekViewProps) {
  // 현재 표시 중인 주의 시작일 (일요일)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  // 주의 7일 배열 생성
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  // 이 주가 걸치는 월 정보 (API는 월 단위이므로, 주가 두 달에 걸칠 수 있음)
  const monthsToFetch = useMemo(() => {
    const startMonth = { year: weekDays[0].getFullYear(), month: weekDays[0].getMonth() + 1 };
    const endMonth = { year: weekDays[6].getFullYear(), month: weekDays[6].getMonth() + 1 };
    // 같은 월이면 1개, 다른 월이면 2개 fetch
    if (startMonth.year === endMonth.year && startMonth.month === endMonth.month) {
      return [startMonth];
    }
    return [startMonth, endMonth];
  }, [weekDays]);

  // 첫 번째 월 API
  const params1 = new URLSearchParams({
    year: String(monthsToFetch[0].year),
    month: String(monthsToFetch[0].month),
  });
  if (categoryFilter !== "all") params1.set("category", categoryFilter);
  if (genderFilter !== "all") params1.set("gender", genderFilter);

  const { data: data1, isLoading: loading1 } = useSWR(
    `/api/web/tournaments/calendar?${params1.toString()}`,
    calendarFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // 두 번째 월 API (주가 두 달에 걸칠 때만)
  const params2 = monthsToFetch.length > 1
    ? (() => {
        const p = new URLSearchParams({
          year: String(monthsToFetch[1].year),
          month: String(monthsToFetch[1].month),
        });
        if (categoryFilter !== "all") p.set("category", categoryFilter);
        if (genderFilter !== "all") p.set("gender", genderFilter);
        return p;
      })()
    : null;

  const { data: data2, isLoading: loading2 } = useSWR(
    params2 ? `/api/web/tournaments/calendar?${params2.toString()}` : null,
    calendarFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const isLoading = loading1 || loading2;

  // 모든 대회를 합치고 중복 제거
  const allTournaments = useMemo(() => {
    const map = new Map<string, CalendarTournament>();
    for (const t of (data1?.tournaments ?? [])) map.set(t.id, t);
    for (const t of (data2?.tournaments ?? [])) map.set(t.id, t);
    return Array.from(map.values());
  }, [data1, data2]);

  // 날짜별 대회 매핑
  const tournamentsByDay = useMemo(() => {
    const result: CalendarTournament[][] = Array.from({ length: 7 }, () => []);

    for (const t of allTournaments) {
      if (!t.start_date) continue;
      const start = new Date(t.start_date);
      start.setHours(0, 0, 0, 0);
      const end = t.end_date ? new Date(t.end_date) : new Date(start);
      end.setHours(23, 59, 59, 999);

      for (let i = 0; i < 7; i++) {
        const day = weekDays[i];
        if (day >= start && day <= end) {
          result[i].push(t);
        }
      }
    }
    return result;
  }, [allTournaments, weekDays]);

  // 네비게이션
  const goToPrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };
  const goToNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };
  const goToThisWeek = () => setWeekStart(getWeekStart(new Date()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 주 범위 표시 텍스트
  const weekLabel = `${weekDays[0].getFullYear()}년 ${formatMD(weekDays[0])} - ${formatMD(weekDays[6])}`;

  return (
    <div className="space-y-4">
      {/* 주 네비게이션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <h2 className="text-sm sm:text-lg font-bold text-[var(--color-text-primary)] min-w-[160px] text-center">
            {weekLabel}
          </h2>
          <button
            onClick={goToNextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
        <button
          onClick={goToThisWeek}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          이번주
        </button>
      </div>

      {/* 주간 그리드 */}
      <div className="rounded-md bg-[var(--color-card)] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* 모바일에서 가로 스크롤 */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* 요일 + 날짜 헤더 */}
            <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
              {weekDays.map((day, idx) => {
                const isToday = day.getTime() === today.getTime();
                return (
                  <div key={idx} className="py-2 px-1 text-center border-r border-[var(--color-border)] last:border-r-0">
                    <div
                      className="text-xs font-medium"
                      style={{
                        color: idx === 0 ? "#EF4444" : idx === 6 ? "#3B82F6" : "var(--color-text-muted)",
                      }}
                    >
                      {WEEKDAY_LABELS[idx]}
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                        isToday ? "bg-[var(--color-primary)] text-white" : ""
                      }`}
                      style={{
                        color: isToday
                          ? undefined
                          : idx === 0 ? "#EF4444"
                          : idx === 6 ? "#3B82F6"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 대회 콘텐츠 영역 */}
            {isLoading ? (
              <div className="grid grid-cols-7 h-48">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="border-r border-[var(--color-border)] last:border-r-0 p-1.5 space-y-1.5 animate-pulse">
                    <div className="h-12 rounded bg-[var(--color-surface)]" />
                    <div className="h-12 rounded bg-[var(--color-surface)]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7" style={{ minHeight: "200px" }}>
                {tournamentsByDay.map((dayTournaments, idx) => (
                  <div
                    key={idx}
                    className="border-r border-[var(--color-border)] last:border-r-0 p-1 space-y-1"
                  >
                    {dayTournaments.length === 0 && (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-[var(--color-text-disabled)]">-</span>
                      </div>
                    )}
                    {dayTournaments.map((t) => {
                      const color = getCalendarColor(t.categories, t.division_tiers);
                      return (
                        <Link
                          key={t.id}
                          href={`/tournaments/${t.id}`}
                          className="block rounded-md p-1.5 transition-opacity hover:opacity-80"
                          style={{ backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` }}
                        >
                          <p className="text-[10px] sm:text-xs font-bold truncate" style={{ color }}>
                            {t.name}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
                            {TOURNAMENT_STATUS_LABEL[t.status ?? ""] ?? ""}
                            {(t.venue_name || t.city) ? ` · ${t.venue_name ?? t.city}` : ""}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
