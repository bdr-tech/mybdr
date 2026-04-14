"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPostAction } from "@/app/actions/community";

// 공통 입력 스타일
const inp = "w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm";

export default function NewPostPage() {
  const [state, formAction, pending] = useActionState(createPostAction, null);
  // 이미지 URL 목록 (최대 5장)
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");

  // 이미지 URL 추가 (간단한 URL 검증)
  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (imageUrls.length >= 5) return;
    // 기본 URL 형식 검증
    if (!url.startsWith("http://") && !url.startsWith("https://")) return;
    setImageUrls((prev) => [...prev, url]);
    setImageInput("");
  };

  // 이미지 URL 삭제
  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>글쓰기</h1>
      <Card>
        {state?.error && (
          <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">카테고리</label>
            <select name="category" className={inp}>
              <option value="general">자유게시판</option>
              <option value="info">정보게시판</option>
              <option value="review">후기게시판</option>
              <option value="marketplace">장터게시판</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">제목 *</label>
            <input name="title" type="text" required className={inp} placeholder="제목 입력" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">내용 *</label>
            <textarea name="content" rows={10} required className={inp} placeholder="내용 입력" />
          </div>

          {/* 이미지 첨부 섹션: URL 방식 (최대 5장) */}
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
              이미지 첨부 <span className="text-xs text-[var(--color-text-secondary)]">(URL, 최대 5장)</span>
            </label>
            {/* 이미 추가된 이미지 미리보기 */}
            {imageUrls.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-[10px] border border-[var(--color-border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`첨부${i + 1}`} className="h-full w-full object-cover" />
                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* URL 입력 + 추가 버튼 */}
            {imageUrls.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
                  className={`${inp} min-w-0`}
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="shrink-0 rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover,#142D6B)]"
                >
                  <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                </button>
              </div>
            )}
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {imageUrls.length}/5장 - 이미지 호스팅 URL을 입력하세요
            </p>
          </div>

          {/* hidden input으로 이미지 URL 배열을 JSON 문자열로 전달 */}
          <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "작성 중..." : "작성하기"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
