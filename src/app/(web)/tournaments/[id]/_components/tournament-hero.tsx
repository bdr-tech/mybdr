/**
 * 대회 상세 히어로 섹션 — 디자인 템플릿별 렌더링
 *
 * 템플릿 4종:
 * - basic (기본): 그라디언트 배경 + 제목 (기존과 동일)
 * - poster: banner_url을 전체 배경으로 + 제목 오버레이
 * - logo: 색상 배경 + 중앙에 logo_url 이미지
 * - photo: banner_url 배경 사진 + 어둡게 + 제목 오버레이
 */

import Link from "next/link";
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
  // 디자인 템플릿 관련 props
  designTemplate?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  // 사이드바에서 이동한 props (참가비 + 참가 신청)
  entryFee?: number | null;
  isRegistrationOpen?: boolean;
  tournamentId?: string;
  // 문의 연락처 — DB settings.contact_phone에서 전달
  contactPhone?: string | null;
  // 현재 로그인 유저가 이 대회에 등록한 활성 신청 건수 (pending/approved/waiting)
  // 0 또는 undefined면 배지 비노출. 비로그인 시에도 0 전달.
  myApplicationsCount?: number;
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
  entryFee,
  isRegistrationOpen,
  tournamentId,
  contactPhone,
  myApplicationsCount = 0,
}: TournamentHeroProps) {
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
  // 참가비 표시 문자열
  const feeStr = entryFee && entryFee > 0 ? `${entryFee.toLocaleString()}원` : "무료";

  // --- 메타 정보 2줄 (poster/logo/photo 템플릿용) ---
  const progressPct = maxTeams ? Math.min((teamCount / maxTeams) * 100, 100) : null;

  const metaInfo = (
    <div className="space-y-1.5 text-sm text-white/80">
      {/* 1줄: 날짜 + 장소 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
      </div>
      {/* 2줄: 참가비 + 참가팀수 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-white/70">payments</span>
          {feeStr}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-white/70">groups</span>
          {teamsStr}
        </span>
      </div>
      {/* 참가 현황 프로그레스바 (maxTeams 있을 때만) */}
      {progressPct !== null && (
        <div className="pt-1">
          <p className="mb-1 text-xs text-white/60">참가 현황</p>
          <div className="h-2 overflow-hidden rounded-full bg-white/20" style={{ maxWidth: "240px" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct >= 90 ? "#EF4444" : "#FFFFFF",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // --- 문의 전화 아이콘 (poster/logo/photo 템플릿용 - 흰색 계열) ---
  const contactIcon = contactPhone ? (
    <a
      href={`tel:${contactPhone}`}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
      title={`문의: ${contactPhone}`}
    >
      <span className="material-symbols-outlined text-xl">call</span>
    </a>
  ) : null;

  // --- 문의 전화 아이콘 (basic 템플릿용 - 테마 색상) ---
  const contactIconBasic = contactPhone ? (
    <a
      href={`tel:${contactPhone}`}
      className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:opacity-80"
      style={{ backgroundColor: "var(--color-surface)", color: pColor }}
      title={`문의: ${contactPhone}`}
    >
      <span className="material-symbols-outlined text-xl">call</span>
    </a>
  ) : null;

  // --- 신청 완료 배지 ---
  // 이유: 로그인 유저가 이미 신청한 대회임을 즉시 인지시키고, 내 신청 내역으로 이동 동선 제공.
  // 표시 조건: 활성 신청(pending/approved/waiting) 1건 이상. 0이면 렌더 안 함.
  // 클릭 시 /profile/basketball#my-tournaments 앵커로 이동 (해당 섹션으로 스크롤).
  // border-radius: rounded(4px) — CLAUDE.md 버튼 컨벤션.
  const appliedBadgeText =
    myApplicationsCount > 1
      ? `${myApplicationsCount}건 신청 완료 — 내 신청 보기`
      : "신청 완료 — 내 신청 보기";

  // poster/logo/photo 템플릿용 (어두운 배경 → success 계열 + 흰 텍스트)
  const appliedBadge = myApplicationsCount > 0 ? (
    <Link
      href="/profile/basketball#my-tournaments"
      className="mt-3 inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90"
      style={{ backgroundColor: "var(--color-success)" }}
    >
      <span className="material-symbols-outlined text-sm">check_circle</span>
      {appliedBadgeText}
    </Link>
  ) : null;

  // basic 템플릿용 (밝은/테마 배경 → success 계열 동일 스타일 사용)
  const appliedBadgeBasic = myApplicationsCount > 0 ? (
    <Link
      href="/profile/basketball#my-tournaments"
      className="mt-3 inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90"
      style={{ backgroundColor: "var(--color-success)" }}
    >
      <span className="material-symbols-outlined text-sm">check_circle</span>
      {appliedBadgeText}
    </Link>
  ) : null;

  // --- 액션 바: 참가 신청만 (poster/logo/photo 템플릿용) ---
  const actionBar = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {isRegistrationOpen && tournamentId && (
        <Link
          href={`/tournaments/${tournamentId}/join`}
          className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: pColor }}
        >
          <span className="material-symbols-outlined text-base">edit_square</span>
          참가 신청
        </Link>
      )}
    </div>
  );

  // --- 액션 바: basic 템플릿용 (참가 신청만) ---
  const actionBarBasic = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {isRegistrationOpen && tournamentId && (
        <Link
          href={`/tournaments/${tournamentId}/join`}
          className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: pColor }}
        >
          <span className="material-symbols-outlined text-base">edit_square</span>
          참가 신청
        </Link>
      )}
    </div>
  );

  // --- 공통 배지 그룹 ---
  const badges = (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span
        className="rounded-sm px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white"
        style={{ backgroundColor: pColor }}
      >
        PREMIUM
      </span>
      <Badge variant={statusVariant}>{statusLabel}</Badge>
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
        {/* 콘텐츠: flex justify-between으로 좌측 정보 + 우측 전화 아이콘 */}
        <div className="relative flex items-start justify-between px-4 py-10 sm:px-10 sm:py-14" style={{ minHeight: "280px" }}>
          <div className="flex flex-col justify-end">
            {badges}
            {title}
            {metaInfo}
            {appliedBadge}
            {actionBar}
          </div>
          {contactIcon}
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
        {/* 콘텐츠: 중앙 정렬 + 우측 상단 전화 아이콘 */}
        <div className="relative flex items-start justify-between px-4 py-10 sm:px-10 sm:py-14" style={{ minHeight: "300px" }}>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
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
            {metaInfo}
            {appliedBadge}
            {actionBar}
          </div>
          {contactIcon}
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
        {/* 콘텐츠: flex justify-between으로 좌측 정보 + 우측 전화 아이콘 */}
        <div className="relative flex items-start justify-between px-4 py-10 sm:px-10 sm:py-14" style={{ minHeight: "280px" }}>
          <div className="flex flex-col justify-end">
            {badges}
            {title}
            {metaInfo}
            {appliedBadge}
            {actionBar}
          </div>
          {contactIcon}
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

      {/* 콘텐츠: flex justify-between으로 좌측 정보 + 우측 전화 아이콘 */}
      <div className="relative flex items-start justify-between px-4 py-6 sm:px-10 sm:py-8">
        <div className="flex flex-col justify-end">
          {/* 배지 그룹 */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="rounded-sm px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white sm:text-xs"
              style={{ backgroundColor: pColor }}
            >
              PREMIUM
            </span>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          {/* 대회명 */}
          <h1
            className="mb-2 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
          >
            {name}
          </h1>

          {/* 메타 정보 2줄 (basic용 - 테마 색상) */}
          <div className="space-y-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {/* 1줄: 날짜 + 장소 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
            </div>
            {/* 2줄: 참가비 + 참가팀수 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base" style={{ color: pColor }}>payments</span>
                {feeStr}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base" style={{ color: pColor }}>groups</span>
                {teamsStr}
              </span>
            </div>
            {/* 참가 현황 프로그레스바 */}
            {progressPct !== null && (
              <div className="pt-1">
                <p className="mb-1 text-xs" style={{ color: "var(--color-text-muted)" }}>참가 현황</p>
                <div className="h-2 overflow-hidden rounded-full" style={{ maxWidth: "240px", backgroundColor: "var(--color-surface)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 90 ? "#EF4444" : pColor }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 신청 완료 배지 (basic용) — 로그인 유저 활성 신청 1건 이상일 때 */}
          {appliedBadgeBasic}

          {/* 액션 바: 참가 신청만 (basic용) */}
          {actionBarBasic}
        </div>
        {/* 우측 상단: 문의 전화 아이콘 (basic용) */}
        {contactIconBasic}
      </div>
    </section>
  );
}
