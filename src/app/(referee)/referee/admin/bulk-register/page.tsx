"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

/**
 * /referee/admin/bulk-register — Excel 일괄 사전 등록 (Client Component).
 *
 * 이유:
 *   - 파일 업로드 + 2단계 UX(미리보기 → 확정)가 클라이언트 인터랙션 중심
 *   - 기존 /referee/admin/bulk-verify 페이지의 2단계 UX 패턴을 재활용
 *
 * 1단계: role_type 선택 + 파일 업로드 → /api/web/referee-admin/bulk-register/preview
 * 2단계: 미리보기 테이블 확인 → /api/web/referee-admin/bulk-register/confirm
 * 3단계: 완료 요약 + 목록 페이지 링크
 */

// ─── 타입 정의 ───
type MatchStatus = "matched" | "unmatched" | "duplicated" | "invalid";

type PreviewRow = {
  row_number: number;
  name: string;
  phone: string;
  birth_date: string | null;
  resident_id_last4: string | null;
  license_number: string | null;
  level: string | null;
  level_raw: string | null;
  role_type: "referee" | "scorer" | "timer";
  match_status: MatchStatus;
  match_user_id: string | null;
  match_user_name: string | null;
  error: string | null;
  resident_id: string | null;
};

type PreviewResponse = {
  total: number;
  matched: number;
  unmatched: number;
  duplicated: number;
  invalid: number;
  rows: PreviewRow[];
};

type ConfirmResponse = {
  created: number;
  matched: number;
  unmatched: number;
  skipped: { duplicated: number; invalid: number };
  match_errors: Array<{ referee_id: string; reason: string }>;
};

// 매칭 상태별 뱃지 스타일
const ROW_STATUS_BADGE: Record<
  MatchStatus,
  { bg: string; color: string; label: string }
> = {
  matched: {
    bg: "var(--color-success, #22c55e)",
    color: "#fff",
    label: "매칭",
  },
  unmatched: {
    bg: "var(--color-info, #0079B9)",
    color: "#fff",
    label: "미매칭",
  },
  duplicated: {
    bg: "var(--color-text-muted)",
    color: "#fff",
    label: "중복",
  },
  invalid: {
    bg: "var(--color-primary)",
    color: "#fff",
    label: "오류",
  },
};

// level 코드 → 한글 라벨 표기
const LEVEL_LABEL: Record<string, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
  international: "국제",
};

// role_type → 한글 라벨
const ROLE_LABEL: Record<string, string> = {
  referee: "심판",
  scorer: "기록원",
  timer: "계시원",
};

export default function AdminBulkRegisterPage() {
  // 단계: idle → previewing → previewed → confirming → confirmed
  const [step, setStep] = useState<
    "idle" | "previewing" | "previewed" | "confirming" | "confirmed"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmResponse | null>(null);
  const [roleType, setRoleType] = useState<"referee" | "game_official">(
    "referee"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 템플릿 다운로드 — 클라이언트에서 xlsx 생성 (서버 경유 불필요)
  const handleTemplateDownload = () => {
    const template = [
      ["이름", "전화번호", "생년월일", "주민등록번호", "자격증번호", "급수", "구분"],
      [
        "홍길동",
        "010-1234-5678",
        "1990-01-01",
        "900101-1234567",
        "KBA-001",
        "2급",
        "심판",
      ],
      ["김기록", "010-2222-3333", "1985-06-15", "", "", "1급", "기록원"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "심판명단");
    XLSX.writeFile(wb, "referee-bulk-template.xlsx");
  };

  // 1단계: 파일 업로드 → 미리보기
  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMsg("파일을 선택해주세요.");
      return;
    }

    // 확장자 검증 — xlsx/xls만 허용
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setErrorMsg("xlsx 또는 xls 파일만 업로드 가능합니다.");
      return;
    }

    setStep("previewing");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("role_type", roleType);

      const res = await fetch("/api/web/referee-admin/bulk-register/preview", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        // apiSuccess는 { success: true, data: {...} } 형태
        const data = (json.data ?? json) as PreviewResponse;
        setPreview(data);
        setStep("previewed");
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: { message?: string } | string }).error ?? "파일 처리에 실패했습니다.";
        setErrorMsg(typeof msg === "string" ? msg : msg?.message ?? "파일 처리에 실패했습니다.");
        setStep("idle");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("idle");
    }
  };

  // 2단계: 등록 확정
  const handleConfirm = async () => {
    if (!preview) return;

    // matched + unmatched만 보냄 (duplicated/invalid는 서버에서도 스킵하지만 네트워크 절약)
    const targetRows = preview.rows.filter(
      (r) => r.match_status === "matched" || r.match_status === "unmatched"
    );

    if (targetRows.length === 0) {
      setErrorMsg("등록할 대상이 없습니다.");
      return;
    }

    setStep("confirming");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/web/referee-admin/bulk-register/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: targetRows }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = (json.data ?? json) as ConfirmResponse;
        setConfirmResult(data);
        setStep("confirmed");
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: { message?: string } | string }).error ?? "등록에 실패했습니다.";
        setErrorMsg(typeof msg === "string" ? msg : msg?.message ?? "등록에 실패했습니다.");
        setStep("previewed");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("previewed");
    }
  };

  // 리셋
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
              Excel 일괄 사전 등록
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              심판/경기원 명단을 Excel 파일로 한 번에 등록하고, 기존 가입자와 자동 매칭합니다.
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

          <div
            className="mt-3 text-xs space-y-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <p>
              <strong>필수 헤더</strong>: 이름, 전화번호
            </p>
            <p>
              <strong>선택 헤더</strong>: 생년월일, 주민등록번호, 자격증번호, 급수, 구분
            </p>
            <p style={{ color: "var(--color-text-muted)" }}>
              xlsx/xls 파일, 최대 5MB, 500행 이내
            </p>
            <p style={{ color: "var(--color-text-muted)" }}>
              &quot;구분&quot; 컬럼이 비어있으면 아래에서 선택한 기본값으로 등록됩니다.
            </p>
          </div>

          {/* 기본 역할 선택 */}
          <div className="mt-4 flex items-center gap-4">
            <span
              className="text-xs font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              기본 역할:
            </span>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="role_type"
                value="referee"
                checked={roleType === "referee"}
                onChange={() => setRoleType("referee")}
              />
              <span style={{ color: "var(--color-text-primary)" }}>심판</span>
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="role_type"
                value="game_official"
                checked={roleType === "game_official"}
                onChange={() => setRoleType("game_official")}
              />
              <span style={{ color: "var(--color-text-primary)" }}>경기원(기록/계시)</span>
            </label>
          </div>

          {/* 파일 input + 버튼 */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
            <button
              type="button"
              onClick={handleTemplateDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              <span className="material-symbols-outlined text-base">download</span>
              템플릿 다운로드
            </button>
          </div>
        </section>
      )}

      {/* 2단계: 미리보기 결과 */}
      {(step === "previewed" || step === "confirming") && preview && (
        <>
          {/* 요약 카드 */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SummaryCard label="총 행" value={preview.total} />
            <SummaryCard
              label="자동 매칭"
              value={preview.matched}
              color="var(--color-success, #22c55e)"
            />
            <SummaryCard
              label="미매칭 (신규)"
              value={preview.unmatched}
              color="var(--color-info, #0079B9)"
            />
            <SummaryCard
              label="중복"
              value={preview.duplicated}
              color="var(--color-text-muted)"
            />
            <SummaryCard
              label="오류"
              value={preview.invalid}
              color="var(--color-primary)"
            />
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
                  <th className="px-3 py-2 text-left text-xs font-bold">전화</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">생년</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">급수</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">역할</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">상태</th>
                  <th className="px-3 py-2 text-left text-xs font-bold">
                    매칭된 유저
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold">비고</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.row_number}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td
                      className="px-3 py-2"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {row.row_number}
                    </td>
                    <td
                      className="px-3 py-2"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {row.name || "-"}
                    </td>
                    <td
                      className="px-3 py-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {row.phone || "-"}
                    </td>
                    <td
                      className="px-3 py-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {row.birth_date ?? "-"}
                    </td>
                    <td
                      className="px-3 py-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {row.level
                        ? LEVEL_LABEL[row.level] ?? row.level
                        : row.level_raw ?? "-"}
                    </td>
                    <td
                      className="px-3 py-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {ROLE_LABEL[row.role_type] ?? row.role_type}
                    </td>
                    <td className="px-3 py-2">
                      <RowStatusBadge status={row.match_status} />
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {row.match_user_name ?? "-"}
                    </td>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {row.error ?? "-"}
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
              disabled={
                step === "confirming" ||
                preview.matched + preview.unmatched === 0
              }
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
              style={{
                backgroundColor:
                  preview.matched + preview.unmatched > 0
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                color: "#fff",
                borderRadius: 4,
                opacity: step === "confirming" ? 0.5 : 1,
              }}
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              {step === "confirming"
                ? "등록 중..."
                : `${preview.matched + preview.unmatched}건 등록 확정`}
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
            style={{
              color: "var(--color-success, #22c55e)",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            task_alt
          </span>
          <h2
            className="mt-4 text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            일괄 등록 완료
          </h2>
          <div
            className="mt-3 text-sm space-y-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <p>등록 완료: {confirmResult.created}건</p>
            <p>자동 매칭: {confirmResult.matched}건</p>
            <p>매칭 대기: {confirmResult.unmatched}건</p>
            {(confirmResult.skipped.duplicated > 0 ||
              confirmResult.skipped.invalid > 0) && (
              <p style={{ color: "var(--color-text-muted)" }}>
                스킵 — 중복 {confirmResult.skipped.duplicated}건 / 오류{" "}
                {confirmResult.skipped.invalid}건
              </p>
            )}
            {confirmResult.match_errors.length > 0 && (
              <p style={{ color: "var(--color-primary)" }}>
                매칭 오류: {confirmResult.match_errors.length}건 (등록은 완료)
              </p>
            )}
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/referee/admin/members"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                borderRadius: 4,
              }}
            >
              <span className="material-symbols-outlined text-base">list</span>
              심판 목록 보기
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              다시 등록
            </button>
          </div>
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

function RowStatusBadge({ status }: { status: MatchStatus }) {
  const badge = ROW_STATUS_BADGE[status];
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
