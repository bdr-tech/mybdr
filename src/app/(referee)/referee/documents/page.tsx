"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * /referee/documents — 본인 서류 관리 페이지.
 *
 * 이유: 정산에 필요한 3종 서류(자격증/신분증/통장 사본)를 업로드·관리하는 페이지.
 *       서류는 암호화 저장되며, 화면에 이미지 미리보기/썸네일은 절대 표시하지 않는다.
 *       텍스트 상태(등록완료/미등록)만 표시하여 보안을 유지한다.
 *
 * 3종 서류 카드:
 *   - 자격증 사본 (certificate)
 *   - 신분증 사본 (id_card)
 *   - 통장 사본 (bankbook)
 */

// ── 서류 타입 정의 ──
type DocumentMeta = {
  id: string;
  doc_type: string;
  file_size: number;
  file_type: string;
  ocr_status: string;
  created_at: string;
  updated_at: string;
};

// ── 서류 종류별 정보 (아이콘 + 라벨 + 안내) ──
const DOC_CONFIGS = [
  {
    type: "certificate",
    icon: "workspace_premium",
    label: "자격증 사본",
    description: "심판/기록원 자격증의 사본을 업로드하세요.",
  },
  {
    type: "id_card",
    icon: "badge",
    label: "신분증 사본",
    description: "주민등록증 또는 운전면허증 앞면을 업로드하세요.",
  },
  {
    type: "bankbook",
    icon: "account_balance",
    label: "통장 사본",
    description: "정산금 입금을 위한 통장 앞면을 업로드하세요.",
  },
] as const;

export default function RefereeDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── 서류 목록 조회 ──
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/web/referee-documents", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setDocuments(json);
        setErrorMsg(null);
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(
          (json as { error?: string }).error ?? "서류 목록을 불러올 수 없습니다."
        );
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  // ── 특정 doc_type의 서류 찾기 ──
  const getDoc = (docType: string) =>
    documents.find((d) => d.doc_type === docType);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <header>
        <h1
          className="text-2xl font-black uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          서류 관리
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          정산에 필요한 서류를 등록하세요.
        </p>
      </header>

      {/* 보안 안내 배너 */}
      <div
        className="flex items-start gap-3 p-4"
        style={{
          backgroundColor: "var(--color-info-subtle, rgba(0,121,185,0.1))",
          border: "1px solid var(--color-info, #0079B9)",
          borderRadius: 4,
        }}
      >
        <span
          className="material-symbols-outlined mt-0.5 text-xl"
          style={{ color: "var(--color-info, #0079B9)" }}
        >
          shield
        </span>
        <div>
          <p
            className="text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            서류는 암호화 저장됩니다
          </p>
          <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            업로드된 서류는 AES-256 암호화되어 저장되며, 정산 목적으로만
            사용됩니다. 화면에 이미지가 표시되지 않습니다.
          </p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div
          className="px-3 py-2 text-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-primary)",
            border: "1px solid var(--color-primary)",
            borderRadius: 4,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* 로딩 */}
      {loading ? (
        <p
          className="p-8 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </p>
      ) : (
        /* 3종 서류 카드 */
        <div className="space-y-4">
          {DOC_CONFIGS.map((config) => (
            <DocumentCard
              key={config.type}
              config={config}
              doc={getDoc(config.type)}
              onRefresh={fetchDocuments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 서류 카드 컴포넌트 ──

function DocumentCard({
  config,
  doc,
  onRefresh,
}: {
  config: (typeof DOC_CONFIGS)[number];
  doc: DocumentMeta | undefined;
  onRefresh: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  // file input ref — 숨겨진 input을 프로그래밍 방식으로 클릭
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 업로드 핸들러 ──
  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", config.type);

    try {
      const res = await fetch("/api/web/referee-documents", {
        method: "POST",
        credentials: "include",
        body: formData, // Content-Type은 브라우저가 자동 설정 (multipart)
      });

      if (res.ok) {
        setMessage({ type: "success", text: "업로드 완료!" });
        await onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text:
            (json as { error?: string }).error ?? "업로드에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  };

  // ── 삭제 핸들러 ──
  const handleDelete = async () => {
    if (!doc) return;
    if (!confirm("이 서류를 삭제하시겠습니까?")) return;

    setDeleting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/web/referee-documents/${doc.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "삭제 완료!" });
        await onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: (json as { error?: string }).error ?? "삭제에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setDeleting(false);
    }
  };

  // ── 파일 선택 이벤트 ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleUpload(file);
    }
    // input 값 초기화 — 같은 파일 재선택 허용
    e.target.value = "";
  };

  const isRegistered = !!doc;

  return (
    <div
      className="p-5"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
      }}
    >
      {/* 카드 헤더: 아이콘 + 라벨 + 상태 뱃지 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-2xl"
            style={{
              color: isRegistered
                ? "var(--color-success, #22c55e)"
                : "var(--color-text-muted)",
            }}
          >
            {config.icon}
          </span>
          <div>
            <h3
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {config.label}
            </h3>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {config.description}
            </p>
          </div>
        </div>

        {/* 상태 뱃지 */}
        <span
          className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: isRegistered
              ? "var(--color-success, #22c55e)"
              : "var(--color-surface)",
            color: isRegistered ? "#fff" : "var(--color-text-muted)",
            borderRadius: 4,
          }}
        >
          {isRegistered ? (
            <>
              <span
                className="material-symbols-outlined text-xs"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              등록완료
            </>
          ) : (
            "미등록"
          )}
        </span>
      </div>

      {/* 등록 정보 (등록됨일 때만) */}
      {doc && (
        <div
          className="mt-3 flex flex-wrap items-center gap-3 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <span>
            {formatDate(doc.created_at)}
          </span>
          <span>
            {formatFileSize(doc.file_size)}
          </span>
          <span>{doc.file_type}</span>
        </div>
      )}

      {/* 메시지 (성공/에러) */}
      {message && (
        <div
          className="mt-3 px-3 py-1.5 text-xs"
          style={{
            backgroundColor:
              message.type === "success"
                ? "var(--color-success-subtle, rgba(34,197,94,0.1))"
                : "var(--color-surface)",
            color:
              message.type === "success"
                ? "var(--color-success, #22c55e)"
                : "var(--color-primary)",
            border: `1px solid ${
              message.type === "success"
                ? "var(--color-success, #22c55e)"
                : "var(--color-primary)"
            }`,
            borderRadius: 4,
          }}
        >
          {message.text}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="mt-4 flex items-center gap-2">
        {/* 숨겨진 file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {isRegistered ? (
          <>
            {/* 교체 버튼 */}
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-opacity"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
                opacity: uploading ? 0.6 : 1,
              }}
            >
              <span className="material-symbols-outlined text-sm">
                swap_horiz
              </span>
              {uploading ? "업로드 중..." : "교체"}
            </button>

            {/* 삭제 버튼 */}
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-opacity"
              style={{
                backgroundColor: "transparent",
                color: "var(--color-primary)",
                border: "1px solid var(--color-primary)",
                borderRadius: 4,
                opacity: deleting ? 0.6 : 1,
              }}
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </>
        ) : (
          /* 업로드 버튼 */
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold transition-opacity"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              borderRadius: 4,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <span className="material-symbols-outlined text-sm">
              upload_file
            </span>
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── 유틸 함수 ──

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
