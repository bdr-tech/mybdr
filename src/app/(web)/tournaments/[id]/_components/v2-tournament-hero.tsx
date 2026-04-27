/**
 * V2TournamentHero — Phase 2 Match 상세 v2 히어로 (래퍼 컴포넌트)
 *
 * 왜 이 컴포넌트가 있는가:
 * 시안 Match.jsx L99~112의 히어로는 기존 TournamentHero(4종 템플릿)와
 * 레이아웃이 다르다(좌측 포스터 200×280 + 우측 제목/메타, 그라디언트 135deg).
 * 기존 TournamentHero를 수정하면 로직/템플릿 4종 보존 원칙 위반이므로,
 * v2 전용 히어로를 신설하고 detail page.tsx에서 스왑한다.
 *
 * 기존 대비 차이:
 * - 배경: accent 그라디언트 (135deg, accent → accent AA → #0B0D10)
 * - 레이아웃: 포스터 있으면 200×280 좌측, 없으면 1열 풀와이드
 * - 제목: t-display 폰트 + 48px
 * - 메타: 이모지 기반 (📅 📍 💰 👥)
 *
 * 데이터 원칙:
 * - page.tsx가 이미 넘기는 props 그대로 사용. 새 DB 필드 요구 금지.
 * - isRegistrationOpen / tournamentId는 신청 CTA 버튼 대신 사이드바에서 처리
 *   → 이 히어로는 시각적 정보만 담당(사이드바와 역할 분리, 시안 일치)
 * - myApplicationsCount > 0이면 신청 완료 배지만 히어로에 유지 (기존 UX 보존)
 */

import Link from "next/link";
import { formatDateRange } from "@/lib/utils/format-date";
import {
  TOURNAMENT_FORMAT_LABEL,
  TOURNAMENT_STATUS_LABEL,
} from "@/lib/constants/tournament-status";

interface V2TournamentHeroProps {
  name: string;
  format: string | null;
  status: string | null;
  startDate: Date | null;
  endDate: Date | null;
  city: string | null;
  venueName: string | null;
  teamCount: number;
  maxTeams: number | null;
  // 디자인 템플릿 관련 props (banner_url만 포스터로 사용)
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  // 회차 표시용 (없으면 format 라벨로 폴백)
  editionLabel?: string | null;
  entryFee?: number | null;
  // 문의 연락처
  contactPhone?: string | null;
  // 내가 이 대회에 낸 활성 신청 건수
  myApplicationsCount?: number;
}

export function V2TournamentHero({
  name,
  format,
  status,
  startDate,
  endDate,
  city,
  venueName,
  teamCount,
  maxTeams,
  logoUrl,
  bannerUrl,
  primaryColor,
  secondaryColor,
  editionLabel,
  entryFee,
  contactPhone,
  myApplicationsCount = 0,
}: V2TournamentHeroProps) {
  // accent 색상 — primary_color 없으면 v2 토큰 기본값
  const accent = primaryColor || "#E31B23";
  const accent2 = secondaryColor || "#E76F51";

  // 상태/포맷 라벨
  const statusLabel = TOURNAMENT_STATUS_LABEL[status ?? "draft"] ?? (status ?? "");
  const formatLabel =
    TOURNAMENT_FORMAT_LABEL[format ?? ""] ??
    TOURNAMENT_FORMAT_LABEL[(format ?? "").toLowerCase()] ??
    format ??
    "";

  // 날짜 포맷: 시안 L106 "📅 dates"
  const dateStr = formatDateRange(startDate, endDate) || null;

  // 장소 문자열
  const venueStr = [city, venueName].filter(Boolean).join(" · ");

  // 팀수
  const teamsStr = maxTeams ? `${teamCount}/${maxTeams}팀` : `${teamCount}팀`;

  // 참가비
  const feeStr = entryFee && entryFee > 0 ? `${entryFee.toLocaleString()}원` : "무료";

  // 상단 eyebrow: "OPEN · Vol.3" 형식 — editionLabel 없으면 formatLabel로
  const eyebrow = [statusLabel, editionLabel || formatLabel].filter(Boolean).join(" · ");

  // 포스터 여부 — bannerUrl or logoUrl
  const posterUrl = bannerUrl || logoUrl;
  const hasPoster = !!posterUrl;

  // 신청 완료 배지 (기존 UX 유지, 히어로 내부 컴팩트하게)
  const appliedBadgeText =
    myApplicationsCount > 1
      ? `${myApplicationsCount}건 신청 완료 — 내 신청 보기`
      : "신청 완료 — 내 신청 보기";

  return (
    <section
      // 시안 Match.jsx L99: background:`linear-gradient(135deg, ${accent}, ${accent}AA 50%, #0B0D10)`
      style={{
        background: `linear-gradient(135deg, ${accent}, ${accent}AA 50%, #0B0D10)`,
        color: "#fff",
        padding: "36px 32px",
        borderRadius: "var(--radius-card, 12px)",
        position: "relative",
        overflow: "hidden",
        marginBottom: 20,
        display: "grid",
        // 포스터 있으면 200px 좌측 고정, 없으면 1열 풀와이드
        gridTemplateColumns: hasPoster ? "200px 1fr" : "1fr",
        gap: 28,
        alignItems: "center",
      }}
    >
      {/* 좌측 포스터 (hasPoster일 때만 렌더) */}
      {hasPoster && posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt={name}
          style={{
            width: 200,
            height: 280,
            objectFit: "cover",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            // 모바일에서 포스터가 너무 크지 않도록 max-width
            maxWidth: "100%",
          }}
        />
      )}

      {/* 우측: 제목/메타 블록 */}
      <div style={{ minWidth: 0 }}>
        {/* eyebrow: 상태 · 회차 (시안 L102) */}
        {eyebrow && (
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".12em",
              fontWeight: 800,
              opacity: 0.85,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        )}

        {/* 대회명 — 시안 L103: t-display / 48px */}
        <h1
          className="t-display"
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(28px, 5vw, 48px)",
            letterSpacing: "-0.02em",
            fontWeight: 900,
            lineHeight: 1.1,
            wordBreak: "keep-all",
          }}
        >
          {name}
        </h1>

        {/* 메타 행: 시안 L105~110 (이모지 + 날짜/장소/상금/포맷) */}
        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 13,
            opacity: 0.9,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          {dateStr && <span>📅 {dateStr}</span>}
          {venueStr && <span>📍 {venueStr}</span>}
          <span>💰 참가비 {feeStr}</span>
          <span>👥 {teamsStr}</span>
        </div>

        {/* 신청 완료 배지 — 로그인 유저 활성 신청 1건 이상일 때 */}
        {myApplicationsCount > 0 && (
          <Link
            href="/profile/basketball#my-tournaments"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              check_circle
            </span>
            {appliedBadgeText}
          </Link>
        )}

        {/* 문의 전화 — contactPhone 있으면 우측 상단 대체로 inline 표시 */}
        {contactPhone && (
          <a
            href={`tel:${contactPhone}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginLeft: myApplicationsCount > 0 ? 8 : 0,
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              call
            </span>
            {contactPhone}
          </a>
        )}
      </div>

      {/* 배경 장식 — accent2 radial gradient 우상단 (시안의 블리드 효과 보완) */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "60%",
          height: "140%",
          background: `radial-gradient(circle, ${accent2}33 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
