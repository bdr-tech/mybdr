"use client";

import { useState, useTransition } from "react";
import { toggleLikeAction } from "@/app/actions/community";

interface LikeButtonV2Props {
  postPublicId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}

/**
 * LikeButtonV2 — BDR v2 시안 박제용
 * - 시안 위치: PostDetail.jsx Reactions 섹션의 .btn.btn--lg
 * - 데이터 로직(toggleLikeAction)은 LikeButton 과 100% 동일 — 박제(UI)만 새로 작성
 * - 낙관적 업데이트 + 토글 + 실패 시 롤백 흐름 보존
 */
export function LikeButtonV2({
  postPublicId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: LikeButtonV2Props) {
  // 좋아요 상태 (낙관적 업데이트)
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    // 비로그인이면 안내
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 낙관적 업데이트: 즉시 UI 반영
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? Math.max(0, count - 1) : count + 1);

    // Server Action (백그라운드)
    startTransition(async () => {
      const result = await toggleLikeAction(postPublicId);

      if (result.error) {
        // 실패 시 롤백
        setLiked(prevLiked);
        setCount(prevCount);
        return;
      }

      // 서버 응답으로 동기화
      setLiked(result.liked);
      setCount(result.count);
    });
  };

  return (
    // 시안 .btn.btn--lg minWidth:140 — Material Symbols heart 아이콘 + 좋아요 수
    <button
      onClick={handleClick}
      disabled={isPending}
      className="btn btn--lg"
      style={{ minWidth: 140, opacity: isPending ? 0.7 : 1 }}
      title={!isLoggedIn ? "로그인이 필요합니다" : liked ? "추천 취소" : "추천하기"}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 18,
          verticalAlign: -3,
          marginRight: 6,
          // 활성 상태(추천함)일 때 빨간색 + 채움. 비활성은 외곽선만
          color: liked ? "var(--accent)" : "inherit",
          fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        favorite
      </span>
      좋아요 {count}
    </button>
  );
}
