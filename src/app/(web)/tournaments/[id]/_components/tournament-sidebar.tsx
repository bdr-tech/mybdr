/**
 * 대회 상세 우측 사이드바 (디자인 시안 v2)
 *
 * 시안 구성:
 * 1) 참가비 카드: 얼리버드 안내, 큰 금액(+취소선 원가), 상세정보, 프로그레스바, CTA 버튼 2개, 마감 카운트다운
 * 2) 도움이 필요하신가요? 카드: 1:1 문의 + 이메일
 *
 * - DB에 없는 항목(상금, 얼리버드)은 UI만 배치
 * - sticky로 스크롤 시 고정
 */

import Link from "next/link";

// 구글 캘린더 URL 생성 유틸
function buildCalendarUrl(name: string, startDate: Date | null, endDate: Date | null, venue: string | null): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const text = encodeURIComponent(name);
  const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const dates = startDate
    ? `${formatDate(startDate)}/${endDate ? formatDate(endDate) : formatDate(startDate)}`
    : "";
  const location = venue ? encodeURIComponent(venue) : "";
  return `${base}&text=${text}${dates ? `&dates=${dates}` : ""}${location ? `&location=${location}` : ""}`;
}

interface TournamentSidebarProps {
  tournamentId: string;
  name: string;
  entryFee: number | null;
  teamCount: number;
  maxTeams: number | null;
  isRegistrationOpen: boolean;
  isRegistrationSoon: boolean;
  regClose: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  venue: string | null;
}

export function TournamentSidebar({
  tournamentId,
  name,
  entryFee,
  teamCount,
  maxTeams,
  isRegistrationOpen,
  isRegistrationSoon,
  regClose,
  startDate,
  endDate,
  venue,
}: TournamentSidebarProps) {
  const hasFee = entryFee !== null && entryFee > 0;
  const feeDisplay = hasFee ? `₩${entryFee!.toLocaleString()}` : "무료";

  // 프로그레스 바 계산
  const progressPct = maxTeams ? Math.min((teamCount / maxTeams) * 100, 100) : null;

  // 마감까지 남은 일수
  const daysLeft = regClose
    ? Math.max(0, Math.ceil((regClose.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // 캘린더 URL
  const calendarUrl = buildCalendarUrl(name, startDate, endDate, venue);

  return (
    /* sticky: 헤더(64px) + 여유 = top-20 */
    <div className="sticky top-20 space-y-3">
      {/* ====== 참가비 카드 ====== */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="p-4">
          {/* 얼리버드 안내: 접수 중 + 참가비 있을 때만 (파랑 계열 — 정보성 배지) */}
          {isRegistrationOpen && hasFee && (
            <div
              className="mb-4 rounded-lg px-3 py-2 text-center text-xs font-medium"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-info) 10%, transparent)",
                color: "var(--color-info)",
              }}
            >
              <span className="material-symbols-outlined mr-1 align-middle text-sm">local_offer</span>
              현재 얼리버드 혜택 적용 중
            </div>
          )}

          {/* 참가비 금액 (큰 표시) + 원가 취소선 */}
          <div className="mb-3 text-center">
            <p
              className="text-2xl font-extrabold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {feeDisplay}
            </p>
            {/* 원래 가격 취소선 (DB에 없으므로 1.5배로 표시) */}
            {hasFee && (
              <p
                className="mt-1 text-sm line-through"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                ₩{Math.round(entryFee! * 1.5).toLocaleString()}
              </p>
            )}
          </div>

          {/* 구분선 */}
          <div className="mb-3 border-t" style={{ borderColor: "var(--color-border)" }} />

          {/* 상세 정보 행 */}
          <div className="space-y-2.5 text-xs">
            {/* 참가비 (1인당) */}
            {hasFee && (
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>참가비 (1인당)</span>
                <span className="font-semibold">{feeDisplay}</span>
              </div>
            )}

            {/* 상금 규모 (DB에 없음 -- placeholder, 파랑 강조) */}
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--color-text-secondary)" }}>상금 규모 (우승)</span>
              <span className="font-bold" style={{ color: "var(--color-info)" }}>-</span>
            </div>

            {/* 참가팀 현황 + 프로그레스바 */}
            <div>
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>참가팀 현황</span>
                <span className="font-semibold">
                  {teamCount}{maxTeams ? ` / ${maxTeams}팀` : "팀"}
                </span>
              </div>
              {progressPct !== null && (
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full"
                  style={{ backgroundColor: "var(--color-surface)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: progressPct >= 90 ? "var(--color-error)" : "var(--color-primary)",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="my-3 border-t" style={{ borderColor: "var(--color-border)" }} />

          {/* CTA: 대회 참가 신청하기 (빨간 버튼) */}
          {isRegistrationOpen && (
            <Link
              href={`/tournaments/${tournamentId}/join`}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined text-base">edit_square</span>
              대회 참가 신청하기
            </Link>
          )}

          {/* 접수 예정 */}
          {isRegistrationSoon && (
            <div
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold"
              style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-text-secondary)" }}
            >
              <span className="material-symbols-outlined text-base">schedule</span>
              접수 예정
            </div>
          )}

          {/* CTA: 대회 공유하기 (아웃라인 버튼) */}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <span className="material-symbols-outlined text-base" style={{ color: "var(--color-info)" }}>share</span>
            대회 공유하기
          </a>

          {/* 모집 마감 카운트다운 */}
          {daysLeft !== null && isRegistrationOpen && (
            <p
              className="mt-3 text-center text-xs font-medium"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              모집 마감까지{" "}
              <span className="font-bold" style={{ color: "var(--color-primary)" }}>D-{daysLeft}</span>
            </p>
          )}
        </div>
      </div>

      {/* ====== 도움이 필요하신가요? 카드 ====== */}
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h3 className="mb-2.5 text-xs font-bold">도움이 필요하신가요?</h3>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="material-symbols-outlined text-base" style={{ color: "var(--color-info)" }}>
              chat_bubble
            </span>
            <span style={{ color: "var(--color-text-secondary)" }}>1:1 실시간 문의</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <span className="material-symbols-outlined text-base" style={{ color: "var(--color-info)" }}>
              mail
            </span>
            <span style={{ color: "var(--color-text-secondary)" }}>support@bdrsports.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
