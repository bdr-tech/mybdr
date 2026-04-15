"use client";

import { useState, useRef } from "react";
import Link from "next/link";

/**
 * /referee/admin/bulk-verify — Excel 일괄 검증 (Client Component).
 *
 * 이유: 파일 업로드 + 2단계 UX(미리보기 → 확정)가 클라이언트 인터랙션이므로 "use client".
 *
 * 1단계: input[type=file] → FormData → /api/web/admin/bulk-verify/preview POST → 결과 테이블
 * 2단계: matched인 cert_ids 수집 → /api/web/admin/bulk-verify/confirm POST → 완료
 */

// ─── 타입 정의 ───
type PreviewRow = {
  row_number: number;
  name: string;
  birth_date: string;
  phone: string;
  cert_type: string;
  cert_grade: string;
  status: "matched" | "partial" | "no_match" | "already_verified";
  message: string;
  certificate_id: number | null;
};

type PreviewSummary = {
  total: number;
  matched: number;
  partial: number;
  no_match: number;
  already_verified: number;
};

type PreviewResponse = {
  rows: PreviewRow[];
  summary: PreviewSummary;
};

type ConfirmResponse = {
  verified: number;
  skipped: number;
  errors: { id: number; reason: string }[];
  total_requested: number;
};

// 상태별 뱃지 색상
const ROW_STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  matched:          { bg: "var(--color-success, #22c55e)", color: "#fff", label: "매칭" },
  partial:          { bg: "var(--color-info, #0079B9)",    color: "#fff", label: "부분" },
  no_match:         { bg: "var(--color-primary)",           color: "#fff", label: "불일치" },
  already_verified: { bg: "var(--color-text-muted)",        color: "#fff", label: "검증됨" },
};

export default function AdminBulkVerifyPage() {
  // 단계: idle → previewing → previewed → confirming → confirmed
  const [step, setStep] = useState<"idle" | "previewing" | "previewed" | "confirming" | "confirmed">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1단계: 파일 업로드 → 미리보기
  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMsg("파일을 선택해주세요.");
      return;
    }

    // 확장자 검증
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setErrorMsg("xlsx 또는 xls 파일만 업로드 가능합니다.");
      return;
    }

    setStep("previewing");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/web/admin/bulk-verify/preview", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const data = (await res.json()) as PreviewResponse;
        setPreview(data);
        setStep("previewed");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "파일 처리에 실패했습니다.");
        setStep("idle");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("idle");
    }
  };

  // 2단계: 검증 확정
  const handleConfirm = async () => {
    if (!preview) return;

    // matched인 행의 certificate_id만 수집
    const certIds = preview.rows
      .filter((r) => r.status === "matched" && r.certificate_id !== null)
      .map((r) => r.certificate_id as number);

    if (certIds.length === 0) {
      setErrorMsg("검증할 대상이 없습니다.");
      return;
    }

    setStep("confirming");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/web/admin/bulk-verify/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificate_ids: certIds }),
      });

      if (res.ok) {
        const data = (await res.json()) as ConfirmResponse;
        setConfirmResult(data);
        setStep("confirmed");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "일괄 검증에 실패했습니다.");
        setStep("previewed");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("previewed");
    }
  };

  // 처음으로 리셋
  const handleReset = () => {
    setStep("idle");
    setPreview(null);
    setConfirmResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header>
        <div className="flex items-center gap-3">
          <Link
            href="/referee/admin"
            className="inline-flex items-center text-sm font-bold"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </Link>
          <div>
            <h1
              className="text-2xl font-black uppercase tracking-wider"
              style={{ color: "var(--color-text-primary)" }}
            >
              Excel 일괄 검증
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Excel 파일로 자격증을 일괄 검증합니다.
            </p>
          </div>
        </div>
      </header>

      {/* 에러 배너 */}
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

      {/* 1단계: 파일 업로드 */}
      {(step === "idle" || step === "previewing") && (
        <section
          className="p-6"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            1단계: 파일 업로드
          </h2>
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            필수 헤더: 이름, 생년월일, 전화번호, 자격증종류, 자격등급
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            xlsx/xls 파일, 최대 5MB, 500행 이내
          </p>

          <div className="mt-4 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="text-sm"
              style={{ color: "var(--color-text-primary)" }}
            />
            <button
              type="button"
              onClick={handleFileUpload}
              disabled={step === "previewing"}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                borderRadius: 4,
                opacity: step === "previewing" ? 0.5 : 1,
              }}
            >
              <span className="material-symbols-outlined text-base">upload_file</span>
              {step === "previewing" ? "분석 중..." : "미리보기"}
            </button>
          </div>
        </section>
      )}

      {/* 2단계: 미리보기 결과 */}
      {(step === "previewed" || step === "confirming") && preview && (
        <>
          {/* 요약 통계 */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SummaryCard label="총 행" value={preview.summary.total} />
            <SummaryCard label="매칭" value={preview.summary.matched} color="var(--color-success, #22c55e)" />
            <SummaryCard label="부분 매칭" value={preview.summary.partial} color="var(--color-info, #0079B9)" />
            <SummaryCard label="불일치" value={preview.summary.no_match} color="var(--color-primary)" />
            <SummaryCard label="이미 검증됨" value={preview.summary.already_verified} color="var(--color-text-muted)" />
          </section>

          {/* 상세 테이블 */}
          <div
            className="overflow-x-auto"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <th className="px-3 py-2 text-left text-xs font-bold">행</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">이름</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">생년월일</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">자격증</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">상태</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">메시지</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.row_number}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td className="px-3 py-2" style={{ color: "var(--color-text-muted)" }}>
                      {row.row_number}
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-primary)" }}>
                      {row.name}
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>
                      {row.birth_date}
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>
                      {row.cert_type} {row.cert_grade}
                    </td>
                    <td className="px-3 py-2">
                      <RowStatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {row.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 확정/취소 버튼 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={step === "confirming" || preview.summary.matched === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
              style={{
                backgroundColor: preview.summary.matched > 0 ? "var(--color-primary)" : "var(--color-text-muted)",
                color: "#fff",
                borderRadius: 4,
                opacity: step === "confirming" ? 0.5 : 1,
              }}
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              {step === "confirming"
                ? "처리 중..."
                : `${preview.summary.matched}건 검증 확정`}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={step === "confirming"}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              취소
            </button>
          </div>
        </>
      )}

      {/* 3단계: 완료 */}
      {step === "confirmed" && confirmResult && (
        <section
          className="p-6 text-center"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined text-5xl"
            style={{ color: "var(--color-success, #22c55e)", fontVariationSettings: "'FILL' 1" }}
          >
            task_alt
          </span>
          <h2
            className="mt-4 text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            일괄 검증 완료
          </h2>
          <div
            className="mt-3 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <p>검증 완료: {confirmResult.verified}건</p>
            <p>건너뜀 (이미 검증됨): {confirmResult.skipped}건</p>
            {confirmResult.errors.length > 0 && (
              <p style={{ color: "var(--color-primary)" }}>
                오류: {confirmResult.errors.length}건
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              borderRadius: 4,
            }}
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            다시 업로드
          </button>
        </section>
      )}
    </div>
  );
}

// ─── 하위 컴포넌트 ───

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      className="p-3 text-center"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
      }}
    >
      <p
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-xl font-black"
        style={{ color: color ?? "var(--color-text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

function RowStatusBadge({ status }: { status: string }) {
  const badge = ROW_STATUS_BADGE[status] ?? {
    bg: "var(--color-surface)",
    color: "var(--color-text-muted)",
    label: status,
  };
  return (
    <span
      className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: badge.bg,
        color: badge.color,
        borderRadius: 4,
      }}
    >
      {badge.label}
    </span>
  );
}
