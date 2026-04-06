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
        {/* 콘텐츠 */}
        <div className="relative flex flex-col justify-end px-4 py-10 sm:px-10 sm:py-14" style={{ minHeight: "280px" }}>
          {badges}
          {title}
          {metaBar}
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
      </div>
    </section>
  );
}
