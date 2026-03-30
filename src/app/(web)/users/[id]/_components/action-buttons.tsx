"use client";

import { FollowButton } from "@/components/follow-button";

/**
 * ActionButtons - 타인 프로필 CTA 버튼 (클라이언트 컴포넌트)
 *
 * 서버 컴포넌트(page.tsx)에서 onClick을 직접 쓸 수 없으므로
 * 클라이언트 컴포넌트로 분리.
 * - 메시지 보내기: 아직 미구현 (alert 처리)
 * - 팔로우: FollowButton 공통 컴포넌트 사용
 */

interface ActionButtonsProps {
  targetUserId: string;      // 팔로우 대상 유저 ID
  initialFollowed: boolean;  // 현재 팔로우 상태
  isLoggedIn: boolean;       // 로그인 여부
}

export function ActionButtons({ targetUserId, initialFollowed, isLoggedIn }: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-3">
      {/* 메시지 보내기: 아직 미구현 */}
      <button
        className="flex items-center gap-2 px-5 py-2 font-bold text-sm rounded text-white transition-all hover:opacity-90"
        style={{ backgroundColor: "var(--color-primary)" }}
        onClick={() => alert("준비 중인 기능입니다")}
      >
        <span className="material-symbols-outlined text-sm">send</span>
        메시지 보내기
      </button>
      {/* 팔로우 버튼: 공통 FollowButton 사용 */}
      <FollowButton
        targetUserId={targetUserId}
        initialFollowed={initialFollowed}
        isLoggedIn={isLoggedIn}
        variant="icon"
      />
    </div>
  );
}
