/* ============================================================
 * /profile/preferences — M1 Day 8 이후 레거시 경로.
 *
 * 왜:
 *  - 좌측 네비의 "설정" 항목은 이제 /profile/settings 허브 (맞춤 설정 + 알림 2탭)로 통합됨.
 *  - 외부 링크/북마크/과거 이메일 링크 호환을 위해 페이지 파일 자체는 존치하되 redirect만 수행.
 *
 * 어떻게:
 *  - Next.js App Router의 서버 컴포넌트 redirect()로 즉시 이동.
 *  - 이 탭은 preferences 탭이 활성화된 상태로 landing.
 * ============================================================ */

import { redirect } from "next/navigation";

export default function PreferencesLegacyRedirect() {
  redirect("/profile/settings?tab=preferences");
}
