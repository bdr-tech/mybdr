"use client";

import Link from "next/link";

// Phase 3 Court — v2 시안 카드
// 이유: 시안 Court.jsx 의 "area + HOT/혼잡도 → 이름 → 메타1줄 → 메타2줄 → 푸터(오늘방문 + 상세)" 구조를
//       현 DB 스키마(courts.tags / courts.rating / 시간대 정형 필드 없음)에 맞춰 재구성.
//       기존 court-card-* 등은 보존하고 신규 컴포넌트만 추가.
// 데이터 보존 원칙:
//   - average_rating, activeCount, pickupCount 등 실제 DB/집계 데이터를 그대로 노출
//   - 시안 데모 필드(hot/today/floor/light/tag)는 실제 데이터로 대체:
//       hot      → activeCount >= 5
//       today    → activeCount (현재 체크인 인원)
//       floor    → surface_type (한글 매핑)
//       light    → has_lighting === true ? (lighting_until ?? "조명") : null
//       tag      → pickupCount > 0 ? "픽업 모집중" : null

interface CourtCardV2Data {
  id: string;
  name: string;
  city: string;
  district: string | null;
  court_type: string; // "outdoor" | "indoor" | ...
  surface_type: string | null;
  hoops_count: number | null;
  is_free: boolean | null;
  has_lighting: boolean | null;
  lighting_until: string | null;
  fee: number | null;
  average_rating: number | null;
  reviews_count: number;
  verified: boolean;
  activeCount: number;
  pickupCount: number;
}

// 바닥재질 한글 매핑 (기존 courts-content.tsx 와 동일)
const SURFACE_LABELS: Record<string, string> = {
  urethane: "우레탄",
  rubber: "고무",
  modular: "모듈형",
  concrete: "콘크리트",
  asphalt: "아스팔트",
  wood: "마룻바닥",
};

// 혼잡도 뱃지 결정
// 이유: 시안의 statusBadge(busy/ok/quiet) 를 activeCount 기준으로 재해석
//       busy = 5명+, ok = 1~4명, quiet = 0명
function statusBadgeOf(activeCount: number): { label: string; color: string; bg: string } {
  if (activeCount >= 5) {
    return {
      label: "혼잡",
      color: "var(--accent)",
      bg: "var(--accent-soft, color-mix(in srgb, var(--accent) 12%, transparent))",
    };
  }
  if (activeCount >= 1) {
    return {
      label: "보통",
      color: "var(--ok)",
      bg: "color-mix(in srgb, var(--ok) 12%, transparent)",
    };
  }
  return {
    label: "한산",
    color: "var(--ink-mute)",
    bg: "color-mix(in srgb, var(--ink-mute) 12%, transparent)",
  };
}

// 운영 시간 라벨
// 이유: DB 에 영업시간 정형 필드가 없음 → has_lighting + lighting_until 로 추정
//       야외 + 조명 정보 없으면 "운영시간 미상" (시안 빈값 회피)
function operatingHoursLabel(d: CourtCardV2Data): string {
  if (d.lighting_until) return `~${d.lighting_until}`;
  if (d.court_type === "outdoor" && d.has_lighting === false) return "주간만";
  if (d.court_type === "outdoor" && d.has_lighting === true) return "야간 가능";
  return "운영시간 미상";
}

// 요금 라벨
function feeLabel(d: CourtCardV2Data): string {
  if (d.is_free === true) return "무료";
  if (d.is_free === false) return d.fee ? `${d.fee.toLocaleString()}원` : "유료";
  return "요금 미상";
}

// 코트 타입 라벨
function typeLabel(d: CourtCardV2Data): string {
  if (d.court_type === "indoor") return "실내";
  if (d.court_type === "outdoor") return "야외";
  return "미분류";
}

export function CourtCardV2({ court }: { court: CourtCardV2Data }) {
  const status = statusBadgeOf(court.activeCount);
  const isHot = court.activeCount >= 5; // 시안 HOT 뱃지: 혼잡 동치
  const surface = court.surface_type ? SURFACE_LABELS[court.surface_type] ?? court.surface_type : null;
  const hours = operatingHoursLabel(court);
  const fee = feeLabel(court);
  const tLabel = typeLabel(court);
  const courts = court.hoops_count ?? null;
  // 태그: pickupCount 있으면 "픽업 모집중", 없으면 생략 (시안 데모태그 가짜 표시 금지)
  const tag = court.pickupCount > 0 ? "픽업 모집중" : null;
  const area = court.district || court.city; // 시안 area: 행정동 한 단위

  // 메타 1줄: type · {courts}코트 · fee · hours
  // 코트 갯수가 없으면 자연스럽게 생략
  const metaPrimary = [
    tLabel,
    courts !== null ? `${courts}코트` : null,
    fee,
    hours,
  ]
    .filter(Boolean)
    .join(" · ");

  // 메타 2줄: 바닥 X · 조명 X (없으면 줄 자체 생략)
  const lightLabel = court.has_lighting === true ? "조명 있음" : court.has_lighting === false ? "조명 없음" : null;
  const metaSecondaryParts = [
    surface ? `바닥 ${surface}` : null,
    lightLabel,
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/courts/${court.id}`}
      className="card"
      style={{
        // 시안: padding:'14px 16px', cursor:'pointer', flex column, gap:8
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* 상단: area (mono) + HOT/상태 뱃지 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            color: "var(--ink-dim)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {area}
        </span>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {isHot && (
            <span
              className="badge"
              style={{
                background: "var(--bdr-red)",
                color: "#fff",
                fontFamily: "var(--ff-display)",
                letterSpacing: ".06em",
              }}
            >
              HOT
            </span>
          )}
          <span
            className="badge"
            style={{
              background: status.bg,
              color: status.color,
              border: `1px solid ${status.color}`,
            }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* 코트 이름 + verified 체크 */}
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
        >
          {court.name}
        </span>
        {court.verified && (
          // 검증 뱃지: info 색상으로 시안 톤(블루) 매칭
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, color: "var(--info)", flexShrink: 0 }}
            title="검증된 코트"
          >
            verified
          </span>
        )}
      </div>

      {/* 메타 1줄: 실내/야외 · N코트 · 요금 · 운영시간 */}
      <div style={{ fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.5 }}>
        {metaPrimary}
      </div>

      {/* 메타 2줄: 바닥 · 조명 (있을 때만) */}
      {metaSecondaryParts.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--ink-dim)", lineHeight: 1.5 }}>
          {metaSecondaryParts.join(" · ")}
        </div>
      )}

      {/* tag (픽업 모집중) — 있을 때만 */}
      {tag && (
        <div>
          <span
            className="badge"
            style={{
              background: "var(--cafe-blue-soft, color-mix(in srgb, var(--info) 12%, transparent))",
              color: "var(--info)",
              border: "1px solid color-mix(in srgb, var(--info) 30%, transparent)",
              fontSize: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 11, marginRight: 2, verticalAlign: "-1px" }}>
              sports_basketball
            </span>
            {tag}
          </span>
        </div>
      )}

      {/* 푸터: 오늘 이용 N · 평점 · 상세 버튼 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: "auto",
          paddingTop: 6,
          borderTop: "1px dashed var(--border)",
        }}
      >
        <div style={{ flex: 1, fontSize: 11, color: "var(--ink-dim)" }}>
          {/* 시안: "오늘 방문 N" → 데이터 없음 → "현재 N명" (실제 활성 체크인) */}
          현재{" "}
          <b style={{ color: "var(--ink)", fontFamily: "var(--ff-mono)" }}>
            {court.activeCount}
          </b>
          명
          {court.average_rating !== null && court.average_rating > 0 && (
            <>
              {" "}
              ·{" "}
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 11, verticalAlign: "-1px" }}
                >
                  star
                </span>{" "}
                {court.average_rating.toFixed(1)}
              </span>
            </>
          )}
        </div>
        <span
          className="btn btn--sm"
          // Link 래퍼라 button 자체는 시각용. 클릭은 카드 전체에 위임 (시안과 동일 흐름).
          aria-hidden="true"
        >
          상세
        </span>
      </div>
    </Link>
  );
}
