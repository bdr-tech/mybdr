"use client";

/* ============================================================
 * V2TournamentList — Phase 2 Match 목록 v2 재구성 (래퍼 컴포넌트)
 *
 * 왜 이 컴포넌트가 있는가:
 * 기존 tournaments-content.tsx의 "리스트 뷰" 카드만 시안(Match.jsx)
 * 의 2열 포스터 카드 + 6상태 칩으로 교체하기 위함. 캘린더/주간 뷰 토글,
 * 필터 로직, 페이지네이션, /api/web/tournaments 호출은 기존 그대로 유지.
 *
 * 상위(tournaments-content.tsx)는 이미 필터·페이지네이션 처리가 끝난
 * paginatedTournaments 배열만 내려주면 됨. photoMap도 동일 전달.
 *
 * 시안 대비:
 * - 2열 grid (모바일 1열) — 시안: `gridTemplateColumns:'repeat(2, 1fr)'`
 * - 카드 좌측: 포스터(있으면 banner_url) or accent 그라디언트 블록(140px)
 * - 카드 우측: 상태 배지 + 태그 + 제목 + 날짜/장소/참가비 + 진행바
 * - 6상태 칩: 전체/접수중/마감임박/진행중/접수예정/종료 — 시안 순서 동일
 *
 * 데이터 원칙:
 * - API 응답(TournamentFromApi)은 그대로 사용. 새 필드 요구 금지.
 * - 6상태는 DB status를 클라이언트에서 매핑 (기존 STATUS_TAB_MAP 확장)
 *   · 접수중 = registration/registration_open/active/published/open/opening_soon
 *   · 마감임박 = registration_closed  OR  접수중 + registration_end_at이 7일 이내
 *   · 진행중 = in_progress/live/ongoing/group_stage
 *   · 접수예정 = draft/upcoming
 *   · 종료 = completed/ended/closed/cancelled
 * ============================================================ */

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants/divisions";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import { formatShortDate } from "@/lib/utils/format-date";

// tournaments-content에서 가져오는 것과 동일 — import 순환 피하려고 로컬에 재선언
interface TournamentFromApi {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  entry_fee: string | null;
  city: string | null;
  venue_name: string | null;
  max_teams: number | null;
  team_count: number;
  divisions: string[];
  categories: Record<string, boolean>;
  division_tiers: string[];
  // 마감임박 계산에 필요하면 옵션으로 받음(현재 API는 start_date/end_date만 내려줌)
  registration_end_at?: string | null;
}

// 6상태 탭 — 시안 Match.jsx L11 순서 그대로
export const V2_MATCH_TABS = [
  "전체",
  "접수중",
  "마감임박",
  "진행중",
  "접수예정",
  "종료",
] as const;
export type V2MatchTab = (typeof V2_MATCH_TABS)[number];

// 상태 배지 매핑 — 시안 L7~9 (ok=green, red=accent-red, ghost=gray, soft=blue)
const STATUS_BADGE: Record<V2MatchTab, { label: string; className: string }> = {
  전체: { label: "", className: "" }, // 카드 자체에는 안 쓰이고, 탭 라벨용
  접수중: { label: "접수중", className: "badge badge--ok" },
  마감임박: { label: "마감임박", className: "badge badge--red" },
  진행중: { label: "진행중", className: "badge badge--red" },
  접수예정: { label: "접수예정", className: "badge badge--soft" },
  종료: { label: "종료", className: "badge badge--ghost" },
};

// accent 로테이션 — 포스터 없는 카드의 그라디언트 좌측 블록 색상
// tournament-row.tsx의 Home 섹션 로테이션과 동일 톤 유지
const FALLBACK_ACCENTS = [
  "var(--accent)",             // BDR Red
  "var(--cafe-blue, #2563eb)", // blue
  "#f59e0b",                   // amber
  "#10b981",                   // emerald
];

/**
 * 개별 대회 카드 status → v2 6상태 매핑
 *
 * 왜 유틸로 분리?
 *  - 상위 탭 필터와 카드 배지가 동일한 규칙을 써야 하므로 단일 소스로 유지.
 *  - 마감임박은 DB status 하나로 결정 안 됨 → registration_end_at 기준 동적 계산.
 */
export function deriveV2Status(t: TournamentFromApi): Exclude<V2MatchTab, "전체"> {
  const st = (t.status ?? "").toLowerCase();

  // 종료
  if (["completed", "ended", "closed", "cancelled"].includes(st)) return "종료";
  // 진행중
  if (["in_progress", "live", "ongoing", "group_stage"].includes(st)) return "진행중";
  // 접수예정 (아직 접수 전)
  if (["draft", "upcoming"].includes(st)) return "접수예정";

  // 접수중/마감임박 분기 — registration_end_at 기준 7일 이내면 마감임박
  const regStatuses = [
    "registration", "registration_open", "active", "published",
    "open", "opening_soon", "registration_closed",
  ];
  if (regStatuses.includes(st)) {
    // registration_closed는 이미 마감 직전 상태
    if (st === "registration_closed") return "마감임박";

    // registration_end_at이 있으면 7일 이내 여부 계산
    if (t.registration_end_at) {
      const endAt = new Date(t.registration_end_at);
      if (!isNaN(endAt.getTime())) {
        const diffMs = endAt.getTime() - Date.now();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 7) return "마감임박";
      }
    }
    return "접수중";
  }

  // 알 수 없는 상태 — 접수예정으로 안전 폴백
  return "접수예정";
}

/* ---------- 포스터/그라디언트 좌측 블록 ---------- */
function PosterBlock({
  photoUrl,
  accent,
  level,
  title,
}: {
  photoUrl?: string | null;
  accent: string;
  level: string;
  title: string;
}) {
  // photoUrl === undefined: 로딩 중 (스켈레톤 펄스)
  // photoUrl === null / "": 사진 없음 → accent 그라디언트
  // photoUrl 존재: 배경 이미지
  if (photoUrl === undefined) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 148,
          background: "var(--bg-alt)",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
    );
  }

  if (photoUrl) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 148,
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  // 시안 L46~54: 포스터 없을 때 그라디언트 + 레벨 약어 + 제목 분해
  return (
    <div
      style={{
        background: `linear-gradient(155deg, ${accent}, ${accent}CC 50%, #000 130%)`,
        color: "#fff",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 148,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 시안의 줄무늬 오버레이 — 질감 추가 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          background: "repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)",
        }}
      />
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: ".12em",
          opacity: 0.85,
          position: "relative",
        }}
      >
        {level}
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            wordBreak: "keep-all",
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

/* ---------- 개별 대회 카드 ---------- */
function V2TournamentCard({
  tournament: t,
  photoUrl,
  accent,
}: {
  tournament: TournamentFromApi;
  photoUrl?: string | null;
  accent: string;
}) {
  const v2Status = deriveV2Status(t);
  const badge = STATUS_BADGE[v2Status];

  // 종별 라벨 1개만 (카드 공간 절약) — 태그 역할
  const categoryLabel =
    Object.entries(t.categories ?? {})
      .filter(([, v]) => v === true)
      .map(([key]) => CATEGORIES[key as keyof typeof CATEGORIES]?.label ?? key)
      .filter(Boolean)[0] ?? null;

  // 레벨 약어 — 포맷 기반 단순 매핑 (OPEN/LIVE/INFO 등)
  const level =
    v2Status === "진행중"
      ? "LIVE"
      : v2Status === "접수중"
        ? "OPEN"
        : v2Status === "마감임박"
          ? "FULL"
          : v2Status === "종료"
            ? "END"
            : "SOON";

  // 날짜 포맷: 시작~종료일
  const dateStr = t.start_date
    ? t.end_date && t.end_date !== t.start_date
      ? `${formatShortDate(t.start_date)} ~ ${formatShortDate(t.end_date)}`
      : formatShortDate(t.start_date)
    : null;

  // 장소: city + venue_name
  const location = [t.city, t.venue_name].filter(Boolean).join(" ");

  // 참가비
  const hasFee = t.entry_fee && Number(t.entry_fee) > 0;
  const feeText = hasFee ? `${Number(t.entry_fee).toLocaleString()}원` : "무료";

  // 진행바 데이터
  const maxTeams = t.max_teams ?? 0;
  const progressPct = maxTeams > 0 ? Math.min((t.team_count / maxTeams) * 100, 100) : 0;
  const isFull = maxTeams > 0 && t.team_count >= maxTeams;

  // CTA 라벨 (시안 L73) — 상태별
  const ctaLabel =
    v2Status === "접수중" || v2Status === "마감임박"
      ? "신청"
      : v2Status === "진행중"
        ? "라이브"
        : "상세";

  return (
    // 시안 L42: card padding:0 + 2열 grid (포스터 140px + 본문 1fr)
    <Link
      href={`/tournaments/${t.id}`}
      prefetch={true}
      className="card"
      style={{
        padding: 0,
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* 좌측: 포스터 or 그라디언트 */}
      <PosterBlock
        photoUrl={photoUrl}
        accent={accent}
        level={level}
        title={t.name}
      />

      {/* 우측: 정보 영역 */}
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minWidth: 0,
        }}
      >
        {/* 상태 배지 + 카테고리 태그 */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className={badge.className}>{badge.label}</span>
          {categoryLabel && (
            <span className="badge badge--ghost" style={{ fontSize: 10 }}>
              {categoryLabel}
            </span>
          )}
        </div>

        {/* 제목 */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {t.name}
        </div>

        {/* 정보 그리드 (시안 L62~66) */}
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-mute)",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 10,
            rowGap: 4,
          }}
        >
          {dateStr && (
            <>
              <span>📅</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {dateStr}
              </span>
            </>
          )}
          {location && (
            <>
              <span>📍</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {location}
              </span>
            </>
          )}
          <span>💰</span>
          <span>참가비 {feeText}</span>
        </div>

        {/* 하단: 진행바 + 인원 + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
          {maxTeams > 0 && (
            <>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "var(--bg-alt)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: "100%",
                    // 마감임박은 accent(red), 그 외는 cafe-blue
                    background:
                      v2Status === "마감임박" ? "var(--accent)" : "var(--cafe-blue, #2563eb)",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-mute)",
                  fontFamily: "var(--ff-mono)",
                  whiteSpace: "nowrap",
                }}
              >
                {t.team_count}/{maxTeams}
              </div>
            </>
          )}
          {maxTeams === 0 && (
            <div style={{ flex: 1, fontSize: 12, color: "var(--ink-mute)" }}>
              {t.team_count}팀 신청
            </div>
          )}
          <span
            className="btn btn--sm btn--primary"
            style={{
              pointerEvents: "none",
              opacity: isFull && v2Status !== "진행중" ? 0.6 : 1,
            }}
          >
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ---------- 메인: 6상태 칩 + 카드 그리드 ---------- */
interface V2TournamentListProps {
  tournaments: TournamentFromApi[];
  photoMap?: Record<string, string | null>;
  // 현재 선택된 6상태 탭
  activeTab: V2MatchTab;
  onTabChange: (tab: V2MatchTab) => void;
  // 빈 상태 메시지 맞춤 (필터 적용 여부)
  emptyMessage?: string;
  // v2 6상태 카운트(탭 라벨 옆 숫자용) — 상위에서 전체 목록 기준으로 계산해 전달
  counts?: Partial<Record<V2MatchTab, number>>;
}

export function V2TournamentList({
  tournaments,
  photoMap,
  activeTab,
  onTabChange,
  emptyMessage,
  counts,
}: V2TournamentListProps) {
  // 알림/로깅 목적의 총 건수 — 상위에서 이미 필터 적용 완료된 배열을 받음
  const shown = tournaments;

  return (
    <div>
      {/* 6상태 칩 (시안 L33~38) — btn--sm + active 시 cafe-blue 배경 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {V2_MATCH_TABS.map((tab) => {
          const isActive = activeTab === tab;
          const count = counts?.[tab];
          return (
            <button
              key={tab}
              type="button"
              className="btn btn--sm"
              onClick={() => onTabChange(tab)}
              style={
                isActive
                  ? {
                      background: "var(--cafe-blue, #2563eb)",
                      color: "#fff",
                      borderColor: "var(--cafe-blue-deep, #1d4ed8)",
                    }
                  : {}
              }
            >
              {tab}
              {count !== undefined && count > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    opacity: isActive ? 0.9 : 0.6,
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 카드 그리드: 데스크톱 2열, 모바일 1열 */}
      {shown.length === 0 ? (
        // 빈 상태 — 기존과 동일한 메시지 톤
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 48,
              color: "var(--ink-dim)",
              display: "block",
              marginBottom: 12,
            }}
          >
            emoji_events
          </span>
          <p style={{ fontSize: 14, color: "var(--ink-mute)", marginBottom: 16 }}>
            {emptyMessage ?? "해당 조건의 대회가 없습니다."}
          </p>
          <Link
            href="/tournaments"
            className="btn btn--sm btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              search
            </span>
            대회 찾아보기
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            // 모바일 1열 → 640px↑ 2열 (media query 대신 auto-fit + minmax)
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
            gap: 14,
          }}
        >
          {shown.map((t, idx) => {
            // accent 로테이션 — 4색 순환으로 시각 변주
            const accent = FALLBACK_ACCENTS[idx % FALLBACK_ACCENTS.length];
            const photoUrl =
              photoMap === undefined
                ? undefined
                : (photoMap[t.venue_name ?? t.city ?? ""] ?? null);
            return (
              <V2TournamentCard
                key={t.id}
                tournament={t}
                photoUrl={photoUrl}
                accent={accent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
