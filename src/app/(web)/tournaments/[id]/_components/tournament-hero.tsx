/**
 * 대회 상세 히어로 섹션 (디자인 시안 v2)
 * - 배경: 다크 그라디언트 (이미지 없으면 CSS 그라디언트)
 * - 좌측 하단: PREMIUM 배지 + 모집중 배지 + 대회 제목 + 메타 한 줄
 * - CTA 버튼/참가비는 사이드바로 이동 (시안 따름)
 * - 높이 약 280px
 */

import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/utils/format-date";
import {
  TOURNAMENT_FORMAT_LABEL,
  TOURNAMENT_STATUS_LABEL,
  TOURNAMENT_STATUS_BADGE,
} from "@/lib/constants/tournament-status";

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
  // 공통 상수에서 상태 라벨과 뱃지 variant를 가져옴
  const statusLabel = TOURNAMENT_STATUS_LABEL[status ?? "draft"] ?? (status ?? "draft");
  const statusVariant = TOURNAMENT_STATUS_BADGE[status ?? "draft"] ?? ("default" as const);
  // 포맷 한글 변환: 대문자 키 대응을 위해 원본 → 소문자 순서로 검색
  const formatLabel = TOURNAMENT_FORMAT_LABEL[format ?? ""] ?? TOURNAMENT_FORMAT_LABEL[(format ?? "").toLowerCase()] ?? format ?? "";

  // 날짜 포맷: "3/22(토) ~ 3/24(월)" 간결 표시
  const dateStr = formatDateRange(startDate, endDate) || null;

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
          <Badge variant={statusVariant}>{statusLabel}</Badge>
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
