"use client";

import { useState, useTransition } from "react";
import { toggleFollowAction } from "@/app/actions/follow";

interface FollowButtonProps {
  targetUserId: string;      // 팔로우 대상 유저 ID
  initialFollowed: boolean;  // 현재 팔로우 상태 (서버에서 전달)
  isLoggedIn: boolean;       // 로그인 여부 (비로그인 시 안내)
  variant?: "outline" | "icon"; // outline: 사이드바용(전체 너비), icon: 프로필용(아이콘+텍스트)
}

/**
 * FollowButton - 공통 팔로우/언팔로우 토글 버튼
 *
 * LikeButton과 동일한 낙관적 업데이트 패턴:
 * 1. 클릭 즉시 UI 반영 (낙관적)
 * 2. Server Action 결과로 동기화
 * 3. 실패 시 롤백
 *
 * 두 곳에서 재사용:
 * - 커뮤니티 사이드바 (variant="outline")
 * - 타인 프로필 (variant="icon")
 */
export function FollowButton({
  targetUserId,
  initialFollowed,
  isLoggedIn,
  variant = "outline",
}: FollowButtonProps) {
  // 현재 팔로우 상태 (낙관적 업데이트용)
  const [followed, setFollowed] = useState(initialFollowed);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    // 비로그인이면 안내 메시지
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 낙관적 업데이트: 클릭 즉시 UI 반영
    const prevFollowed = followed;
    setFollowed(!followed);

    // Server Action 호출 (백그라운드)
    startTransition(async () => {
      const result = await toggleFollowAction(targetUserId);

      if (result.error) {
        // 실패 시 롤백
        setFollowed(prevFollowed);
        return;
      }

      // 서버 응답으로 정확한 값 동기화
      setFollowed(result.followed);
    });
  };

  // variant="outline": 커뮤니티 사이드바용 (전체 너비 텍스트 버튼)
  if (variant === "outline") {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full mt-4 py-2 text-sm font-bold rounded border transition-all disabled:opacity-50"
        style={{
          borderColor: followed ? "var(--color-primary)" : "var(--color-primary)",
          color: followed ? "#fff" : "var(--color-primary)",
          backgroundColor: followed ? "var(--color-primary)" : "transparent",
        }}
      >
        {followed ? "팔로잉" : "팔로우"}
      </button>
    );
  }

  // variant="icon": 타인 프로필용 (아이콘+텍스트 인라인 버튼)
  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 px-5 py-2 font-bold text-sm rounded border transition-all disabled:opacity-50 hover:opacity-80"
      style={{
        borderColor: followed ? "var(--color-primary)" : "var(--color-text-secondary)",
        color: followed ? "#fff" : "var(--color-text-primary)",
        backgroundColor: followed ? "var(--color-primary)" : "transparent",
      }}
    >
      <span
        className="material-symbols-outlined text-sm"
        style={{ fontVariationSettings: followed ? "'FILL' 1" : "'FILL' 0" }}
      >
        {followed ? "person_check" : "person_add"}
      </span>
      {followed ? "팔로잉" : "팔로우"}
    </button>
  );
}
