"use client";

// Phase 3 TeamCreate v2 — Step4 검토 및 약관
// 이유:
//  - 시안의 "검토 표 + 약관 체크 2개" 구조 그대로 재현
//  - 약관 둘 다 체크해야 부모(team-form) 의 제출 버튼이 활성화 — 본 컴포넌트는 상태 끌어올림만 담당
//  - 표시값은 부모 상태 6키 + 시안 신규 4필드 (tag/home/level/privacy) 통합

import type { TEAM_LEVELS } from "./team-form";
import { TEAM_PRIVACY } from "./team-form";

interface Props {
  // 서버 제출 값
  name: string;
  nameEn: string;
  namePrimary: "ko" | "en";
  primaryColor: string;
  // UI 값
  tag: string;
  home: string;
  level: (typeof TEAM_LEVELS)[number];
  privacy: "public" | "invite" | "closed";
  // 약관 동의 (둘 다 체크해야 제출 가능)
  agreeRules: boolean;
  onAgreeRulesChange: (v: boolean) => void;
  agreeAccuracy: boolean;
  onAgreeAccuracyChange: (v: boolean) => void;
}

export function StepReview({
  name,
  nameEn,
  namePrimary,
  primaryColor,
  tag,
  home,
  level,
  privacy,
  agreeRules,
  onAgreeRulesChange,
  agreeAccuracy,
  onAgreeAccuracyChange,
}: Props) {
  // 표시용 fallback — 미입력 시 "(미입력)"
  const fallback = (v: string | null | undefined) => (v && v.trim() ? v : "(미입력)");
  const privacyLabel = TEAM_PRIVACY.find((p) => p.id === privacy)?.l ?? "—";

  // 표시용 팀 이름 — 대표 언어에 따라 정렬
  const displayName = namePrimary === "en" && nameEn.trim() ? `${nameEn} / ${name}` : name;

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>검토 및 생성</h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-mute)" }}>
        입력한 정보를 한 번 더 확인해주세요.
      </p>

      {/* 검토 표 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr",
          gap: 14,
          fontSize: 13,
          marginBottom: 20,
          padding: "16px 18px",
          background: "var(--bg-alt)",
          borderRadius: 6,
        }}
      >
        <div style={{ color: "var(--ink-dim)", fontWeight: 700 }}>팀 이름</div>
        <div style={{ fontWeight: 600 }}>{fallback(displayName)}</div>

        {/* 영문명이 있을 때만 별도 행 표시 (대표 언어가 ko 일 때 영문명 노출) */}
        {nameEn.trim() && namePrimary === "ko" && (
          <>
            <div style={{ color: "var(--ink-dim)", fontWeight: 700 }}>영문명</div>
            <div style={{ fontWeight: 600 }}>{nameEn}</div>
          </>
        )}

        <div style={{ color: "var(--ink-dim)", fontWeight: 700 }}>팀 태그</div>
        <div style={{ fontWeight: 600, fontFamily: "var(--ff-mono)" }}>
          {tag.trim() ? tag : <span style={{ color: "var(--ink-mute)" }}>(자동 생성 예정)</span>}
        </div>

        <div style={{ color: "var(--ink-dim)", fontWeight: 700 }}>컬러</div>
        <div style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 600 }}>
          <span style={{ width: 16, height: 16, background: primaryColor, borderRadius: 3, display: "inline-block" }} />
          <code>{primaryColor}</code>
        </div>

        <div style={{ color: "var(--ink-dim)", fontWeight: 700 }}>활동 코트</div>
        <div style={{ fontWeight: 600 }}>
          {home.trim() ? home : <span style={{ color: "var(--ink-mute)" }}>(미입력 · 준비 중)</span>}
        </div>

        <div style={{ color: "var(--ink-dim)", fontWeight: 700 }}>실력 수준</div>
        <div style={{ fontWeight: 600 }}>
          {level} <span style={{ color: "var(--ink-mute)", fontWeight: 400, fontSize: 11 }}>(준비 중)</span>
        </div>

        <div style={{ color: "var(--ink-dim)", fontWeight: 700 }}>공개 설정</div>
        <div style={{ fontWeight: 600 }}>
          {privacyLabel} <span style={{ color: "var(--ink-mute)", fontWeight: 400, fontSize: 11 }}>(준비 중)</span>
        </div>

        <div style={{ color: "var(--ink-dim)", fontWeight: 700 }}>최초 팀장</div>
        <div style={{ fontWeight: 600 }}>나 (현재 로그인 계정)</div>
      </div>

      {/* 약관 동의 — 부모의 제출 버튼이 두 체크 모두 true일 때만 활성 */}
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={agreeRules}
          onChange={(e) => onAgreeRulesChange(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span>
          BDR 팀 운영 규칙에 동의합니다 (
          <a href="/terms" style={{ color: "var(--cafe-blue)" }} target="_blank" rel="noreferrer">
            전문보기
          </a>
          )
        </span>
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
        <input
          type="checkbox"
          checked={agreeAccuracy}
          onChange={(e) => onAgreeAccuracyChange(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span>허위 정보 등록 시 팀 삭제 가능함을 이해합니다</span>
      </label>
    </div>
  );
}
