/**
 * 대회 상세 히어로 섹션 — 디자인 템플릿별 렌더링
 *
 * 템플릿 4종:
 * - basic (기본): 그라디언트 배경 + 제목 (기존과 동일)
 * - poster: banner_url을 전체 배경으로 + 제목 오버레이
 * - logo: 색상 배경 + 중앙에 logo_url 이미지
 * - photo: banner_url 배경 사진 + 어둡게 + 제목 오버레이
 */

import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/utils/format-date";
import {
  TOURNAMENT_FORMAT_LABEL,
  TOURNAMENT_STATUS_LABEL,
  TOURNAMENT_STATUS_BADGE,
} from "@/lib/constants/tournament-status";
// 링크 복사 버튼 — 클라이언트 컴포넌트 (클립보드 API 필요)
import { ShareTournamentButton } from "./share-tournament-button";
// 참가 신청 버튼용
import Link from "next/link";

// 구글 캘린더 URL 생성 (사이드바에서 그대로 가져옴)
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
  // 디자인 템플릿 관련 props
  designTemplate?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  // 사이드바에서 이동해 온 props
  tournamentId: string;
  entryFee: number | null;
  isRegistrationOpen: boolean;
  isRegistrationSoon: boolean;
  venue: string | null;
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
  designTemplate,
  logoUrl,
  bannerUrl,
  primaryColor,
  secondaryColor,
  tournamentId,
  entryFee,
  isRegistrationOpen,
  isRegistrationSoon,
  venue,
}: TournamentHeroProps) {
  // 참가비 표시
  const hasFee = entryFee !== null && entryFee > 0;
  const feeDisplay = hasFee ? `₩${entryFee!.toLocaleString()}` : "무료";

  // 참가팀 프로그레스 바 계산
  const progressPct = maxTeams ? Math.min((teamCount / maxTeams) * 100, 100) : null;

  // 캘린더 URL
  const calendarUrl = buildCalendarUrl(name, startDate, endDate, venue);

  // 공통 상수에서 상태 라벨과 뱃지 variant를 가져옴
  const statusLabel = TOURNAMENT_STATUS_LABEL[status ?? "draft"] ?? (status ?? "draft");
  const statusVariant = TOURNAMENT_STATUS_BADGE[status ?? "draft"] ?? ("default" as const);
  // 포맷 한글 변환
  const formatLabel = TOURNAMENT_FORMAT_LABEL[format ?? ""] ?? TOURNAMENT_FORMAT_LABEL[(format ?? "").toLowerCase()] ?? format ?? "";

  // 날짜 포맷: "3/22(토) ~ 3/24(월)" 간결 표시
  const dateStr = formatDateRange(startDate, endDate) || null;

  // 장소 문자열
  const venueStr = [city, venueName].filter(Boolean).join(" ");

  // 팀 수 + 포맷 표시
  const teamsStr = maxTeams ? `${teamCount}/${maxTeams}팀` : `${teamCount}팀`;

  // 색상 기본값
  const pColor = primaryColor || "#E31B23";
  const sColor = secondaryColor || "#E76F51";

  // 템플릿 결정 — null이면 basic
  const template = designTemplate ?? "basic";

  // --- 공통 메타 정보 바 (모든 템플릿에서 동일하게 사용) ---
  const metaBar = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
      {dateStr && (
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-white/70">calendar_today</span>
          {dateStr}
        </span>
      )}
      {venueStr && (
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-white/70">location_on</span>
          {venueStr}
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-base text-white/70">groups</span>
        {teamsStr}{formatLabel && ` · ${formatLabel}`}
      </span>
    </div>
  );

  // --- 공통 배지 그룹 (참가비 뱃지 포함) ---
  const badges = (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span
        className="rounded-sm px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white"
        style={{ backgroundColor: pColor }}
      >
        PREMIUM
      </span>
      <Badge variant={statusVariant}>{statusLabel}</Badge>
      {/* 참가비: 사이드바에서 이동 — 무료/유료 표시 */}
      <span
        className="rounded-sm px-2 py-0.5 text-xs font-bold"
        style={{
          backgroundColor: hasFee ? "var(--color-elevated)" : "rgba(255,255,255,0.15)",
          color: hasFee ? "var(--color-text)" : "white",
        }}
      >
        {feeDisplay}
      </span>
    </div>
  );

  // --- 공통 제목 ---
  const title = (
    <h1
      className="mb-2 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl lg:text-5xl text-white"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      {name}
    </h1>
  );

  // --- 히어로 하단 액션 바: 사이드바 기능들을 인라인으로 배치 ---
  const actionBar = (
    <div
      className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3"
      style={{ borderColor: "rgba(255,255,255,0.15)" }}
    >
      {/* 참가팀 현황 + 프로그레스바 */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base" style={{ color: "rgba(255,255,255,0.7)" }}>groups</span>
        <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
          참가팀 {teamCount}{maxTeams ? `/${maxTeams}` : ""}
        </span>
        {/* 프로그레스바: maxTeams가 있을 때만 */}
        {progressPct !== null && (
          <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct >= 90 ? "var(--color-error)" : "var(--color-primary)",
              }}
            />
          </div>
        )}
      </div>

      {/* 구분선 */}
      <span className="hidden sm:block h-4 w-px" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />

      {/* 참가 신청 버튼: 접수중일 때만 */}
      {isRegistrationOpen && (
        <Link
          href={`/tournaments/${tournamentId}/join`}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <span className="material-symbols-outlined text-sm">edit_square</span>
          참가 신청
        </Link>
      )}

      {/* 접수 예정 */}
      {isRegistrationSoon && (
        <span
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
        >
          <span className="material-symbols-outlined text-sm">schedule</span>
          접수 예정
        </span>
      )}

      {/* 캘린더에 추가 */}
      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
        style={{ color: "rgba(255,255,255,0.8)" }}
      >
        <span className="material-symbols-outlined text-sm">calendar_today</span>
        <span className="hidden sm:inline">캘린더</span>
      </a>

      {/* 링크 복사 — 클라이언트 컴포넌트 (인라인 스타일) */}
      <ShareTournamentButton variant="inline" />

      {/* 도움 문의 */}
      <a
        href="mailto:support@bdrbasket.com"
        className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
        style={{ color: "rgba(255,255,255,0.8)" }}
      >
        <span className="material-symbols-outlined text-sm">help</span>
        <span className="hidden sm:inline">문의</span>
      </a>
    </div>
  );

  // ===== 템플릿별 렌더링 =====

  // poster: 배너 이미지를 전체 배경으로 사용 + 하단 그라디언트 오버레이
  if (template === "poster" && bannerUrl) {
    return (
      <section className="relative w-full overflow-hidden">
        {/* 배경 이미지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 하단 그라디언트 오버레이 — 텍스트 가독성 보장 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {/* 콘텐츠 */}
        <div className="relative flex flex-col justify-end px-4 py-10 sm:px-10 sm:py-14" style={{ minHeight: "280px" }}>
          {badges}
          {title}
          {metaBar}
          {actionBar}
        </div>
      </section>
    );
  }

  // logo: 색상 그라디언트 배경 + 중앙에 로고 이미지 + 하단에 제목
  if (template === "logo") {
    return (
      <section className="relative w-full overflow-hidden">
        {/* 그라디언트 배경 */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${pColor}, ${sColor})` }}
        />
        {/* 장식 원: 우상단 */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10" />
        {/* 콘텐츠: 중앙 정렬 */}
        <div className="relative flex flex-col items-center justify-center px-4 py-10 sm:px-10 sm:py-14 text-center" style={{ minHeight: "300px" }}>
          {/* 로고 이미지 */}
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={name}
              className="mb-4 h-24 w-24 rounded-md object-cover shadow-xl ring-4 ring-white/20"
            />
          ) : (
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-md bg-white/20 shadow-xl">
              <span className="material-symbols-outlined text-5xl text-white">emoji_events</span>
            </div>
          )}
          {badges}
          {title}
          {metaBar}
          {actionBar}
        </div>
      </section>
    );
  }

  // photo: 배너 사진 배경 + 어두운 오버레이 (poster보다 더 어두움)
  if (template === "photo" && bannerUrl) {
    return (
      <section className="relative w-full overflow-hidden">
        {/* 배경 사진 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 어두운 오버레이 — photo는 poster보다 더 어둡게 */}
        <div className="absolute inset-0 bg-black/60" />
        {/* 콘텐츠 */}
        <div className="relative flex flex-col justify-end px-4 py-10 sm:px-10 sm:py-14" style={{ minHeight: "280px" }}>
          {badges}
          {title}
          {metaBar}
          {actionBar}
        </div>
      </section>
    );
  }

  // ===== basic (기본) + poster/photo 인데 이미지가 없는 경우 fallback =====
  return (
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
        style={{ background: `radial-gradient(circle, ${pColor} 0%, transparent 70%)` }}
      />

      {/* 콘텐츠: 좌측 하단 정렬, 컴팩트 패딩 */}
      <div className="relative flex flex-col justify-end px-4 py-6 sm:px-10 sm:py-8">
        {/* 배지 그룹 (참가비 뱃지 포함) */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="rounded-sm px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white sm:text-xs"
            style={{ backgroundColor: pColor }}
          >
            PREMIUM
          </span>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <span
            className="rounded-sm px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-text)" }}
          >
            {feeDisplay}
          </span>
        </div>

        {/* 대회명 */}
        <h1
          className="mb-2 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          {name}
        </h1>

        {/* 메타 정보 한 줄 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {dateStr && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base" style={{ color: pColor }}>calendar_today</span>
              {dateStr}
            </span>
          )}
          {venueStr && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base" style={{ color: pColor }}>location_on</span>
              {venueStr}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base" style={{ color: pColor }}>groups</span>
            {teamsStr}{formatLabel && ` · ${formatLabel}`}
          </span>
        </div>

        {/* 액션 바: basic 템플릿용 (다크모드 CSS 변수 기반 색상) */}
        <div
          className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* 참가팀 현황 */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-tertiary)" }}>groups</span>
            <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              참가팀 {teamCount}{maxTeams ? `/${maxTeams}` : ""}
            </span>
            {progressPct !== null && (
              <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: progressPct >= 90 ? "var(--color-error)" : "var(--color-primary)",
                  }}
                />
              </div>
            )}
          </div>
          <span className="hidden sm:block h-4 w-px" style={{ backgroundColor: "var(--color-border)" }} />
          {isRegistrationOpen && (
            <Link
              href={`/tournaments/${tournamentId}/join`}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined text-sm">edit_square</span>
              참가 신청
            </Link>
          )}
          {isRegistrationSoon && (
            <span
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-text-secondary)" }}
            >
              <span className="material-symbols-outlined text-sm">schedule</span>
              접수 예정
            </span>
          )}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-elevated)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span className="hidden sm:inline">캘린더</span>
          </a>
          <ShareTournamentButton variant="inline" />
          <a
            href="mailto:support@bdrbasket.com"
            className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-elevated)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className="material-symbols-outlined text-sm">help</span>
            <span className="hidden sm:inline">문의</span>
          </a>
        </div>
      </div>
    </section>
  );
}
