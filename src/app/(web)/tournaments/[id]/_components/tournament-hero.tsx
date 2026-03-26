/**
 * 대회 상세 히어로 섹션 (디자인 시안 v2)
 * - 배경: 다크 그라디언트 (이미지 없으면 CSS 그라디언트)
 * - 좌측 하단: PREMIUM 배지 + 모집중 배지 + 대회 제목 + 메타 한 줄
 * - CTA 버튼/참가비는 사이드바로 이동 (시안 따름)
 * - 높이 약 280px
 */

import { Badge } from "@/components/ui/badge";

// 대회 포맷 한글 매핑
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
}: TournamentHeroProps) {
  const statusInfo = STATUS_LABEL[status ?? "draft"] ?? { label: status ?? "draft", variant: "default" as const };
  // 포맷 한글 변환
  const formatLabel = FORMAT_LABEL[format ?? ""] ?? FORMAT_LABEL[(format ?? "").toLowerCase()] ?? format ?? "";

  // 날짜 포맷: 간결하게 표시
  const dateStr = startDate
    ? `${startDate.toLocaleDateString("ko-KR")}${endDate && endDate.getTime() !== startDate.getTime() ? ` ~ ${endDate.toLocaleDateString("ko-KR")}` : ""}`
    : null;

  // 장소 문자열
  const venueStr = [city, venueName].filter(Boolean).join(" ");

  // 팀 수 + 포맷 표시
  const teamsStr = maxTeams ? `${teamCount}/${maxTeams}팀` : `${teamCount}팀`;

  return (
    /* 히어로: 배너 이미지 없으면 컴팩트 높이(auto), 패딩으로만 간격 조절 */
    <section className="relative w-full overflow-hidden">
      {/* 배경 그라디언트: 어두운 톤 + primary 살짝 비침 */}
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
      {/* 장식 원: 좌측 상단 */}
      <div
        className="absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
      />

      {/* 콘텐츠: 좌측 하단 정렬, 컴팩트 패딩 */}
      <div className="relative flex flex-col justify-end px-4 py-6 sm:px-10 sm:py-8">
        {/* 배지 그룹: PREMIUM + 상태 */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {/* PREMIUM 배지: 빨간 배경 + 흰 텍스트 (시안) */}
          <span
            className="rounded-sm px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white sm:text-xs"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            PREMIUM
          </span>
          {/* 상태 배지: 파란 배경 + 흰 텍스트 */}
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {/* 대회명: 큰 흰색 볼드 */}
        <h1
          className="mb-2 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          {name}
        </h1>

        {/* 메타 정보 한 줄: 날짜 / 장소 / 팀수+포맷 (흰색 작은 텍스트) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {dateStr && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base" style={{ color: "var(--color-primary)" }}>calendar_today</span>
              {dateStr}
            </span>
          )}
          {venueStr && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base" style={{ color: "var(--color-primary)" }}>location_on</span>
              {venueStr}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base" style={{ color: "var(--color-primary)" }}>groups</span>
            {teamsStr}{formatLabel && ` · ${formatLabel}`}
          </span>
        </div>
      </div>
    </section>
  );
}
