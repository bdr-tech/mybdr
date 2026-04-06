"use client";

/**
 * CourtReports -- 코트 상태 제보 섹션 (경고 배너 + 목록 + 작성 폼)
 *
 * SWR로 활성 제보를 패치.
 * 활성 제보가 있으면 경고 배너를 상단에 표시한다.
 */

import { useState } from "react";
import useSWR from "swr";
import { PhotoUpload } from "./photo-upload";
import { REPORT_TYPES, REPORT_TYPE_KEYS, type ReportType } from "@/lib/constants/court";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// API 응답 제보 타입
interface ReportData {
  id: string;
  user_id: string;
  nickname: string;
  report_type: string;
  description: string | null;
  photos: string[];
  status: string;
  created_at: string;
}

interface CourtReportsProps {
  courtId: string;
  currentUserId?: string; // 로그인 유저 ID (제보 버튼 표시용)
}

export function CourtReports({ courtId, currentUserId }: CourtReportsProps) {
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SWR로 활성 제보 목록 패치
  const { data, mutate } = useSWR<{ reports: ReportData[]; total: number }>(
    `/api/web/courts/${courtId}/reports`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const reports = data?.reports ?? [];

  // 제보 제출 핸들러
  const handleSubmit = async () => {
    if (!reportType) {
      setError("제보 유형을 선택해주세요");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/courts/${courtId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          description: description.trim() || undefined,
          photos: photoUrls.length > 0 ? photoUrls : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "제보에 실패했습니다");
        return;
      }

      // 성공 → 초기화 + 목록 갱신
      setShowForm(false);
      setReportType("");
      setDescription("");
      setPhotoUrls([]);
      mutate();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-md p-5 sm:p-6 mb-4"
      style={{
        backgroundColor: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="material-symbols-outlined text-base align-middle mr-1"
            style={{ color: "var(--color-warning)" }}
          >
            report
          </span>
          상태 제보
          {reports.length > 0 && (
            <span
              className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-warning)", minWidth: "18px", height: "18px" }}
            >
              {reports.length}
            </span>
          )}
        </h2>

        {/* 제보 버튼: 로그인 시만 */}
        {currentUserId && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
              color: "var(--color-warning)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              flag
            </span>
            제보하기
          </button>
        )}
      </div>

      {/* 활성 제보 경고 배너 (있을 때만) */}
      {reports.length > 0 && (
        <div
          className="rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined shrink-0 mt-0.5"
            style={{ fontSize: "16px", color: "var(--color-warning)" }}
          >
            warning
          </span>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            현재 {reports.length}건의 활성 제보가 있습니다. 방문 전 상태를 확인해주세요.
          </p>
        </div>
      )}

      {/* 제보 작성 폼 */}
      {showForm && (
        <div
          className="rounded-md p-4 mb-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <h3
            className="text-sm font-bold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            상태 제보
          </h3>

          {/* 제보 유형 선택 버튼들 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {REPORT_TYPE_KEYS.map((key) => {
              const info = REPORT_TYPES[key];
              const isSelected = reportType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReportType(key)}
                  className="inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? "color-mix(in srgb, var(--color-warning) 20%, transparent)"
                      : "var(--color-surface-bright)",
                    color: isSelected
                      ? "var(--color-warning)"
                      : "var(--color-text-secondary)",
                    border: isSelected
                      ? "1px solid var(--color-warning)"
                      : "1px solid transparent",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "14px" }}
                  >
                    {info.icon}
                  </span>
                  {info.label}
                </button>
              );
            })}
          </div>

          {/* 상세 설명 (선택) */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상세 설명 (선택)"
            maxLength={300}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none mb-3"
            style={{
              backgroundColor: "var(--color-surface-bright)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
            }}
          />

          {/* 사진 업로드 */}
          <PhotoUpload
            courtId={courtId}
            type="reports"
            urls={photoUrls}
            onUrlsChange={setPhotoUrls}
          />

          {/* 에러 메시지 */}
          {error && (
            <p className="mt-2 text-xs" style={{ color: "var(--color-error)" }}>
              {error}
            </p>
          )}

          {/* 버튼 그룹 */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-[4px] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-warning)" }}
            >
              {submitting ? "제출 중..." : "제보 등록"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
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
      )}

      {/* 제보 목록 */}
      {reports.length > 0 ? (
        <div className="space-y-2">
          {reports.map((r) => {
            const typeInfo = REPORT_TYPES[r.report_type as ReportType] ?? REPORT_TYPES.other;
            return (
              <div
                key={r.id}
                className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                {/* 유형 아이콘 */}
                <span
                  className="material-symbols-outlined shrink-0 mt-0.5"
                  style={{ fontSize: "18px", color: "var(--color-warning)" }}
                >
                  {typeInfo.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--color-warning)" }}
                    >
                      {typeInfo.label}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-disabled)" }}
                    >
                      {r.nickname} &middot;{" "}
                      {new Date(r.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  {r.description && (
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {r.description}
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
                          alt={`제보 사진 ${i + 1}`}
                          className="w-14 h-14 rounded-lg object-cover"
                          style={{ border: "1px solid var(--color-border-subtle)" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            현재 제보된 문제가 없습니다.
          </p>
        )
      )}
    </div>
  );
}
