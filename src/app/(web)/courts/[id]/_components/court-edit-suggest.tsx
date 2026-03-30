"use client";

/**
 * CourtEditSuggest -- 코트 정보 수정 제안 (유저 위키)
 *
 * SWR로 제안 목록 패치 + 수정 제안 폼 + 이력 표시.
 * court-reports.tsx의 SWR 패턴을 그대로 사용한다.
 */

import { useState } from "react";
import useSWR from "swr";
import {
  EDITABLE_FIELDS,
  EDITABLE_FIELD_KEYS,
  type EditableFieldKey,
} from "@/lib/constants/court";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 제안 목록 API 응답 타입
interface SuggestionData {
  id: string;
  user_id: string;
  nickname: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  reason: string;
  status: string;
  reviewer_nickname: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface CourtEditSuggestProps {
  courtId: string;
  currentUserId?: string;
}

// 필드 값을 사람이 읽기 쉬운 텍스트로 변환하는 헬퍼
function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "미등록";
  if (typeof value === "boolean") return value ? "있음" : "없음";

  const fieldDef = EDITABLE_FIELDS[key as EditableFieldKey];
  if (!fieldDef) return String(value);

  // select 타입이면 options에서 label 찾기
  if ("options" in fieldDef && fieldDef.options) {
    const option = fieldDef.options.find(
      (o: { value: string; label: string }) => o.value === value
    );
    if (option) return option.label;
  }

  // 숫자에 단위 추가
  if (key === "fee") return `${Number(value).toLocaleString()}원`;
  if (key === "hoops_count") return `${value}개`;

  return String(value);
}

// 상태 뱃지 색상 매핑
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "color-mix(in srgb, var(--color-accent) 15%, transparent)", color: "var(--color-accent)", label: "심사 대기" },
  approved: { bg: "color-mix(in srgb, var(--color-success) 15%, transparent)", color: "var(--color-success)", label: "승인됨" },
  rejected: { bg: "color-mix(in srgb, var(--color-error) 15%, transparent)", color: "var(--color-error)", label: "거절됨" },
};

export function CourtEditSuggest({ courtId, currentUserId }: CourtEditSuggestProps) {
  const [showForm, setShowForm] = useState(false);
  // 사용자가 수정할 필드를 선택하면 값 입력 상태에 추가
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // SWR로 제안 목록 패치
  const { data, mutate } = useSWR<{ suggestions: SuggestionData[]; total: number }>(
    `/api/web/courts/${courtId}/suggestions`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const suggestions = data?.suggestions ?? [];

  // 필드 추가/제거 토글
  const toggleField = (key: EditableFieldKey) => {
    setEditValues((prev) => {
      const next = { ...prev };
      if (key in next) {
        delete next[key];
      } else {
        // 기본값: boolean은 false, number는 0, string은 ""
        const fieldDef = EDITABLE_FIELDS[key];
        if (fieldDef.type === "boolean") next[key] = false;
        else if (fieldDef.type === "number") next[key] = 0;
        else next[key] = "";
      }
      return next;
    });
  };

  // 필드 값 변경
  const updateFieldValue = (key: string, value: unknown) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  // 제안 제출
  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (Object.keys(editValues).length === 0) {
      setError("수정할 항목을 1개 이상 선택해주세요");
      return;
    }
    if (!trimmedReason || trimmedReason.length < 2) {
      setError("수정 사유를 2자 이상 입력해주세요");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/courts/${courtId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: editValues, reason: trimmedReason }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || "제안에 실패했습니다");
        return;
      }

      // 성공 → 초기화 + 목록 갱신 + 성공 메시지
      setShowForm(false);
      setEditValues({});
      setReason("");
      setSuccessMsg("수정 제안이 등록되었습니다. 관리자 승인 후 반영됩니다.");
      mutate();

      // 3초 후 성공 메시지 자동 제거
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 mb-4"
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
            style={{ color: "var(--color-info)" }}
          >
            edit_note
          </span>
          정보 수정 제안
          {suggestions.filter((s) => s.status === "pending").length > 0 && (
            <span
              className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-info)", minWidth: "18px", height: "18px" }}
            >
              {suggestions.filter((s) => s.status === "pending").length}
            </span>
          )}
        </h2>

        {/* 제안 버튼: 로그인 시만 */}
        {currentUserId && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-info) 15%, transparent)",
              color: "var(--color-info)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              edit
            </span>
            정보 수정 제안
          </button>
        )}
      </div>

      {/* 성공 메시지 */}
      {successMsg && (
        <div
          className="rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-success) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-success) 30%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "16px", color: "var(--color-success)" }}
          >
            check_circle
          </span>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {successMsg}
          </p>
        </div>
      )}

      {/* ─── 수정 제안 작성 폼 ─── */}
      {showForm && (
        <div
          className="rounded-xl p-4 mb-3"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <h3
            className="text-sm font-bold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            수정할 항목 선택
          </h3>

          {/* 필드 선택 버튼들 — 클릭하면 해당 필드 입력창이 아래에 나타남 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {EDITABLE_FIELD_KEYS.map((key) => {
              const field = EDITABLE_FIELDS[key];
              const isSelected = key in editValues;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleField(key)}
                  className="inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? "color-mix(in srgb, var(--color-info) 20%, transparent)"
                      : "var(--color-surface-bright)",
                    color: isSelected
                      ? "var(--color-info)"
                      : "var(--color-text-secondary)",
                    border: isSelected
                      ? "1px solid var(--color-info)"
                      : "1px solid transparent",
                  }}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      check
                    </span>
                  )}
                  {field.label}
                </button>
              );
            })}
          </div>

          {/* 선택된 필드별 입력 UI */}
          {Object.keys(editValues).length > 0 && (
            <div className="space-y-3 mb-3">
              {Object.entries(editValues).map(([key, value]) => {
                const field = EDITABLE_FIELDS[key as EditableFieldKey];
                if (!field) return null;

                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {field.label}
                    </label>

                    {/* select 입력 */}
                    {field.input === "select" && "options" in field && (
                      <select
                        value={String(value)}
                        onChange={(e) => updateFieldValue(key, e.target.value)}
                        className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--color-surface-bright)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        <option value="">선택해주세요</option>
                        {field.options.map((opt: { value: string; label: string }) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* toggle (boolean) 입력 */}
                    {field.input === "toggle" && (
                      <button
                        type="button"
                        onClick={() => updateFieldValue(key, !value)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                        style={{
                          backgroundColor: "var(--color-surface-bright)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: "20px",
                            color: value
                              ? "var(--color-success)"
                              : "var(--color-text-disabled)",
                          }}
                        >
                          {value ? "toggle_on" : "toggle_off"}
                        </span>
                        {value ? "있음" : "없음"}
                      </button>
                    )}

                    {/* number 입력 */}
                    {field.input === "number" && (
                      <input
                        type="number"
                        value={Number(value) || ""}
                        onChange={(e) => updateFieldValue(key, Number(e.target.value))}
                        min={"min" in field ? field.min : undefined}
                        max={"max" in field ? field.max : undefined}
                        className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--color-surface-bright)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      />
                    )}

                    {/* text 입력 */}
                    {field.input === "text" && (
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => updateFieldValue(key, e.target.value)}
                        maxLength={"maxLength" in field ? field.maxLength : undefined}
                        className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--color-surface-bright)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      />
                    )}

                    {/* textarea 입력 */}
                    {field.input === "textarea" && (
                      <textarea
                        value={String(value)}
                        onChange={(e) => updateFieldValue(key, e.target.value)}
                        maxLength={"maxLength" in field ? field.maxLength : undefined}
                        rows={3}
                        className="rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
                        style={{
                          backgroundColor: "var(--color-surface-bright)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      />
                    )}

                    {/* time 입력 */}
                    {field.input === "time" && (
                      <input
                        type="time"
                        value={String(value)}
                        onChange={(e) => updateFieldValue(key, e.target.value)}
                        className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--color-surface-bright)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 수정 사유 (필수) */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="수정 사유를 입력해주세요 (필수, 예: 직접 방문하여 확인)"
            maxLength={200}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none mb-1"
            style={{
              backgroundColor: "var(--color-surface-bright)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
            }}
          />
          <p className="text-xs mb-3" style={{ color: "var(--color-text-disabled)" }}>
            승인 시 10 XP가 지급됩니다
          </p>

          {/* 에러 메시지 */}
          {error && (
            <p className="mb-2 text-xs" style={{ color: "var(--color-error)" }}>
              {error}
            </p>
          )}

          {/* 버튼 그룹 */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-[4px] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-info)" }}
            >
              {submitting ? "제출 중..." : "제안 등록"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditValues({});
                setReason("");
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

      {/* ─── 제안 이력 목록 ─── */}
      {suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.map((s) => {
            const statusStyle = STATUS_STYLE[s.status] ?? STATUS_STYLE.pending;
            return (
              <div
                key={s.id}
                className="rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                {/* 헤더: 닉네임 + 날짜 + 상태 뱃지 */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {s.nickname}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-disabled)" }}
                    >
                      {new Date(s.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <span
                    className="rounded-[4px] px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </div>

                {/* 변경 내용 diff 표시 */}
                <div className="space-y-1">
                  {Object.entries(s.changes).map(([key, diff]) => {
                    const field = EDITABLE_FIELDS[key as EditableFieldKey];
                    if (!field) return null;
                    return (
                      <div key={key} className="flex items-center gap-1.5 text-xs">
                        <span
                          className="font-medium"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {field.label}:
                        </span>
                        <span style={{ color: "var(--color-text-disabled)" }}>
                          {formatFieldValue(key, diff.old)}
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "12px", color: "var(--color-text-disabled)" }}
                        >
                          arrow_forward
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--color-info)" }}
                        >
                          {formatFieldValue(key, diff.new)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 사유 */}
                <p
                  className="mt-1.5 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  사유: {s.reason}
                </p>

                {/* 거절 사유 표시 */}
                {s.status === "rejected" && s.review_note && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--color-error)" }}
                  >
                    거절 사유: {s.review_note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            아직 수정 제안이 없습니다. 코트에 대한 정보를 알고 있다면 제안해주세요!
          </p>
        )
      )}
    </div>
  );
}
