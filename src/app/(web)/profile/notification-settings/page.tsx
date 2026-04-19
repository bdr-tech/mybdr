/* ============================================================
 * /profile/notification-settings — M1 Day 8 이후 레거시 경로.
 *
 * 왜:
 *  - 알림 설정은 /profile/settings 허브의 "알림" 탭으로 통합됨.
 *  - 외부/기존 링크 호환을 위해 redirect만 수행.
 * ============================================================ */

import { redirect } from "next/navigation";

export default function NotificationSettingsLegacyRedirect() {
  redirect("/profile/settings?tab=notifications");
}
