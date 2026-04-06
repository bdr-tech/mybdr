"use client";

/**
 * CalendarView -- 월간 캘린더 뷰 (CSS Grid 기반, 외부 라이브러리 없음)
 *
 * 구조:
 * - 상단: 월 네비게이션 (chevron_left / chevron_right)
 * - 7열 CSS Grid (일~토)
 * - 각 날짜 셀에 해당일 대회를 색상 바로 표시
 * - 대회 클릭 시 상세 페이지로 이동
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getCalendarColor, CALENDAR_COLOR_LEGEND } from "@/lib/constants/calendar-colors";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";

// 캘린더 API 응답의 대회 타입
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

// API fetcher
const calendarFetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API error");
    return res.json() as Promise<CalendarApiResponse>;
  });

// 요일 라벨 (일요일 시작)
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarViewProps {
  categoryFilter?: string;
  genderFilter?: string;
}

export function CalendarView({ categoryFilter = "all", genderFilter = "all" }: CalendarViewProps) {
  // 현재 표시 중인 년/월 상태
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  // 선택된 날짜 (클릭 시 해당 날짜 대회 목록 표시)
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  // 범례 표시 여부
  const [showLegend, setShowLegend] = useState(false);

  // 월 변경 시 선택 날짜 초기화
  useEffect(() => {
    setSelectedDate(null);
  }, [year, month]);

  // API URL 구성 (category/gender 필터 포함)
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (genderFilter !== "all") params.set("gender", genderFilter);
    return `/api/web/tournaments/calendar?${params.toString()}`;
  }, [year, month, categoryFilter, genderFilter]);

  const { data, isLoading } = useSWR(apiUrl, calendarFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const tournaments = data?.tournaments ?? [];

  // 이전/다음 월 이동
  const goToPrevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const goToNextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };
  const goToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  // 해당 월의 달력 그리드 데이터 계산
  const calendarGrid = useMemo(() => {
    // 해당 월의 1일이 무슨 요일인지 (0=일, 6=토)
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    // 해당 월의 마지막 날짜
    const daysInMonth = new Date(year, month, 0).getDate();

    // 셀 배열: 빈 칸(null) + 날짜(number)
    const cells: (number | null)[] = [];

    // 1일 이전 빈 칸
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    // 1일 ~ 마지막 날
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return cells;
  }, [year, month]);

  // 날짜별 대회 매핑 (key: 날짜 숫자, value: 대회 배열)
  const tournamentsByDate = useMemo(() => {
    const map: Record<number, CalendarTournament[]> = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    for (const t of tournaments) {
      if (!t.start_date) continue;
      const start = new Date(t.start_date);
      const end = t.end_date ? new Date(t.end_date) : start;

      // 해당 월 범위 내의 날짜만 계산
      const rangeStart = Math.max(1, start.getDate());
      const rangeEnd = Math.min(daysInMonth, end.getDate());

      // 시작월이 현재 표시 월보다 이전이면 1일부터
      const startDay = (start.getFullYear() === year && start.getMonth() + 1 === month)
        ? start.getDate() : 1;
      // 종료월이 현재 표시 월보다 이후면 마지막 날까지
      const endDay = (end.getFullYear() === year && end.getMonth() + 1 === month)
        ? end.getDate() : daysInMonth;

      for (let d = startDay; d <= endDay; d++) {
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    }
    return map;
  }, [tournaments, year, month]);

  // 오늘 날짜 확인용
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  // 선택된 날짜의 대회 목록
  const selectedTournaments = selectedDate ? (tournamentsByDate[selectedDate] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] min-w-[120px] text-center">
            {year}년 {month}월
          </h2>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* 오늘 버튼 */}
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            오늘
          </button>
          {/* 범례 토글 */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            범례
          </button>
        </div>
      </div>

      {/* 범례 (토글) */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-md bg-[var(--color-surface)] p-3">
          {CALENDAR_COLOR_LEGEND.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* 달력 그리드 */}
      <div className="rounded-md bg-[var(--color-card)] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium"
              style={{
                // 일요일=빨강, 토요일=파랑, 나머지=회색
                color: idx === 0 ? "#EF4444" : idx === 6 ? "#3B82F6" : "var(--color-text-muted)",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 셀 그리드 */}
        {isLoading ? (
          // 로딩 스켈레톤: 5행 x 7열
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 sm:h-24 border-b border-r border-[var(--color-border)] p-1 animate-pulse">
                <div className="w-5 h-4 rounded bg-[var(--color-surface)]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarGrid.map((day, idx) => {
              const dayTournaments = day ? (tournamentsByDate[day] ?? []) : [];
              const isToday = isCurrentMonth && day === todayDate;
              const isSelected = day === selectedDate;
              const dayOfWeek = idx % 7; // 0=일, 6=토

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDate(isSelected ? null : day)}
                  className={`h-20 sm:h-24 border-b border-r border-[var(--color-border)] p-1 cursor-pointer transition-colors ${
                    day ? "hover:bg-[var(--color-surface)]" : ""
                  } ${isSelected ? "bg-[var(--color-primary-weak)]" : ""}`}
                >
                  {day && (
                    <>
                      {/* 날짜 숫자 */}
                      <div className="flex items-center justify-center mb-0.5">
                        <span
                          className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday ? "bg-[var(--color-primary)] text-white font-bold" : ""
                          }`}
                          style={{
                            color: isToday
                              ? undefined
                              : dayOfWeek === 0 ? "#EF4444"
                              : dayOfWeek === 6 ? "#3B82F6"
                              : "var(--color-text-secondary)",
                          }}
                        >
                          {day}
                        </span>
                      </div>
                      {/* 대회 바 (최대 3개 + more 표시) */}
                      <div className="space-y-0.5 overflow-hidden">
                        {dayTournaments.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            className="h-3.5 sm:h-4 rounded-sm px-1 flex items-center"
                            style={{ backgroundColor: getCalendarColor(t.categories, t.division_tiers) }}
                            title={t.name}
                          >
                            <span className="text-[9px] sm:text-[10px] text-white font-medium truncate leading-none">
                              {t.name}
                            </span>
                          </div>
                        ))}
                        {dayTournaments.length > 3 && (
                          <span className="text-[10px] text-[var(--color-text-muted)] pl-1">
                            +{dayTournaments.length - 3}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 선택된 날짜의 대회 상세 목록 */}
      {selectedDate && (
        <div className="rounded-md bg-[var(--color-card)] p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
            {month}월 {selectedDate}일 대회
          </h3>
          {selectedTournaments.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">이 날 진행되는 대회가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {selectedTournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-[var(--color-surface)] transition-colors"
                >
                  {/* 색상 인디케이터 */}
                  <span
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: getCalendarColor(t.categories, t.division_tiers) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.status && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {TOURNAMENT_STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      )}
                      {(t.venue_name || t.city) && (
                        <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {t.venue_name ?? t.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-base text-[var(--color-text-disabled)]">chevron_right</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
