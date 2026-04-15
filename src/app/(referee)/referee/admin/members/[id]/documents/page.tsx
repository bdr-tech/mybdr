"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

/**
 * /referee/admin/members/[id]/documents -- 관리자용 심판 서류 관리.
 *
 * 이유: 관리자가 특정 심판의 정산 서류를 대리 업로드하고,
 *       OCR 자동 추출 결과를 확인/편집/확정하는 페이지.
 *
 * 본인용 페이지와 동일한 UI이지만:
 *   - API 엔드포인트가 /api/web/referee-admin/documents/* 사용
 *   - 삭제 미제공 (관리자는 교체만 가능, 삭제는 본인만)
 *   - OCR confirm은 본인용 API 호출 (관리자가 대리 확정)
 */

// ── 타입 정의 ──
type DocumentMeta = {
  id: string;
  doc_type: string;
  file_size: number;
  file_type: string;
  ocr_status: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

type OcrExtracted = Record<string, string | undefined>;

// ── 서류 종류별 정보 ──
const DOC_CONFIGS = [
  {
    type: "certificate",
    icon: "workspace_premium",
    label: "자격증 사본",
    description: "심판/기록원 자격증의 사본",
  },
  {
    type: "id_card",
    icon: "badge",
    label: "신분증 사본",
    description: "주민등록증 또는 운전면허증 앞면",
  },
  {
    type: "bankbook",
    icon: "account_balance",
    label: "통장 사본",
    description: "정산금 입금을 위한 통장 앞면",
  },
] as const;

// ── 은행 목록 ──
const BANK_OPTIONS = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "NH농협은행",
  "IBK기업은행",
  "SC제일은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "Sh수협은행",
  "광주은행",
  "전북은행",
  "경남은행",
  "대구은행",
  "부산은행",
  "제주은행",
  "KDB산업은행",
  "우체국",
  "새마을금고",
  "신협",
] as const;

export default function AdminMemberDocumentsPage() {
  const params = useParams();
  const refereeId = params.id as string;

  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PDF 출력 관련 상태
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  // 현재 관리자의 역할 (사무국장 여부 판단용)
  const [adminRole, setAdminRole] = useState<string | null>(null);

  // ── 서류 목록 조회 ──
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/web/referee-admin/documents?referee_id=${refereeId}`,
        { credentials: "include" }
      );
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
  }, [refereeId]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  // 관리자 역할 조회 (사무국장 여부 판단)
  // settings API는 { items: [...], current_user_id } 형태로 응답.
  // items에서 current_user_id와 일치하는 항목의 role을 추출한다.
  useEffect(() => {
    async function fetchAdminRole() {
      try {
        const res = await fetch("/api/web/referee-admin/settings", {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json() as {
            items?: { user_id: number | string; role: string }[];
            current_user_id?: number | string;
          };
          if (json.items && json.current_user_id) {
            const me = json.items.find(
              (item) => String(item.user_id) === String(json.current_user_id)
            );
            setAdminRole(me?.role ?? null);
          }
        }
      } catch {
        // 역할 조회 실패 시 버튼 미표시 (안전하게)
      }
    }
    void fetchAdminRole();
  }, []);

  // 3종 서류 모두 등록 여부 확인
  const allDocsRegistered = ["certificate", "id_card", "bankbook"].every(
    (type) => documents.some((d) => d.doc_type === type)
  );

  // 사무국장 여부 (document_print 권한)
  const canPrint = adminRole === "secretary_general";

  // ── PDF 다운로드 핸들러 ──
  const handlePdfDownload = async () => {
    setPdfGenerating(true);
    setPdfMessage(null);

    try {
      const res = await fetch("/api/web/referee-admin/documents/print", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referee_id: refereeId }),
      });

      if (res.ok) {
        // PDF blob 다운로드 트리거
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Content-Disposition에서 파일명 추출 또는 기본값
        const disposition = res.headers.get("Content-Disposition");
        const filenameMatch = disposition?.match(/filename="?(.+?)"?$/);
        a.download = filenameMatch?.[1] ?? `settlement-${refereeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setPdfMessage({ type: "success", text: "PDF 다운로드가 시작되었습니다." });
      } else {
        const json = await res.json().catch(() => ({}));
        setPdfMessage({
          type: "error",
          text:
            (json as { error?: string }).error ?? "PDF 생성에 실패했습니다.",
        });
      }
    } catch {
      setPdfMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setPdfGenerating(false);
    }
  };

  const getDoc = (docType: string) =>
    documents.find((d) => d.doc_type === docType);

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Link
        href={`/referee/admin/members/${refereeId}`}
        className="inline-flex items-center gap-1 text-sm font-bold"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        심판 상세로
      </Link>

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
          심판의 정산 서류를 대리 업로드하고 정보를 추출합니다.
        </p>
      </header>

      {/* 보안 안내 */}
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
        <p
          className="text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          서류는 암호화 저장됩니다. 이미지는 화면에 표시되지 않습니다.
        </p>
      </div>

      {/* 정산 서류 PDF 출력 (사무국장만 표시) */}
      {canPrint && !loading && (
        <div
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: "var(--color-text-muted)" }}
            >
              print
            </span>
            <div>
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                정산 서류 PDF 출력
              </h3>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {allDocsRegistered
                  ? "3종 서류가 모두 등록되어 있습니다. PDF로 출력할 수 있습니다."
                  : "서류 3종이 모두 등록되어야 출력할 수 있습니다."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!allDocsRegistered || pdfGenerating}
            onClick={handlePdfDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-opacity"
            style={{
              backgroundColor: allDocsRegistered
                ? "var(--color-primary)"
                : "var(--color-surface)",
              color: allDocsRegistered ? "#fff" : "var(--color-text-muted)",
              borderRadius: 4,
              opacity: pdfGenerating ? 0.6 : 1,
              cursor: allDocsRegistered && !pdfGenerating ? "pointer" : "not-allowed",
            }}
          >
            <span className="material-symbols-outlined text-sm">print</span>
            {pdfGenerating ? "생성 중..." : "PDF 출력"}
          </button>
        </div>
      )}

      {/* PDF 출력 메시지 */}
      {pdfMessage && (
        <div
          className="px-3 py-2 text-xs"
          style={{
            backgroundColor:
              pdfMessage.type === "success"
                ? "var(--color-success-subtle, rgba(34,197,94,0.1))"
                : "var(--color-surface)",
            color:
              pdfMessage.type === "success"
                ? "var(--color-success, #22c55e)"
                : "var(--color-primary)",
            border: `1px solid ${
              pdfMessage.type === "success"
                ? "var(--color-success, #22c55e)"
                : "var(--color-primary)"
            }`,
            borderRadius: 4,
          }}
        >
          {pdfMessage.text}
        </div>
      )}

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
        <div className="space-y-4">
          {DOC_CONFIGS.map((config) => (
            <AdminDocumentCard
              key={config.type}
              config={config}
              doc={getDoc(config.type)}
              refereeId={refereeId}
              onRefresh={fetchDocuments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 관리자 서류 카드 컴포넌트 ──

function AdminDocumentCard({
  config,
  doc,
  refereeId,
  onRefresh,
}: {
  config: (typeof DOC_CONFIGS)[number];
  doc: DocumentMeta | undefined;
  refereeId: string;
  onRefresh: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCR 관련 상태
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // ── 대리 업로드 핸들러 ──
  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    setShowForm(false);
    setFormData({});
    setOcrStatus(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", config.type);
    fd.append("referee_id", refereeId);

    try {
      const res = await fetch("/api/web/referee-admin/documents", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (res.ok) {
        setMessage({ type: "success", text: "대리 업로드 완료!" });
        await onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: (json as { error?: string }).error ?? "업로드에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  };

  // ── OCR 실행 핸들러 (관리자용 API) ──
  const handleOcr = async () => {
    if (!doc) return;
    setOcrLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/web/referee-admin/documents/${doc.id}/ocr`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const json = (await res.json()) as {
        ocr_status?: string;
        extracted?: OcrExtracted;
        message?: string;
      };

      if (res.ok) {
        setOcrStatus(json.ocr_status || null);
        const initial: Record<string, string> = {};
        if (json.extracted) {
          for (const [key, value] of Object.entries(json.extracted)) {
            if (value) initial[key] = value;
          }
        }
        setFormData(initial);
        setShowForm(true);

        if (json.ocr_status === "failed" || json.ocr_status === "skipped") {
          setMessage({
            type: "error",
            text: json.message || "자동 추출에 실패했습니다. 직접 입력해주세요.",
          });
        }
      } else {
        setMessage({
          type: "error",
          text: (json as { error?: string }).error ?? "OCR 처리에 실패했습니다.",
        });
        setShowForm(true);
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
      setShowForm(true);
    } finally {
      setOcrLoading(false);
    }
  };

  // ── OCR 결과 확정 (관리자용 confirm API 사용) ──
  const handleConfirm = async () => {
    if (!doc) return;
    setConfirming(true);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/web/referee-admin/documents/${doc.id}/ocr/confirm`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (res.ok) {
        setMessage({ type: "success", text: "정보가 저장되었습니다!" });
        setShowForm(false);
      } else {
        const json = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: (json as { error?: string }).error ?? "저장에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setConfirming(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleUpload(file);
    }
    e.target.value = "";
  };

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
      {/* 카드 헤더 */}
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

      {/* 등록 정보 */}
      {doc && (
        <div
          className="mt-3 flex flex-wrap items-center gap-3 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <span>{formatDate(doc.created_at)}</span>
          <span>{formatFileSize(doc.file_size)}</span>
          <span>{doc.file_type}</span>
        </div>
      )}

      {/* 메시지 */}
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
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {isRegistered ? (
          <>
            {/* 정보 추출 버튼 */}
            <button
              type="button"
              disabled={ocrLoading}
              onClick={handleOcr}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-opacity"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                borderRadius: 4,
                opacity: ocrLoading ? 0.6 : 1,
              }}
            >
              <span className="material-symbols-outlined text-sm">
                document_scanner
              </span>
              {ocrLoading ? "추출 중..." : "정보 추출"}
            </button>

            {/* 수동 입력 버튼 */}
            {!showForm && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setFormData({});
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-opacity"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                직접 입력
              </button>
            )}

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
          </>
        ) : (
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
            {uploading ? "업로드 중..." : "대리 업로드"}
          </button>
        )}
      </div>

      {/* OCR 추출 결과 + 편집 폼 */}
      {showForm && isRegistered && (
        <div
          className="mt-4 space-y-3 p-4"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-base"
              style={{ color: "var(--color-text-muted)" }}
            >
              {ocrStatus === "completed" ? "auto_fix_high" : "edit_note"}
            </span>
            <p
              className="text-xs font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {ocrStatus === "completed"
                ? "자동 추출 결과 (확인 후 저장하세요)"
                : "정보를 직접 입력하세요"}
            </p>
          </div>

          {config.type === "certificate" && (
            <CertificateForm data={formData} onChange={updateField} />
          )}
          {config.type === "bankbook" && (
            <BankbookForm data={formData} onChange={updateField} />
          )}
          {config.type === "id_card" && (
            <IdCardForm data={formData} onChange={updateField} />
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold transition-opacity"
              style={{
                backgroundColor: "var(--color-success, #22c55e)",
                color: "#fff",
                borderRadius: 4,
                opacity: confirming ? 0.6 : 1,
              }}
            >
              <span className="material-symbols-outlined text-sm">check</span>
              {confirming ? "저장 중..." : "확인 저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({});
              }}
              className="px-3 py-2 text-xs font-bold"
              style={{ color: "var(--color-text-muted)", borderRadius: 4 }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 서류별 편집 폼 (본인 페이지와 동일) ──

function CertificateForm({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField
        label="자격증 번호"
        value={data.cert_number || ""}
        onChange={(v) => onChange("cert_number", v)}
        placeholder="KBA-2023-12345"
      />
      <FormSelect
        label="유형"
        value={data.cert_type || ""}
        onChange={(v) => onChange("cert_type", v)}
        options={[
          { value: "referee", label: "심판" },
          { value: "scorer", label: "경기원/기록원" },
          { value: "timer", label: "타이머" },
        ]}
      />
      <FormSelect
        label="등급"
        value={data.cert_grade || ""}
        onChange={(v) => onChange("cert_grade", v)}
        options={[
          { value: "국제", label: "국제" },
          { value: "S급", label: "S급" },
          { value: "A급", label: "A급" },
          { value: "B급", label: "B급" },
          { value: "1급", label: "1급" },
          { value: "2급", label: "2급" },
          { value: "3급", label: "3급" },
        ]}
      />
      <FormField
        label="발급기관"
        value={data.issuer || ""}
        onChange={(v) => onChange("issuer", v)}
        placeholder="대한농구협회"
      />
      <FormField
        label="발급일"
        value={data.issued_date || ""}
        onChange={(v) => onChange("issued_date", v)}
        type="date"
      />
    </div>
  );
}

function BankbookForm({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FormSelect
        label="은행명"
        value={data.bank_name || ""}
        onChange={(v) => onChange("bank_name", v)}
        options={BANK_OPTIONS.map((b) => ({ value: b, label: b }))}
      />
      <FormField
        label="계좌번호"
        value={data.account_number || ""}
        onChange={(v) => onChange("account_number", v)}
        placeholder="000-0000-0000-00"
      />
      <FormField
        label="예금주"
        value={data.account_holder || ""}
        onChange={(v) => onChange("account_holder", v)}
        placeholder="홍길동"
      />
    </div>
  );
}

function IdCardForm({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        신분증은 보안상 자동 추출을 사용하지 않습니다. 직접 입력해주세요.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="이름"
          value={data.name || ""}
          onChange={(v) => onChange("name", v)}
          placeholder="홍길동"
        />
      </div>
    </div>
  );
}

// ── 공통 폼 필드 ──

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-sm outline-none"
        style={{
          backgroundColor: "var(--color-card)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 text-sm outline-none"
        style={{
          backgroundColor: "var(--color-card)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <option value="">선택하세요</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
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
