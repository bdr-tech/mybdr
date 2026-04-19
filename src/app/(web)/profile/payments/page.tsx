/* ============================================================
 * /profile/payments — M1 Day 8 이후 레거시 경로.
 *
 * 왜:
 *  - 결제 내역은 /profile/billing 허브의 "결제 내역" 탭으로 통합됨.
 *  - 외부/기존 링크(예: pricing/success 페이지에서의 이전 링크) 호환을 위해 redirect만 수행.
 * ============================================================ */

import { redirect } from "next/navigation";

export default function PaymentsLegacyRedirect() {
  redirect("/profile/billing?tab=payments");
}
