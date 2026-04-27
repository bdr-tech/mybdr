/* ============================================================
 * /pricing — 요금제 페이지 (서버 wrapper)
 *
 * 왜 서버 컴포넌트로 유지:
 * - SEO metadata export 보존 (next/metadata 는 서버 컴포넌트에서만 가능).
 * - revalidate 캐시 정책 보존.
 *
 * 어떻게:
 * - prisma / getWebSession / 동적 데이터 페칭 0건 (결정 C: 시안 그대로 박제).
 * - UI 본체는 `_v2/pricing-content.tsx` (use client) 가 담당.
 *   월간/연간 토글 useState 인터랙션 때문에 클라 분리 필수.
 *
 * 결정 B 메모:
 * - 모든 CTA 는 alert("준비 중") — pricing-content.tsx 안에서 처리.
 * - /pricing/checkout 라우트 자체는 살아있음 (소스 0 변경).
 *   추후 BDR+/PRO 결제 진입점 연결 시 다시 사용 예정.
 *
 * 추후 작업 (scratchpad "🚧 추후 구현 — Phase 6 Pricing"):
 * - plans 등급 모델(FREE/BDR+/PRO) DB 도입
 * - yearly/monthly 가격 분기 동작
 * - feature_key 4종 결제 진입점 통합
 * ============================================================ */

import type { Metadata } from "next";

import { PricingContent } from "./_v2/pricing-content";

// SEO: 요금제 페이지 메타데이터 (기존 보존)
export const metadata: Metadata = {
  title: "요금제 | MyBDR",
  description:
    "MyBDR 멤버십 요금제를 비교하고 나에게 맞는 플랜을 선택하세요.",
};

// ISR 캐시 (기존 값 보존). 동적 데이터가 없어 사실상 정적이지만,
// 추후 plans DB 연동 시 재활용 가능하도록 그대로 둠.
export const revalidate = 300;

export default function PricingPage() {
  return <PricingContent />;
}
