"use client";

/**
 * CourtReviews -- 리뷰 섹션 전체 (항목별 평균 + 리뷰 목록 + 작성 폼)
 *
 * SWR로 리뷰 목록을 패치하고, 작성/삭제 시 자동 갱신.
 * 항목별 평균을 막대 그래프로 시각화한다.
 */

import { useState, useCallback } from "react";
import useSWR from "swr";
import { StarRating } from "./star-rating";
import { ReviewForm } from "./review-form";
import { REVIEW_CATEGORIES } from "@/lib/constants/court";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// API 응답 리뷰 타입
interface ReviewData {
  id: string;
  user_id: string;
  nickname: string;
  profile_image: string | null;
  rating: number;
  facility_rating: number | null;
  accessibility_rating: number | null;
  surface_rating: number | null;
  lighting_rating: number | null;
  atmosphere_rating: number | null;
  content: string | null;
  photos: string[];
  created_at: string;
}

interface CourtReviewsProps {
  courtId: string;
  currentUserId?: string;  // 로그인한 유저 ID (삭제 버튼 표시 + 중복 방지용)
}

export function CourtReviews({ courtId, currentUserId }: CourtReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // SWR로 리뷰 목록 패치
  const { data, mutate } = useSWR<{ reviews: ReviewData[]; total: number }>(
    `/api/web/courts/${courtId}/reviews`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const reviews = data?.reviews ?? [];

  // 내가 이미 리뷰를 작성했는지 확인 (중복 방지 UI)
  const hasMyReview = currentUserId
    ? reviews.some((r) => r.user_id === currentUserId)
    : false;

  // 항목별 평균 계산 (세부 별점이 있는 리뷰만 대상)
  const categoryAverages = REVIEW_CATEGORIES.map((cat) => {
    // snake_case 키 매핑
    const ratingValues = reviews
      .map((r) => r[cat.key as keyof ReviewData] as number | null)
      .filter((v): v is number => v != null);

    const avg =
      ratingValues.length > 0
        ? ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length
        : 0;

    return { ...cat, avg: Math.round(avg * 10) / 10 };
  });

  // 전체 평균 (모든 리뷰의 rating 필드 평균)
  const overallAvg =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;

  // 리뷰 삭제 핸들러
  const handleDelete = useCallback(async (reviewId: string) => {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(
        `/api/web/courts/${courtId}/reviews/${reviewId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        mutate(); // 목록 갱신
      } else {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setDeletingId(null);
    }
  }, [courtId, mutate]);

  return (
    <div
      className="rounded-md p-5 sm:p-6 mb-4"
      style={{
        backgroundColor: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="material-symbols-outlined text-base align-middle mr-1"
            style={{ color: "var(--color-primary)" }}
          >
            reviews
          </span>
          리뷰 ({reviews.length})
        </h2>

        {/* 리뷰 작성 버튼: 로그인 + 내 리뷰 없을 때만 */}
        {currentUserId && !hasMyReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              edit
            </span>
            리뷰 쓰기
          </button>
        )}
      </div>

      {/* 리뷰 작성 폼 */}
      {showForm && (
        <div className="mb-4">
          <ReviewForm
            courtId={courtId}
            onSubmitted={() => {
              setShowForm(false);
              mutate(); // 작성 완료 후 목록 갱신
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* 항목별 평균 막대 그래프 (리뷰가 있을 때만) */}
      {reviews.length > 0 && (
        <div className="mb-4">
          {/* 전체 평균 숫자 */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-3xl font-extrabold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {overallAvg.toFixed(1)}
            </span>
            <div>
              <StarRating value={Math.round(overallAvg)} size={18} />
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {reviews.length}개 리뷰
              </p>
            </div>
          </div>

          {/* 항목별 평균 막대 */}
          <div className="space-y-1.5">
            {categoryAverages.map((cat) => (
              <div key={cat.key} className="flex items-center gap-2 text-xs">
                <span
                  className="w-12 text-right"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {cat.label}
                </span>
                {/* 막대 배경 */}
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-surface-bright)" }}
                >
                  {/* 채워진 막대 (최대 5점 기준 퍼센트) */}
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(cat.avg / 5) * 100}%`,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
                <span
                  className="w-6 text-right"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {cat.avg > 0 ? cat.avg.toFixed(1) : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 리뷰 목록 */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="border-b pb-3 last:border-0 last:pb-0"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              {/* 닉네임 + 별점 + 날짜 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {r.nickname}
                </span>
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size={14} />
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {new Date(r.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>

              {/* 리뷰 텍스트 */}
              {r.content && (
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {r.content}
                </p>
              )}

              {/* 첨부 사진 */}
              {Array.isArray(r.photos) && r.photos.length > 0 && (
                <div className="flex gap-1.5 mt-1.5">
                  {(r.photos as string[]).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`리뷰 사진 ${i + 1}`}
                      className="w-16 h-16 rounded-lg object-cover"
                      style={{ border: "1px solid var(--color-border-subtle)" }}
                    />
                  ))}
                </div>
              )}

              {/* 본인 리뷰 삭제 버튼 */}
              {currentUserId && r.user_id === currentUserId && (
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="mt-1.5 text-xs transition-colors"
                  style={{ color: "var(--color-text-disabled)" }}
                >
                  {deletingId === r.id ? "삭제 중..." : "삭제"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!
          </p>
        )
      )}
    </div>
  );
}
