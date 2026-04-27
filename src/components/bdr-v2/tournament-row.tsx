/* ============================================================
 * TournamentRow — BDR v2 "열린 대회" 한 줄 행
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Home.jsx 시안의 "열린 대회" 섹션은 BoardRow(6열 테이블형)가
 * 아니라 54×54 accent 블록(레벨 약어) + title/edition + venue·dates
 * 라인 + 우측 status 배지의 3-column 카드형 레이아웃이다.
 * BoardRow를 억지로 재사용하면 열린 대회 섹션만 시각 톤이 어긋나므로
 * 별도 컴포넌트로 추출한다.
 *
 * 색상(accent)은 부모(page.tsx)에서 인덱스 기반 로테이션으로 주입 —
 * 1위 var(--accent), 2위 #f59e0b, 3위 var(--accent-2, #0ea5e9) 순.
 *
 * 서버 컴포넌트 — Link만 사용.
 * ============================================================ */

import Link from "next/link";

export interface TournamentRowProps {
  /** 좌측 accent 블록 배경 색상 (CSS color / var) */
  accent: string;
  /** 좌측 블록에 표시될 레벨 약어 — "OPEN" / "LIVE" / "INFO" 등 */
  level: string;
  /** 대회 타이틀 */
  title: string;
  /** 회차(Vol.N 등) — 선택 */
  edition?: string;
  /** 부제: 장소 · 날짜 · 접수현황 등을 " · "로 합친 문자열 */
  meta: string;
  /** 상태 — "registration" / "in_progress" / "closing" 등 (배지 표시 결정용) */
  status: string;
  /** 클릭 시 이동 경로 */
  href: string;
}

/**
 * 하나의 대회 카드 행.
 * 상위에서 `<div>` 같은 래퍼 안에 여러 개 나열해 리스트로 쓴다.
 */
export function TournamentRow({
  accent,
  level,
  title,
  edition,
  meta,
  status,
  href,
}: TournamentRowProps) {
  // 상태별 배지 결정 — "진행중"은 LIVE(red), "접수중"은 배지 생략(기본),
  // 그 외 표시가 필요하면 ghost 배지로 약하게 표현
  const showLiveBadge = status === "in_progress";

  return (
    // Link 자체가 grid row. hover 시 bg-alt — globals.css .board__row와 톤 맞춤
    <Link
      href={href}
      style={{
        display: "grid",
        // 좌측 accent 블록(54) / 중앙 본문(1fr) / 우측 배지 영역(auto)
        gridTemplateColumns: "auto 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px dashed var(--border)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* 좌측 accent 블록 — 54×54 사각형, 레벨 약어(대문자) */}
      <div
        style={{
          width: 54,
          height: 54,
          background: accent,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: 11,
          letterSpacing: "0.04em",
          textAlign: "center",
          borderRadius: "var(--radius-chip, 6px)",
          lineHeight: 1.1,
        }}
      >
        {level}
      </div>

      {/* 중앙 본문 — title + edition / meta 라인 2줄 */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
          {edition && (
            <span
              style={{
                color: "var(--ink-mute)",
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              {edition}
            </span>
          )}
        </div>
        {/* 장소 · 날짜 · 접수현황 — 12px muted */}
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            marginTop: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {meta}
        </div>
      </div>

      {/* 우측 배지 영역 — LIVE 상태일 때만 표시 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {showLiveBadge && <span className="badge badge--red">LIVE</span>}
      </div>
    </Link>
  );
}
