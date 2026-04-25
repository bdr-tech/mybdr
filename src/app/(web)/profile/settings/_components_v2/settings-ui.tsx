"use client";

/* ============================================================
 * settings-ui — Settings 섹션 공용 UI 빌딩 블록
 *
 * 왜:
 *  - 시안 Settings.jsx 의 Toggle / Row 스니펫을 6 섹션이 모두 공유.
 *  - 한 곳에서 정의해야 마진/구분선/색상 컨벤션이 어긋나지 않음.
 *
 * 어떻게:
 *  - SettingsRow: 라벨 + 값 + 우측 액션 버튼(또는 disabled "준비 중")
 *  - SettingsToggle: 라벨 + 설명 + 우측 토글 스위치
 *  - SettingsHeader: 섹션 카드 상단 h2 + 부설명
 *  - 색상은 모두 토큰 변수(var(--*)). 하드코딩 금지 (CLAUDE.md).
 * ============================================================ */

import type { ReactNode, MouseEvent } from "react";

/* -------- 섹션 타이틀 -------- */
export function SettingsHeader({
  title,
  desc,
  danger = false,
}: {
  title: string;
  desc?: string;
  // danger 섹션은 빨강 강조
  danger?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2
        style={{
          margin: "0 0 4px",
          fontSize: 18,
          fontWeight: 700,
          color: danger ? "var(--accent)" : "var(--ink)",
        }}
      >
        {title}
      </h2>
      {desc && (
        <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{desc}</div>
      )}
    </div>
  );
}

/* -------- Row: 라벨 / 값 / 우측 액션 -------- */
export function SettingsRow({
  label,
  value,
  action,
  onAction,
  // disabled 면 "준비 중" 의미. 클릭 무반응 + opacity.
  disabled = false,
}: {
  label: string;
  value: ReactNode;
  action: string;
  onAction?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>{value}</span>
        <button
          type="button"
          className="btn btn--sm"
          onClick={onAction}
          disabled={disabled}
          // disabled 일 때는 시안의 "준비 중" 시그널: opacity + cursor
          style={
            disabled
              ? { opacity: 0.5, cursor: "not-allowed" }
              : undefined
          }
          title={disabled ? "준비 중인 기능입니다" : undefined}
        >
          {action}
        </button>
      </div>
    </div>
  );
}

/* -------- Toggle: 라벨/설명/스위치 -------- */
export function SettingsToggle({
  label,
  desc,
  checked,
  onChange,
  disabled = false,
  loading = false,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  // loading 인 동안은 클릭 막아 더블 PATCH 방지
  loading?: boolean;
}) {
  const handleClick = () => {
    if (disabled || loading) return;
    onChange?.(!checked);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
        gap: 12,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {label}
          {disabled && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ink-mute)",
                background: "var(--bg-alt)",
                padding: "2px 6px",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
              title="준비 중인 기능입니다"
            >
              준비 중
            </span>
          )}
        </div>
        {desc && (
          <div
            style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}
          >
            {desc}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label} ${checked ? "끄기" : "켜기"}`}
        onClick={handleClick}
        disabled={disabled || loading}
        style={{
          position: "relative",
          width: 44,
          height: 24,
          // 시안: 켜짐=cafe-blue / 꺼짐=bg-alt
          background: checked ? "var(--cafe-blue)" : "var(--bg-alt)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          transition: "background .2s",
          flexShrink: 0,
        }}
      >
        <span
          // 동그라미: 22px 이동
          style={{
            position: "absolute",
            top: 1,
            left: 1,
            width: 20,
            height: 20,
            background: "#fff",
            borderRadius: "50%",
            transform: checked ? "translateX(20px)" : "translateX(0)",
            transition: "transform .2s",
            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          }}
        />
      </button>
    </div>
  );
}
