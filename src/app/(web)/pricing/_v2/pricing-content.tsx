"use client";

/* ============================================================
 * PricingContent — /pricing 클라이언트 본체 (BDR v2 시안 박제)
 *
 * 왜 클라이언트인가:
 * - 시안 (Dev/design/BDR v2/screens/Pricing.jsx) L4: useState('monthly')
 *   월간/연간 토글이 클라 인터랙션. 서버 컴포넌트로는 인터랙션 불가.
 * - 외부 page.tsx 가 metadata/revalidate 보존하므로 본 파일은 순수 UI 만 담당.
 *
 * 어떻게:
 * - 시안 데이터(extras-data.jsx PRICING)를 모듈 상수로 박제.
 * - cycle 토글 시 BDR+ 가격만 ₩4,900 ↔ ₩3,900 (시안 동작 일치).
 * - 모든 CTA 버튼은 alert("준비 중입니다.") — 결정 B.
 *   (/pricing/checkout 라우트는 살아있으나 진입점만 차단.)
 * - 비교표 7행: globals.css `.board / .board__head / .board__row` 클래스 사용.
 *
 * 시안 외 변경:
 * - feature_key 4종(team_create / pickup_game / court_rental / tournament_create)
 *   결제 진입점 미연결 — scratchpad "🚧 추후 구현 — Phase 6 Pricing" 참조.
 * ============================================================ */

import { useState } from "react";

// 시안 박제: Dev/design/BDR v2/extras-data.jsx PRICING (3종 플랜)
// id/highlight 는 시안 그대로. price 는 표시용 문자열.
type PricingPlan = {
  id: "free" | "plus" | "pro";
  name: string;
  // 월간 기본 가격
  price: string;
  // 연간 토글 시 BDR+ 만 다른 가격으로 교체 (시안 L42 동작)
  yearlyPrice?: string;
  subprice: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight: boolean;
};

const PRICING: PricingPlan[] = [
  {
    id: "free",
    name: "FREE",
    price: "₩0",
    subprice: "영원히",
    tagline: "시작하기에 충분합니다",
    features: [
      "커뮤니티 전체 이용",
      "픽업·게스트 신청",
      "팀 1개 등록",
      "기본 레이팅·승률 확인",
      "주간 대회 열람",
    ],
    cta: "지금 시작",
    highlight: false,
  },
  {
    id: "plus",
    name: "BDR+",
    price: "₩4,900",
    yearlyPrice: "₩3,900", // 연간 토글 시 표기 (2개월 할인)
    subprice: "/월",
    tagline: "주말을 더 자주 뛰는 사람을 위해",
    features: [
      "FREE의 모든 기능",
      "대회 우선 접수 (12시간 먼저)",
      "상세 선수 스탯·경기 리플레이",
      "팀 3개까지 등록",
      "광고 제거",
      "팀 배너·엠블럼 업로드",
    ],
    cta: "14일 무료 체험",
    highlight: true,
  },
  {
    id: "pro",
    name: "PRO",
    price: "₩29,000",
    subprice: "/월 · 팀당",
    tagline: "리그·단체 운영팀용",
    features: [
      "BDR+의 모든 기능",
      "리그·단체 운영 대시보드",
      "대진표·일정 자동 생성",
      "심판·경기 기록 시스템",
      "전용 CS 라인",
      "자체 도메인 페이지",
    ],
    cta: "문의하기",
    highlight: false,
  },
];

// 비교표 7행 — 시안 Pricing.jsx L66~L74 그대로
const COMPARISON_ROWS: Array<[string, string, string, string]> = [
  ["팀 등록 개수", "1", "3", "무제한"],
  ["대회 우선 접수", "–", "12시간 먼저", "24시간 먼저"],
  ["상세 스탯·리플레이", "–", "○", "○"],
  ["광고 제거", "–", "○", "○"],
  ["리그 운영 대시보드", "–", "–", "○"],
  ["심판·기록 시스템", "–", "–", "○"],
  ["전용 CS 라인", "–", "–", "○"],
];

export function PricingContent() {
  // 월간/연간 토글 상태 (시안 L4)
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  // 결정 B: 모든 CTA 진입점 차단. /pricing/checkout 라우트는 살아있음.
  const handleCta = () => {
    // eslint-disable-next-line no-alert
    alert("준비 중입니다.");
  };

  return (
    <div className="page">
      {/* 헤더 영역 — 시안 L7~L19 */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 36,
          maxWidth: 720,
          margin: "0 auto 36px",
        }}
      >
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          요금제 · PRICING
        </div>
        <h1
          style={{
            margin: "10px 0 10px",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          더 자주 뛰는 사람들을 위한{" "}
          <span style={{ color: "var(--accent)" }}>BDR+</span>
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--ink-mute)",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          기본 기능은 언제나 무료. 대회 우선 접수·상세 스탯·팀 확장이 필요할
          때만 업그레이드하세요.
        </p>

        {/* 월간/연간 토글 (시안 L15~L18) */}
        <div className="theme-switch" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="theme-switch__btn"
            data-active={cycle === "monthly"}
            onClick={() => setCycle("monthly")}
          >
            월간
          </button>
          <button
            type="button"
            className="theme-switch__btn"
            data-active={cycle === "yearly"}
            onClick={() => setCycle("yearly")}
          >
            연간{" "}
            <span
              style={{ color: "var(--ok)", fontWeight: 700, marginLeft: 4 }}
            >
              2개월 할인
            </span>
          </button>
        </div>
      </div>

      {/* 카드 3종 — 시안 L21~L57 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        {PRICING.map((p) => {
          // 연간 토글 시 BDR+ 만 가격 교체 (시안 L42 로직)
          const displayPrice =
            cycle === "yearly" && p.yearlyPrice ? p.yearlyPrice : p.price;
          return (
            <div
              key={p.id}
              className="card"
              style={{
                padding: "28px 26px 26px",
                // 강조 카드(BDR+) 시각 처리 — 시안 L25~L28
                border: p.highlight ? "2px solid var(--accent)" : undefined,
                position: "relative",
                transform: p.highlight ? "translateY(-8px)" : "none",
                boxShadow: p.highlight ? "var(--sh-lg)" : undefined,
              }}
            >
              {p.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: -11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--accent)",
                    color: "#fff",
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    borderRadius: 99,
                  }}
                >
                  가장 인기
                </div>
              )}

              {/* 플랜명 */}
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontWeight: 900,
                  fontSize: 20,
                  letterSpacing: ".04em",
                  color: p.highlight ? "var(--accent)" : "var(--ink)",
                }}
              >
                {p.name}
              </div>

              {/* 한 줄 설명 */}
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  marginTop: 6,
                  marginBottom: 18,
                  minHeight: 36,
                }}
              >
                {p.tagline}
              </div>

              {/* 가격 (월간/연간 분기) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontSize: 40,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {displayPrice}
                </span>
                <span style={{ fontSize: 13, color: "var(--ink-dim)" }}>
                  {p.subprice}
                </span>
              </div>

              {/* CTA — 결정 B: 전부 alert */}
              <button
                type="button"
                className={`btn ${p.highlight ? "btn--accent" : ""} btn--xl`}
                style={{ marginBottom: 20 }}
                onClick={handleCta}
              >
                {p.cta}
              </button>

              {/* 기능 목록 */}
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {p.features.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 13.5,
                      color: "var(--ink-soft)",
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        color: p.highlight ? "var(--accent)" : "var(--ok)",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 비교표 — 시안 L60~L82 (board 클래스 사용) */}
      <div style={{ maxWidth: 1080, margin: "50px auto 0" }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.015em",
            marginBottom: 18,
          }}
        >
          상세 비교
        </h2>
        <div className="board">
          <div
            className="board__head"
            style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}
          >
            <div style={{ textAlign: "left" }}>기능</div>
            <div>FREE</div>
            <div>BDR+</div>
            <div>PRO</div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={i}
              className="board__row"
              style={{
                gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
                cursor: "default",
              }}
            >
              <div className="title" style={{ fontWeight: 600 }}>
                {row[0]}
              </div>
              <div>{row[1]}</div>
              {/* BDR+ 컬럼: ○ 일 때 accent 색으로 강조 */}
              <div
                style={{
                  fontWeight: 700,
                  color: row[2] === "○" ? "var(--accent)" : "var(--ink)",
                }}
              >
                {row[2]}
              </div>
              <div style={{ fontWeight: 700 }}>{row[3]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 결제 문의 푸터 — 시안 L83~L85 */}
      <div
        style={{
          textAlign: "center",
          marginTop: 50,
          fontSize: 13,
          color: "var(--ink-mute)",
        }}
      >
        결제 문의 ·{" "}
        <a href="mailto:bdr.wonyoung@gmail.com">bdr.wonyoung@gmail.com</a> ·
        기업·단체 요금은 별도 문의
      </div>
    </div>
  );
}
