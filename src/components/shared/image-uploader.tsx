"use client";

/**
 * ImageUploader — 토스 스타일 이미지 업로드 컴포넌트
 *
 * 기능:
 * - 드래그&드롭 또는 클릭으로 파일 선택
 * - 업로드 전 로컬 미리보기 (URL.createObjectURL)
 * - /api/web/upload 로 Supabase Storage 업로드
 * - 업로드 완료 후 이미지 표시 + 삭제 버튼
 * - 업로드 중 스피너 표시
 */

import { useState, useRef, useCallback } from "react";

interface ImageUploaderProps {
  value: string;                    // 현재 이미지 URL (빈 문자열이면 미설정)
  onChange: (url: string) => void;  // URL 변경 콜백
  bucket: string;                   // Supabase Storage 버킷명
  path?: string;                    // 저장 경로 prefix (예: "tournaments/logo")
  label?: string;                   // 표시 라벨 (예: "대회 로고")
  aspectRatio?: string;             // CSS aspect-ratio (예: "1/1", "16/9")
  maxSizeMB?: number;               // 최대 파일 크기 (기본 5MB)
}

export function ImageUploader({
  value,
  onChange,
  bucket,
  path = "",
  label = "이미지",
  aspectRatio = "16/9",
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // 로컬 프리뷰 URL
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 파일 선택/드롭 후 업로드 처리
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // 이미지 타입 검증
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      // 크기 검증
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`파일 크기가 ${maxSizeMB}MB를 초과합니다.`);
        return;
      }

      // 로컬 미리보기 즉시 표시 (업로드 전에도 보이도록)
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setUploading(true);

      try {
        // FormData 생성 후 업로드 API 호출
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);
        if (path) formData.append("path", path);

        const res = await fetch("/api/web/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          // 업로드 실패 시 프리뷰 제거
          setError(json.error ?? "업로드에 실패했습니다.");
          setPreview(null);
          return;
        }

        // 성공 — 서버에서 받은 공개 URL을 부모에게 전달
        const url = json.data?.url ?? json.url ?? "";
        onChange(url);
        setPreview(null); // 실제 URL로 대체되므로 로컬 프리뷰 해제
      } catch {
        setError("네트워크 오류가 발생했습니다.");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [bucket, path, maxSizeMB, onChange]
  );

  // 드래그&드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // 클릭으로 파일 선택
  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // input 초기화 — 같은 파일 재선택 가능하도록
      e.target.value = "";
    },
    [handleFile]
  );

  // 이미지 삭제 (URL 비우기)
  const handleRemove = useCallback(() => {
    onChange("");
    setPreview(null);
    setError(null);
  }, [onChange]);

  // 표시할 이미지: 로컬 프리뷰 > 실제 URL > 없음
  const displayUrl = preview || value;

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-sm text-[var(--color-text-muted)]">
        {label} (선택)
      </label>

      {/* 이미지가 있으면 미리보기 + 삭제 버튼 */}
      {displayUrl ? (
        <div className="relative overflow-hidden rounded-md border-2 border-dashed border-[var(--color-border)]">
          <div style={{ aspectRatio }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={label}
              className="h-full w-full object-cover"
            />
          </div>

          {/* 업로드 중 오버레이 */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}

          {/* 삭제 버튼 — 우상단 */}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}

          {/* 교체 버튼 — 하단 */}
          {!uploading && (
            <button
              type="button"
              onClick={handleClick}
              className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white transition-colors hover:bg-black/80"
            >
              <span className="material-symbols-outlined text-sm">swap_horiz</span>
              변경
            </button>
          )}
        </div>
      ) : (
        /* 이미지 없으면 드래그&드롭 영역 표시 */
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors ${
            dragOver
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
              : "border-[var(--color-border)] bg-[var(--color-elevated)] hover:border-[var(--color-border-active)]"
          }`}
          style={{ aspectRatio }}
        >
          {uploading ? (
            // 업로드 중 스피너
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
              <span className="text-sm text-[var(--color-text-muted)]">업로드 중...</span>
            </div>
          ) : (
            // 기본 상태 — 아이콘 + 안내 텍스트
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <span className="material-symbols-outlined text-3xl text-[var(--color-text-muted)]">
                cloud_upload
              </span>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                클릭하거나 이미지를 드래그하세요
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                JPG, PNG, WebP (최대 {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* 숨겨진 file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
