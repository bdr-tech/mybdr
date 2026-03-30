"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCommentAction } from "@/app/actions/community";

/**
 * CommentForm - 댓글 입력 폼 (시안 bdr_1/bdr_3 기반)
 *
 * textarea + 이미지/이모지 아이콘(UI만) + "등록하기" 빨강 버튼
 * 기존 createCommentAction Server Action 로직 100% 유지
 */
export function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createCommentAction, null);

  // 댓글 등록 성공 시 폼 초기화
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="mb-10">
      {/* 에러 메시지 */}
      {state?.error && (
        <p className="mb-2 text-xs" style={{ color: "var(--color-primary)" }}>
          {state.error}
        </p>
      )}

      <form ref={formRef} action={formAction}>
        <input type="hidden" name="post_id" value={postId} />

        {/* 댓글 입력 영역: 시안 기준 textarea + 하단 아이콘/버튼 바 */}
        <div
          className="rounded p-4 border transition-colors focus-within:border-[var(--color-primary)]"
          style={{
            backgroundColor: "var(--color-elevated)",
            borderColor: "var(--color-border)",
          }}
        >
          <textarea
            name="content"
            required
            className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-24 placeholder:opacity-50 outline-none"
            style={{
              color: "var(--color-text-primary)",
            }}
            placeholder="매너 있는 댓글을 작성해주세요."
          />

          {/* 하단 바: 이미지/이모지 아이콘 + 등록 버튼 */}
          <div
            className="flex justify-between items-center mt-3 pt-3 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            {/* 이미지/이모지 아이콘 (UI만, 기능 미구현) */}
            <div className="flex gap-2" style={{ color: "var(--color-text-muted)" }}>
              <button type="button" aria-label="이미지 첨부 (준비 중)" title="이미지 첨부 (준비 중)" disabled>
                <span className="material-symbols-outlined text-xl">image</span>
              </button>
              <button type="button" aria-label="이모지 (준비 중)" title="이모지 (준비 중)" disabled>
                <span className="material-symbols-outlined text-xl">mood</span>
              </button>
            </div>

            {/* 등록하기 버튼 */}
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2 rounded text-sm font-bold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {pending ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
