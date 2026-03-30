"use client";

/**
 * CourtAmbassador — 코트 앰배서더 뱃지 + 신청 버튼
 *
 * 현재 코트의 앰배서더를 표시하고, 없으면 신청 버튼을 보여준다.
 * 앰배서더가 본인이면 "직접 수정" 버튼을 표시한다.
 */

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { EDITABLE_FIELDS, type EditableFieldKey } from "@/lib/constants/court";

// SWR fetcher: JSON 응답 파싱
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// API 응답 타입
interface AmbassadorData {
  ambassador: {
    id: string;
    user_id: string;
    nickname: string;
    profile_image: string | null;
    appointed_at: string | null;
  } | null;
  my_status: string | null; // null | "pending" | "active" | "revoked"
}

interface Props {
  courtId: string;
  currentUserId?: string; // 로그인한 유저 ID (서버에서 전달)
}

export function CourtAmbassador({ courtId, currentUserId }: Props) {
  const apiUrl = `/api/web/courts/${courtId}/ambassador`;

  // SWR로 앰배서더 정보 자동 갱신
  const { data, isLoading } = useSWR<AmbassadorData>(apiUrl, fetcher, {
    revalidateOnFocus: false,
  });

  // 신청 처리 중 여부
  const [applying, setApplying] = useState(false);
  // 직접 수정 모달 열림 여부
  const [editOpen, setEditOpen] = useState(false);

  const ambassador = data?.ambassador ?? null;
  const myStatus = data?.my_status ?? null;

  // 앰배서더 신청 핸들러
  const handleApply = useCallback(async () => {
    if (!currentUserId) {
      // 로그인 안 된 경우 리다이렉트
      window.location.href = "/login";
      return;
    }
    setApplying(true);
    try {
      const res = await fetch(apiUrl, { method: "POST" });
      if (res.ok) {
        // 데이터 재검증
        mutate(apiUrl);
      } else {
        const err = await res.json();
        alert(err.error || "신청에 실패했습니다");
      }
    } finally {
      setApplying(false);
    }
  }, [apiUrl, currentUserId]);

  // 로딩 중
  if (isLoading) return null;

  // 본인이 active 앰배서더인지 확인
  const isMyAmbassador =
    ambassador && currentUserId && ambassador.user_id === currentUserId;

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 mb-4"
      style={{
        backgroundColor: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 섹션 제목 */}
      <h2
        className="text-base font-bold mb-3 flex items-center gap-1.5"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="material-symbols-outlined text-base"
          style={{ color: "var(--color-accent)" }}
        >
          shield_person
        </span>
        코트 앰배서더
      </h2>

      {/* ─── 앰배서더가 있는 경우: 뱃지 카드 ─── */}
      {ambassador && (
        <div
          className="flex items-center gap-3 rounded-lg p-3"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {/* 프로필 아바타 */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{
              backgroundColor: "var(--color-accent)",
            }}
          >
            {ambassador.profile_image ? (
              <img
                src={ambassador.profile_image}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              // 이미지 없으면 닉네임 첫 글자
              (ambassador.nickname ?? "?")[0]
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {ambassador.nickname}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span
                className="material-symbols-outlined align-middle mr-0.5"
                style={{ fontSize: "12px", color: "var(--color-success)" }}
              >
                verified
              </span>
              앰배서더
              {ambassador.appointed_at && (
                <> &middot; {new Date(ambassador.appointed_at).toLocaleDateString("ko-KR")} 임명</>
              )}
            </p>
          </div>

          {/* 본인이 앰배서더면 "직접 수정" 버튼 */}
          {isMyAmbassador && (
            <button
              onClick={() => setEditOpen(true)}
              className="shrink-0 rounded-[4px] px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              <span className="material-symbols-outlined align-middle mr-0.5" style={{ fontSize: "14px" }}>
                edit
              </span>
              직접 수정
            </button>
          )}
        </div>
      )}

      {/* ─── 앰배서더가 없는 경우: 안내 + 신청 버튼 ─── */}
      {!ambassador && (
        <div className="text-center py-4">
          <span
            className="material-symbols-outlined text-3xl mb-2"
            style={{ color: "var(--color-text-disabled)" }}
          >
            person_add
          </span>
          <p className="text-sm mb-1" style={{ color: "var(--color-text-muted)" }}>
            이 코트에 아직 앰배서더가 없습니다
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--color-text-disabled)" }}>
            앰배서더가 되면 코트 정보를 직접 관리하고 XP를 받을 수 있습니다
          </p>

          {/* 신청 상태에 따른 버튼 */}
          {myStatus === "pending" ? (
            <span
              className="inline-flex items-center gap-1 rounded-[4px] px-4 py-2 text-xs font-semibold"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
                color: "var(--color-warning)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>hourglass_top</span>
              승인 대기 중
            </span>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying}
              className="rounded-[4px] px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              {applying ? "신청 중..." : "앰배서더 신청하기"}
            </button>
          )}
        </div>
      )}

      {/* ─── 직접 수정 모달 (앰배서더 전용) ─── */}
      {editOpen && isMyAmbassador && (
        <AmbassadorEditModal
          courtId={courtId}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// AmbassadorEditModal — 앰배서더가 코트 정보를 직접 수정하는 모달
// ─────────────────────────────────────────────────
function AmbassadorEditModal({
  courtId,
  onClose,
}: {
  courtId: string;
  onClose: () => void;
}) {
  // 수정할 필드 값들을 state로 관리
  const [changes, setChanges] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필드 값 변경 핸들러
  const handleFieldChange = (key: string, value: unknown) => {
    setChanges((prev) => {
      const next = { ...prev };
      // 빈 값이면 삭제 (수정 안 함)
      if (value === "" || value === null || value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  // 저장
  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      setError("수정할 항목을 1개 이상 입력해주세요");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/courts/${courtId}/ambassador/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes }),
      });

      if (res.ok) {
        // 성공 시 페이지 새로고침 (서버 컴포넌트 데이터 갱신)
        window.location.reload();
      } else {
        const err = await res.json();
        setError(err.error || "수정에 실패했습니다");
      }
    } finally {
      setSaving(false);
    }
  };

  // EDITABLE_FIELDS에서 수정 가능한 필드 목록 렌더링
  const fieldEntries = Object.entries(EDITABLE_FIELDS) as [EditableFieldKey, (typeof EDITABLE_FIELDS)[EditableFieldKey]][];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-5"
        style={{
          backgroundColor: "var(--color-card)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-base font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            <span className="material-symbols-outlined align-middle mr-1 text-base" style={{ color: "var(--color-accent)" }}>
              edit
            </span>
            코트 정보 직접 수정
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 안내 문구 */}
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          앰배서더 권한으로 승인 없이 바로 반영됩니다. 변경할 항목만 입력해주세요.
        </p>

        {/* 필드 입력 폼 */}
        <div className="space-y-3">
          {fieldEntries.map(([key, field]) => (
            <div key={key}>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {field.label}
              </label>
              {/* 타입별 입력 렌더링 */}
              {field.type === "boolean" ? (
                <select
                  value={
                    changes[key] === true
                      ? "true"
                      : changes[key] === false
                        ? "false"
                        : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    handleFieldChange(
                      key,
                      v === "" ? null : v === "true"
                    );
                  }}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <option value="">변경 안 함</option>
                  <option value="true">있음</option>
                  <option value="false">없음</option>
                </select>
              ) : "options" in field && field.options ? (
                <select
                  value={(changes[key] as string) ?? ""}
                  onChange={(e) =>
                    handleFieldChange(key, e.target.value || null)
                  }
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <option value="">변경 안 함</option>
                  {(field.options as readonly { value: string; label: string }[]).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "number" ? (
                <input
                  type="number"
                  placeholder="변경 안 함"
                  value={(changes[key] as number) ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      key,
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                />
              ) : (
                <input
                  type="text"
                  placeholder="변경 안 함"
                  value={(changes[key] as string) ?? ""}
                  onChange={(e) =>
                    handleFieldChange(key, e.target.value || null)
                  }
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="mt-3 text-xs" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        {/* 저장/취소 버튼 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(changes).length === 0}
            className="flex-1 rounded-[4px] py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            {saving ? "저장 중..." : `수정 반영 (${Object.keys(changes).length}개 항목)`}
          </button>
          <button
            onClick={onClose}
            className="rounded-[4px] px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-muted)",
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
