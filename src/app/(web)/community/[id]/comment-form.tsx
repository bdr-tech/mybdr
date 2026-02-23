"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCommentAction } from "@/app/actions/community";

export function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createCommentAction, null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="mt-4">
      {state?.error && (
        <p className="mb-2 text-xs text-red-400">{state.error}</p>
      )}
      <form ref={formRef} action={formAction} className="flex gap-2">
        <input type="hidden" name="post_id" value={postId} />
        <input
          name="content"
          type="text"
          required
          className="flex-1 rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
          placeholder="댓글 입력..."
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "..." : "등록"}
        </button>
      </form>
    </div>
  );
}
