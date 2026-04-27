/* ============================================================
 * PromoCard — BDR v2 상단 프로모 배너
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Home.jsx 시안의 상단 대형 배너 섹션(`.promo`)을 React 서버
 * 컴포넌트로 포팅. 카페 블루 그라디언트 배경 + 우측 상단 accent 원형
 * + 2개 CTA 버튼이라는 고정 레이아웃을 props 기반 재사용 형태로 캡슐화.
 *
 * globals.css에 이식된 `.promo` / `.promo__accent` / `.btn` 클래스를
 * 그대로 사용. 서버 컴포넌트라 use client 불필요.
 * ============================================================ */

import Link from "next/link";

/** CTA 버튼 한 개를 나타내는 객체 */
export interface PromoCta {
  /** 버튼 레이블 */
  label: string;
  /** 클릭 시 이동할 링크 */
  href: string;
}

export interface PromoCardProps {
  /** 제목 위 작은 카테고리 라벨 (예: "NOW OPEN · 접수중") */
  eyebrow?: string;
  /** 배너 메인 타이틀 (대회명 등) */
  title: string;
  /** 타이틀 옆 부제 — 시즌/에디션 표기 (선택) */
  subtitle?: string;
  /** 설명 텍스트 (코트 · 일정 등) */
  description?: string;
  /** 주요 CTA — accent(BDR Red) 스타일 */
  primaryCta?: PromoCta;
  /** 보조 CTA — 반투명 고스트 스타일 */
  secondaryCta?: PromoCta;
}

/**
 * BDR v2 상단 프로모 배너.
 * globals.css의 `.promo` 클래스가 그라디언트/라운딩/accent 원형을 담당.
 */
export function PromoCard({
  eyebrow,
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
}: PromoCardProps) {
  return (
    // .promo = 카페 블루 그라디언트 배경 + 흰색 글씨
    <div className="promo" style={{ marginBottom: 20 }}>
      {/* 우측 상단 accent 원형 장식 — CSS absolute positioning */}
      <div className="promo__accent" />

      {/* 소형 eyebrow 라벨: 섹션 분류 표시 */}
      {eyebrow && (
        <div
          style={{
            color: "rgba(255,255,255,.7)",
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
      )}

      {/* 메인 타이틀 + (선택) subtitle */}
      <h2>
        {title}
        {subtitle && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 18,
              fontWeight: 600,
              opacity: 0.8,
            }}
          >
            {subtitle}
          </span>
        )}
      </h2>

      {/* 설명 한 줄 */}
      {description && <p>{description}</p>}

      {/* CTA 버튼 영역 — 링크 기반 (Link로 SPA 네비게이션) */}
      {(primaryCta || secondaryCta) && (
        <div style={{ display: "flex", gap: 8 }}>
          {primaryCta && (
            // .btn--accent = BDR Red accent 배경의 강조 버튼
            <Link href={primaryCta.href} className="btn btn--accent">
              {primaryCta.label}
            </Link>
          )}
          {secondaryCta && (
            // 반투명 보조 버튼 — 어두운 배경 위 흰 테두리
            <Link
              href={secondaryCta.href}
              className="btn"
              style={{
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                borderColor: "rgba(255,255,255,.3)",
              }}
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
