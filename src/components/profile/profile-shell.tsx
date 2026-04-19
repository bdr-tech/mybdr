"use client";

/* ============================================================
 * ProfileShell — 프로필 서브페이지 client 래퍼
 *
 * 왜:
 *  - layout.tsx는 server 컴포넌트로 metadata를 유지해야 한다.
 *  - 그러나 ProfileSideNav는 usePathname()을 쓰므로 client 컴포넌트.
 *  - 둘을 분리하기 위해 client wrapper로 ProfileSideNav + children을 감싼다.
 *
 * 어떻게:
 *  - lg 이상: flex 가로 배치 (aside 220px + main 1fr)
 *  - lg 미만: 세로 배치 (chip 위 + content 아래)
 * ============================================================ */

import { ProfileSideNav } from "./profile-side-nav";

export function ProfileShell({ children }: { children: React.ReactNode }) {
  return (
    /* lg 이상 가로 flex, 미만 세로 — gap-6은 PC에서만 의미 있음
     * (모바일은 chip이 sticky로 분리되어 gap 불필요) */
    <div className="lg:flex lg:gap-6">
      <ProfileSideNav />
      {/* min-w-0: flex 자식의 overflow 처리 (긴 콘텐츠 깨짐 방지) */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
