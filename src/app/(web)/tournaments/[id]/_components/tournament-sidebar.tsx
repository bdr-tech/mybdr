/**
 * 대회 상세 우측 사이드바 카드
 * - 참가비 대형 표시 + 디비전별 현황 + CTA 버튼 + ADD TO CALENDAR
 * - 시안의 우측 sticky 참가 카드 구현
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// 구글 캘린더 URL 생성 유틸
function buildCalendarUrl(name: string, startDate: Date | null, endDate: Date | null, venue: string | null): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const text = encodeURIComponent(name);
  // 날짜 형식: YYYYMMDD (종일 이벤트)
  const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const dates = startDate
    ? `${formatDate(startDate)}/${endDate ? formatDate(endDate) : formatDate(startDate)}`
    : "";
  const location = venue ? encodeURIComponent(venue) : "";
  return `${base}&text=${text}${dates ? `&dates=${dates}` : ""}${location ? `&location=${location}` : ""}`;
}

interface DivisionInfo {
  category: string;
  division: string;
  count: number;
  cap: number | null;
  fee: number | null;
}

interface TournamentSidebarProps {
  tournamentId: string;
  entryFee: number | null;
  isRegistrationOpen: boolean;
  isRegistrationSoon: boolean;
  regClose: Date | null;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  venue: string | null;
  teamCount: number;
  maxTeams: number | null;
  divisions: DivisionInfo[];
  allowWaitingList: boolean | null;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
}

export function TournamentSidebar({
  tournamentId,
  entryFee,
  isRegistrationOpen,
  isRegistrationSoon,
  regClose,
  name,
  startDate,
  endDate,
  venue,
  teamCount,
  maxTeams,
  divisions,
  allowWaitingList,
  bankName,
  bankAccount,
  bankHolder,
}: TournamentSidebarProps) {
  const calendarUrl = buildCalendarUrl(name, startDate, endDate, venue);
  const hasFee = entryFee !== null && entryFee > 0;

  // 접수 마감까지 남은 일수 계산
  const daysLeft = regClose
    ? Math.max(0, Math.ceil((regClose.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // 전체 참가 진행률
  const progressPct = maxTeams ? Math.min((teamCount / maxTeams) * 100, 100) : null;

  return (
    // sticky top-20: 헤더(64px) + 여유(16px) = 80px, 헤더 아래로 겹치지 않도록
    <div className="sticky top-20 space-y-4">
      {/* 메인 참가 카드 */}
      <div
        className="overflow-hidden rounded-radius-card border shadow-shadow-card"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        {/* 상단 참가비 영역: 컴팩트한 인라인 표시 (축소 버전) */}
        {hasFee && (
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
              참가비
            </span>
            <span className="text-base font-extrabold" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
              {entryFee!.toLocaleString()}<span className="text-xs font-bold">원</span>
            </span>
          </div>
        )}

        <div className="p-4">
          {/* 참가 현황 요약 */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--color-text-secondary)" }}>참가팀 현황</span>
              <div>
                <span className="font-bold">{teamCount}</span>
                {maxTeams && (
                  <span style={{ color: "var(--color-text-tertiary)" }}> / {maxTeams}팀</span>
                )}
              </div>
            </div>
            {/* 프로그레스바 */}
            {progressPct !== null && (
              <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, backgroundColor: "var(--color-primary)" }}
                />
              </div>
            )}
          </div>

          {/* 디비전별 정원 현황 (있을 경우) */}
          {divisions.length > 0 && (
            <div className="mb-4 space-y-1.5">
              {divisions.map((div) => {
                const remaining = div.cap ? div.cap - div.count : null;
                const isFull = remaining !== null && remaining <= 0;
                return (
                  <div
                    key={`${div.category}-${div.division}`}
                    className="rounded-lg border p-2.5"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{div.category}</span>
                        <p className="text-sm font-bold">{div.division}</p>
                      </div>
                      <div className="text-right">
                        {div.cap && (
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {div.count}/{div.cap}팀
                          </span>
                        )}
                        {isFull && (
                          <Badge variant={allowWaitingList ? "warning" : "error"}>
                            {allowWaitingList ? "대기" : "마감"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {div.cap && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((div.count / div.cap) * 100, 100)}%`,
                            backgroundColor: isFull ? "var(--color-error)" : "var(--color-primary)",
                          }}
                        />
                      </div>
                    )}
                    {div.fee !== null && div.fee > 0 && (
                      <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {div.fee.toLocaleString()}원
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 참가신청 CTA 버튼 (축소: py-3, text-sm) */}
          {isRegistrationOpen && (
            <Link
              href={`/tournaments/${tournamentId}/join`}
              className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.97]"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined text-base">edit_square</span>
              참가 신청하기
            </Link>
          )}
          {isRegistrationSoon && (
            <div
              className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-bold"
              style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-text-secondary)" }}
            >
              <span className="material-symbols-outlined text-base">schedule</span>
              접수 예정
            </div>
          )}

          {/* ADD TO CALENDAR 버튼 (축소: py-2.5, text-xs) */}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-2.5 text-xs font-bold transition-colors"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
          >
            <span className="material-symbols-outlined text-base">calendar_add_on</span>
            캘린더에 추가
          </a>

          {/* 접수 마감까지 남은 기간 */}
          {daysLeft !== null && isRegistrationOpen && (
            <p
              className="mt-4 text-center text-xs uppercase tracking-widest"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              모집 마감까지 D-{daysLeft}
            </p>
          )}
        </div>
      </div>

      {/* 입금 정보 (있을 경우, 축소) */}
      {bankName && bankAccount && (
        <div
          className="rounded-radius-card border p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-elevated)" }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
            입금 정보
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-secondary)" }}>은행</span>
              <span className="font-medium">{bankName}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-text-secondary)" }}>계좌번호</span>
              <span className="font-medium">{bankAccount}</span>
            </div>
            {bankHolder && (
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>예금주</span>
                <span className="font-medium">{bankHolder}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
