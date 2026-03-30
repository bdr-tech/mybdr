"use client";

import { useState, useTransition } from "react";
import { toggleLikeAction } from "@/app/actions/community";

interface LikeButtonProps {
  postPublicId: string;     // 게시글 public_id (Server Action에 전달)
  initialLiked: boolean;    // 현재 유저가 이미 좋아요했는지
  initialCount: number;     // 현재 좋아요 수
  isLoggedIn: boolean;      // 로그인 여부 (비로그인 시 안내 표시)
}

/**
 * LikeButton - 게시글 좋아요 버튼 (낙관적 업데이트)
 *
 * 버튼 클릭 시 즉시 UI를 변경(낙관적 업데이트)하고,
 * Server Action 결과가 오면 실제 값으로 동기화.
 * 실패 시 원래 상태로 롤백.
 */
export function LikeButton({ postPublicId, initialLiked, initialCount, isLoggedIn }: LikeButtonProps) {
  // 현재 좋아요 상태 (낙관적 업데이트용)
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    // 비로그인이면 안내 메시지
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 낙관적 업데이트: 클릭 즉시 UI 반영
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? Math.max(0, count - 1) : count + 1);

    // Server Action 호출 (백그라운드)
    startTransition(async () => {
      const result = await toggleLikeAction(postPublicId);

      if (result.error) {
        // 실패 시 롤백
        setLiked(prevLiked);
        setCount(prevCount);
        return;
      }

      // 서버 응답으로 정확한 값 동기화
      setLiked(result.liked);
      setCount(result.count);
    });
  };

  return (
    <div
      className="flex flex-col items-center mt-12 pt-8 border-t"
      style={{ borderColor: "var(--color-border)" }}
    >
      <button
        onClick={handleClick}
        disabled={isPending}
        className="group flex flex-col items-center gap-2 mb-8 disabled:opacity-50"
        title={!isLoggedIn ? "로그인이 필요합니다" : liked ? "추천 취소" : "추천하기"}
      >
        {/* 원형 아이콘 영역: 좋아요 상태에 따라 배경색 변경 */}
        <div
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300"
          style={{
            borderColor: "var(--color-primary)",
            backgroundColor: liked ? "var(--color-primary)" : "transparent",
            color: liked ? "#fff" : "var(--color-primary)",
          }}
        >
          <span
            className="material-symbols-outlined text-3xl"
            style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
          >
            thumb_up
          </span>
        </div>
        {/* 좋아요 수 */}
        <span
          className="font-bold text-lg"
          style={{ color: "var(--color-primary)" }}
        >
          {count}
        </span>
        <span
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {liked ? "추천 취소" : "추천하기"}
        </span>
      </button>
    </div>
  );
}
