"use client";

import { useActionState, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updatePostAction } from "@/app/actions/community";

/**
 * 글 수정 페이지
 *
 * new/page.tsx 패턴을 재활용하되, 기존 데이터를 fetch해서 폼에 채워넣음.
 * API로 게시글 데이터를 가져온 뒤 폼 초기값으로 설정.
 */
export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePostAction, null);

  // 기존 게시글 데이터를 로딩하여 폼에 채워넣기
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<{
    title: string;
    content: string;
    category: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 서버에서 게시글 데이터를 가져옴 (public_id 기반)
    async function fetchPost() {
      try {
        const res = await fetch(`/api/web/community/${params.id}`);
        if (!res.ok) {
          setError("게시글을 불러올 수 없습니다.");
          return;
        }
        const json = await res.json();
        const data = json.data ?? json;
        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          category: data.category ?? "general",
        });
      } catch {
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [params.id]);

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          불러오는 중...
        </span>
      </div>
    );
  }

  // 에러 또는 데이터 없음
  if (error || !post) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <span className="text-sm" style={{ color: "var(--color-primary)" }}>
          {error ?? "게시글을 찾을 수 없습니다."}
        </span>
        <button
          onClick={() => router.back()}
          className="text-sm underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        글 수정
      </h1>
      <Card>
        {/* Server Action 에러 메시지 */}
        {state?.error && (
          // [2026-04-22] 하드코딩 red-500/red-400 → CSS 변수 --color-error 로 토큰화
          <div
            className="mb-4 rounded-[12px] px-4 py-3 text-sm"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
              color: "var(--color-error)",
            }}
          >
            {state.error}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          {/* hidden 필드: 어떤 게시글을 수정하는지 식별 */}
          <input type="hidden" name="public_id" value={params.id} />

          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">카테고리</label>
            <select
              name="category"
              defaultValue={post.category}
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm"
            >
              <option value="general">자유게시판</option>
              <option value="info">정보게시판</option>
              <option value="review">후기게시판</option>
              <option value="marketplace">장터게시판</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">제목 *</label>
            <input
              name="title"
              type="text"
              required
              defaultValue={post.title}
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm"
              placeholder="제목 입력"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">내용 *</label>
            <textarea
              name="content"
              rows={10}
              required
              defaultValue={post.content}
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm"
              placeholder="내용 입력"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "수정 중..." : "수정하기"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
