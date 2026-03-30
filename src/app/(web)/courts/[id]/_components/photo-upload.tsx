"use client";

/**
 * PhotoUpload -- 사진 업로드 컴포넌트 (최대 3장, 미리보기)
 *
 * - courtId: 코트 ID (Storage 경로에 사용)
 * - type: "reviews" | "reports" (Storage 하위 폴더)
 * - urls: 현재 업로드된 사진 URL 배열
 * - onUrlsChange: URL 배열 변경 콜백
 */

import { useState, useRef } from "react";

const MAX_PHOTOS = 3;

interface PhotoUploadProps {
  courtId: string;
  type: "reviews" | "reports";
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
}

export function PhotoUpload({ courtId, type, urls, onUrlsChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 후 서버에 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 프론트 검증: 이미 3장이면 차단
    if (urls.length >= MAX_PHOTOS) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courtId", courtId);
      formData.append("type", type);

      const res = await fetch("/api/web/upload/court-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        // 업로드 성공 → URL 배열에 추가
        onUrlsChange([...urls, data.url]);
      } else {
        alert(data.error || "업로드에 실패했습니다");
      }
    } catch {
      alert("업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      // input 초기화 (같은 파일 재선택 가능하도록)
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 특정 사진 제거
  const handleRemove = (index: number) => {
    onUrlsChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* 업로드된 사진 미리보기 */}
      {urls.length > 0 && (
        <div className="flex gap-2 mb-2">
          {urls.map((url, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`사진 ${i + 1}`}
                className="w-16 h-16 rounded-lg object-cover"
                style={{ border: "1px solid var(--color-border-subtle)" }}
              />
              {/* X 버튼: 사진 제거 */}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: "var(--color-text-muted)" }}
                aria-label="사진 제거"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 파일 선택 버튼 */}
      {urls.length < MAX_PHOTOS && (
        <label
          className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-sm cursor-pointer transition-colors"
          style={{
            backgroundColor: "var(--color-surface-bright)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="material-symbols-outlined text-base">
            {uploading ? "hourglass_empty" : "add_photo_alternate"}
          </span>
          {uploading ? "업로드 중..." : `사진 추가 (${urls.length}/${MAX_PHOTOS})`}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
