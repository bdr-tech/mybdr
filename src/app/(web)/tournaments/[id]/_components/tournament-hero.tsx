/**
 * 대회 상세 히어로 섹션
 * - 그라디언트 배경 + 배지 + 대회명 + 메타(날짜/장소/팀수/참가비/마감)
 * - 참가 신청/캘린더 CTA 버튼을 히어로 하단에 통합
 * - 기존 사이드바에 있던 참가 관련 정보를 히어로로 이동
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// 대회 포맷 한글 매핑 -- DB에 저장된 영어 포맷값을 한글로 변환
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미네이션",
  double_elimination: "더블 엘리미네이션",
  round_robin: "리그전",
  hybrid: "혼합",
  group_stage_knockout: "조별리그+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트",
  swiss: "스위스 라운드",
};

// 대회 상태 배지 매핑
const STATUS_LABEL: Record<string, { label: string; variant: "default" | "success" | "error" | "warning" | "info" }> = {
  draft:              { label: "준비중",  variant: "default" },
  active:             { label: "모집중",  variant: "info" },
  published:          { label: "모집중",  variant: "info" },
  registration:       { label: "참가접수", variant: "info" },
  registration_open:  { label: "참가접수", variant: "info" },
  registration_closed:{ label: "접수마감", variant: "warning" },
  ongoing:            { label: "진행중",  variant: "success" },
  completed:          { label: "완료",   variant: "default" },
  cancelled:          { label: "취소",   variant: "error" },
};

// 구글 캘린더 URL 생성 -- 기존 사이드바에서 이동
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

interface TournamentHeroProps {
  name: string;
  format: string | null;
  status: string | null;
  startDate: Date | null;
  endDate: Date | null;
  city: string | null;
  venueName: string | null;
  teamCount: number;
  maxTeams: number | null;
  // 참가 관련 props (기존 사이드바에서 이동)
  tournamentId: string;
  entryFee: number | null;
  isRegistrationOpen: boolean;
  isRegistrationSoon: boolean;
  regClose: Date | null;
  venue: string | null; // 캘린더용 장소 문자열 (city + venue_name 합친 것)
}

export function TournamentHero({
  name,
  format,
  status,
  startDate,
  endDate,
  city,
  venueName,
  teamCount,
  maxTeams,
  tournamentId,
  entryFee,
  isRegistrationOpen,
  isRegistrationSoon,
  regClose,
  venue,
}: TournamentHeroProps) {
  const statusInfo = STATUS_LABEL[status ?? "draft"] ?? { label: status ?? "draft", variant: "default" as const };
  // 포맷 한글 변환: 대소문자 무시하여 매핑 (DB 값이 대문자일 수도 있으므로)
  const formatLabel = FORMAT_LABEL[format ?? ""] ?? FORMAT_LABEL[(format ?? "").toLowerCase()] ?? format ?? "";

  // 날짜 포맷
  const dateStr = startDate
    ? `${startDate.toLocaleDateString("ko-KR")}${endDate ? ` ~ ${endDate.toLocaleDateString("ko-KR")}` : ""}`
    : null;

  // 팀 수 표시
  const teamsStr = maxTeams ? `${teamCount} / ${maxTeams}팀` : `${teamCount}팀`;

  // 참가비 여부
  const hasFee = entryFee !== null && entryFee > 0;

  // 접수 마감까지 남은 일수
  const daysLeft = regClose
    ? Math.max(0, Math.ceil((regClose.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // 캘린더 URL 생성
  const calendarUrl = buildCalendarUrl(name, startDate, endDate, venue);

  return (
    /* 히어로 전체: 다크 그라디언트 배경 (이미지 대신) */
    /* 모바일: minHeight 축소(240px), 데스크탑: 360px 유지 */
    <section className="relative w-full overflow-hidden min-h-[240px] sm:min-h-[360px]">
      {/* 배경 그라디언트: 어두운 톤에서 primary 컬러를 살짝 비춰주는 효과 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-elevated) 40%, var(--color-surface) 100%)",
        }}
      />
      {/* 하단 페이드: 배경색으로 자연스럽게 이어지도록 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, var(--color-background) 0%, transparent 60%)",
        }}
      />
      {/* 좌측에 살짝 보이는 장식 원 */}
      <div
        className="absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
      />

      {/* 콘텐츠 영역: 모바일 패딩/높이 축소 */}
      <div className="relative flex h-full min-h-[240px] sm:min-h-[360px] flex-col justify-end px-4 pb-6 sm:px-10 sm:pb-10">
        {/* 배지 그룹: 상태 + 포맷 -- 모바일에서 gap/margin 축소 */}
        <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-3">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {formatLabel && (
            <span
              className="rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wider text-white sm:px-3 sm:py-1 sm:text-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {formatLabel}
            </span>
          )}
        </div>

        {/* 대회명: 모바일 text-2xl -> sm:text-4xl -> lg:text-6xl (잘리지 않도록) */}
        <h1
          className="mb-3 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:mb-6 sm:text-4xl sm:leading-none lg:text-6xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          {name}
        </h1>

        {/* 메타 정보: 날짜/장소/팀수 + 참가비/마감일 통합 */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-6">
          {dateStr && (
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                calendar_today
              </span>
              <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {dateStr}
              </span>
            </div>
          )}
          {(city || venueName) && (
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                location_on
              </span>
              <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {[city, venueName].filter(Boolean).join(" ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              groups
            </span>
            <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
              {teamsStr}
            </span>
          </div>
          {/* 참가비: 사이드바에서 히어로로 이동 */}
          {hasFee && (
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                payments
              </span>
              <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                참가비 {entryFee!.toLocaleString()}원
              </span>
            </div>
          )}
          {/* 모집 마감 D-N: 접수 중일 때만 표시 */}
          {daysLeft !== null && isRegistrationOpen && (
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                schedule
              </span>
              <span className="text-sm font-bold sm:text-base" style={{ color: "var(--color-primary)" }}>
                모집 마감 D-{daysLeft}
              </span>
            </div>
          )}
        </div>

        {/* CTA 버튼 영역: 참가 신청 + 캘린더 추가 (히어로 하단에 자연스럽게 배치) */}
        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:items-center sm:gap-3">
          {/* 참가 신청 버튼: 접수 중일 때만 표시 */}
          {isRegistrationOpen && (
            <Link
              href={`/tournaments/${tournamentId}/join`}
              className="flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined text-base">edit_square</span>
              참가 신청하기
            </Link>
          )}
          {/* 접수 예정 표시 */}
          {isRegistrationSoon && (
            <div
              className="flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold"
              style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-text-secondary)" }}
            >
              <span className="material-symbols-outlined text-base">schedule</span>
              접수 예정
            </div>
          )}
          {/* 캘린더 추가 버튼: 항상 표시 (outline 스타일) */}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg border-2 px-5 py-2.5 text-sm font-bold transition-colors hover:opacity-80"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
          >
            <span className="material-symbols-outlined text-base">calendar_add_on</span>
            캘린더 추가
          </a>
        </div>
      </div>
    </section>
  );
}
