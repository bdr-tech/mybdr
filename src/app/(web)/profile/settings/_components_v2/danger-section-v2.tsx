"use client";

/* ============================================================
 * DangerSectionV2 — Settings "계정 관리(Danger Zone)" 섹션
 *
 * 왜:
 *  - 시안 3 카드(데이터 내보내기 / 계정 비활성화 / 계정 삭제) 그대로.
 *  - 동작 가능: "계정 삭제" → DELETE /api/web/auth/withdraw (기존 API 사용).
 *  - 미구현: 데이터 내보내기(GDPR ZIP) / 비활성화(soft deactivate) → disabled "준비 중".
 *
 * 어떻게:
 *  - 삭제는 비밀번호 확인 폼이 있어야 안전. 시안 단순 버튼이지만 confirm + 비밀번호 prompt 추가.
 *  - 삭제 성공 시 router.replace('/login') 로 이동.
 * ============================================================ */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SettingsHeader } from "./settings-ui";

export function DangerSectionV2() {
  const router = useRouter();
  // 삭제 확인 모달 상태
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 기존 DELETE /api/web/auth/withdraw 그대로 호출
      const res = await fetch("/api/web/auth/withdraw", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        let errText = "계정 삭제에 실패했습니다.";
        try {
          const data = await res.json();
          if (data?.error && typeof data.error === "string") errText = data.error;
        } catch {
          // ignore
        }
        setError(errText);
        return;
      }
      // 세션 쿠키는 서버에서 삭제됨. 로그인 페이지로 이동.
      router.replace("/login");
    } catch {
      setError("네트워크 오류로 삭제에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SettingsHeader
        title="계정 관리"
        desc="신중히 결정하세요 — 되돌릴 수 없는 작업들"
        danger
      />

      {/* 1. 데이터 내보내기 (준비 중) */}
      <DangerCard
        title="데이터 내보내기"
        desc="프로필·경기 기록·게시물 전체를 ZIP으로 받기"
        actionLabel="요청하기"
        disabled
      />

      {/* 2. 계정 비활성화 (준비 중) */}
      <DangerCard
        title="계정 비활성화"
        desc="30일간 숨김 처리, 로그인 시 복구 가능"
        actionLabel="비활성화"
        disabled
      />

      {/* 3. 계정 삭제 (동작) — 시안: accent 강조 */}
      <DangerCard
        title="계정 삭제"
        desc="모든 데이터 영구 삭제. 복구 불가."
        actionLabel="계정 삭제"
        accent
        onAction={() => {
          setError(null);
          setPassword("");
          setConfirmOpen(true);
        }}
      />

      {/* 삭제 확인 모달 — 단순 inline 다이얼로그 (외부 의존성 없음) */}
      {confirmOpen && (
        <div
          // 화면 전체 dim + 가운데 카드
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !submitting && setConfirmOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: 420,
              width: "100%",
              padding: 24,
              background: "var(--bg-elev)",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
            aria-labelledby="delete-account-title"
          >
            <h3
              id="delete-account-title"
              style={{
                margin: "0 0 8px",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              계정을 삭제하시겠습니까?
            </h3>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 13,
                color: "var(--ink-mute)",
                lineHeight: 1.5,
              }}
            >
              계정 삭제 후 모든 활동 기록이 익명화되며 복구할 수 없습니다. 본인
              확인을 위해 현재 비밀번호를 입력하세요.
            </p>
            <input
              type="password"
              className="input"
              placeholder="현재 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              style={{ width: "100%", marginBottom: 12 }}
              autoFocus
            />
            {error && (
              <p
                role="alert"
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  color: "var(--accent)",
                }}
              >
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn--sm"
                onClick={handleDelete}
                disabled={submitting}
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  borderColor: "var(--accent)",
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "wait" : "pointer",
                }}
              >
                {submitting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ----- Danger 카드 1개. 시안의 box(border + radius) ----- */
function DangerCard({
  title,
  desc,
  actionLabel,
  onAction,
  disabled = false,
  accent = false,
}: {
  title: string;
  desc: string;
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px 18px",
        // accent(삭제) 카드는 빨강 테두리 + 옅은 빨강 배경
        border: accent ? "2px solid var(--accent)" : "2px solid var(--border)",
        borderRadius: 8,
        marginBottom: 12,
        background: accent
          ? "color-mix(in oklab, var(--accent) 6%, transparent)"
          : "transparent",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: 4,
          color: accent ? "var(--accent)" : "var(--ink)",
        }}
      >
        {title}
      </div>
      <div
        style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 10 }}
      >
        {desc}
      </div>
      <button
        type="button"
        className="btn btn--sm"
        onClick={onAction}
        disabled={disabled}
        style={
          accent
            ? {
                background: "var(--accent)",
                color: "#fff",
                borderColor: "var(--accent)",
              }
            : disabled
              ? { opacity: 0.5, cursor: "not-allowed" }
              : undefined
        }
        title={disabled ? "준비 중인 기능입니다" : undefined}
      >
        {actionLabel}
      </button>
    </div>
  );
}
