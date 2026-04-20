/* ============================================================
 * /profile/subscription — M1 Day 8 이후 레거시 경로.
 *
 * 왜:
 *  - 구독 관리는 /profile/billing 허브의 "구독" 탭으로 통합됨.
 *  - 외부/기존 링크 호환을 위해 redirect만 수행.
 * ============================================================ */

import { redirect } from "next/navigation";

export default function SubscriptionLegacyRedirect() {
  redirect("/profile/billing?tab=subscription");
}
