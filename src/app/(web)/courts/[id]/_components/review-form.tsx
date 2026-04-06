"use client";

/**
 * ReviewForm -- 리뷰 작성 폼 (5항목 별점 + 텍스트 + 사진)
 *
 * - 5개 항목(시설/접근성/바닥/조명/분위기) 별점 입력
 * - 선택적 텍스트 + 사진 첨부
 * - 작성 완료 시 onSubmitted 콜백으로 목록 갱신
 */

import { useState } from "react";
import { StarRating } from "./star-rating";
import { PhotoUpload } from "./photo-upload";
import { REVIEW_CATEGORIES } from "@/lib/constants/court";

interface ReviewFormProps {
  courtId: string;
  onSubmitted: () => void;  // 작성 완료 후 리뷰 목록 갱신용 콜백
  onCancel: () => void;     // 폼 닫기
}

export function ReviewForm({ courtId, onSubmitted, onCancel }: ReviewFormProps) {
  // 5개 항목 별점 상태 (기본 0 = 미입력)
  const [ratings, setRatings] = useState<Record<string, number>>({
    facility_rating: 0,
    accessibility_rating: 0,
    surface_rating: 0,
    lighting_rating: 0,
    atmosphere_rating: 0,
  });
  const [content, setContent] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 개별 항목 별점 변경 핸들러
  const handleRatingChange = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  // 리뷰 제출
  const handleSubmit = async () => {
    // 모든 항목이 입력되었는지 확인
    const allRated = Object.values(ratings).every((r) => r >= 1);
    if (!allRated) {
      setError("모든 항목의 별점을 선택해주세요");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/courts/${courtId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ratings,
          content: content.trim() || undefined,
          photos: photoUrls.length > 0 ? photoUrls : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "리뷰 작성에 실패했습니다");
        return;
      }

      // 성공 → 목록 갱신 + 폼 닫기
      onSubmitted();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-md p-4"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <h3
        className="text-sm font-bold mb-3"
        style={{ color: "var(--color-text-primary)" }}
      >
        리뷰 작성
      </h3>

      {/* 5개 항목별 별점 입력 */}
      <div className="space-y-2.5 mb-4">
        {REVIEW_CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center justify-between">
            {/* 항목 라벨 (아이콘 + 텍스트) */}
            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px", color: "var(--color-text-muted)" }}
              >
                {cat.icon}
              </span>
              <span
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {cat.label}
              </span>
            </div>
            {/* 별점 입력 */}
            <StarRating
              value={ratings[cat.key]}
              onChange={(v) => handleRatingChange(cat.key, v)}
              size={18}
            />
          </div>
        ))}
      </div>

      {/* 텍스트 입력 (선택) */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="한 줄 후기를 남겨보세요 (선택)"
        maxLength={500}
        rows={3}
        className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
        style={{
          backgroundColor: "var(--color-surface-bright)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-subtle)",
        }}
      />

      {/* 사진 업로드 */}
      <div className="mt-3">
        <PhotoUpload
          courtId={courtId}
          type="reviews"
          urls={photoUrls}
          onUrlsChange={setPhotoUrls}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}

      {/* 버튼 그룹 */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-[4px] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {submitting ? "작성 중..." : "리뷰 등록"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-[4px] px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: "var(--color-surface-bright)",
            color: "var(--color-text-secondary)",
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
