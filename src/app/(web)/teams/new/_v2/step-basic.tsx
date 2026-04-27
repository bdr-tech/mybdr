"use client";

// Phase 3 TeamCreate v2 — Step1 기본 정보
// 이유:
//  - 시안의 "팀 이름 / 팀 태그 / 팀 소개" 3입력을 메인으로 배치
//  - **B 옵션(영문 팀명 보존)**: 시안에 없는 "영문 팀명 + 대표 언어 토글"을
//    팀 소개 위에 보조 입력으로 살려둔다 (기존 기능 보존)
//  - 팀 태그는 시안 신규 필드로 DB 컬럼 없음 → UI 만, 다음 스텝의 미리보기에 영향
//  - 모든 값은 부모(team-form.tsx)의 상태로 관리되어 hidden 으로 제출됨

import { useId } from "react";

interface Props {
  // 한글 팀명 (필수, 서버 제출)
  name: string;
  onNameChange: (v: string) => void;
  // 영문 팀명 (선택, 서버 제출)
  nameEn: string;
  onNameEnChange: (v: string) => void;
  // 대표 언어 (서버 제출, 기본 ko)
  namePrimary: "ko" | "en";
  onNamePrimaryChange: (v: "ko" | "en") => void;
  // 팀 소개 (선택, 서버 제출)
  description: string;
  onDescriptionChange: (v: string) => void;
  // 팀 태그 (UI 만 — 다음 스텝 미리보기 / 검토에 사용, 서버 미제출)
  tag: string;
  onTagChange: (v: string) => void;
  // 영문명 형식 에러 (부모에서 관리)
  nameEnError: string | null;
}

export function StepBasic({
  name,
  onNameChange,
  nameEn,
  onNameEnChange,
  namePrimary,
  onNamePrimaryChange,
  description,
  onDescriptionChange,
  tag,
  onTagChange,
  nameEnError,
}: Props) {
  const idDesc = useId();
  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>기본 정보</h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-mute)" }}>
        팀 이름은 등록 후 변경이 어려우니 신중히 선택하세요.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 한글 팀명 (필수) */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            팀 이름 *
          </label>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="예: REDEEM, 3POINT, 몽키즈"
            maxLength={20}
          />
          <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>한글·영문 2~20자</div>
        </div>

        {/* B 옵션: 영문 팀명 (선택) — 기존 기능 보존 */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            영문 팀명 <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(선택)</span>
          </label>
          <input
            className="input"
            type="text"
            value={nameEn}
            onChange={(e) => onNameEnChange(e.target.value)}
            placeholder="RISING EAGLES"
            // pattern은 HTML5 단계 힌트 — 실제 차단은 부모의 goNext 에서 수행
            pattern="[A-Za-z0-9 \-]+"
            style={{
              borderColor: nameEnError ? "var(--color-error, rgb(239 68 68))" : undefined,
            }}
          />
          {nameEnError ? (
            <div style={{ marginTop: 4, fontSize: 11, color: "var(--color-error, rgb(239 68 68))" }}>{nameEnError}</div>
          ) : (
            <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-dim)" }}>
              대한민국농구협회 등록 영문명. 영문/숫자/공백/하이픈만 허용.
            </div>
          )}
        </div>

        {/* B 옵션: 대표 팀명 토글 — 영문명이 입력됐을 때만 노출 */}
        {nameEn.trim() && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
              대표 팀명 <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(우선 표시)</span>
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => onNamePrimaryChange("ko")}
                className={`btn ${namePrimary === "ko" ? "btn--primary" : ""}`}
                style={{ flex: 1 }}
              >
                한글 ({name || "팀명"})
              </button>
              <button
                type="button"
                onClick={() => onNamePrimaryChange("en")}
                className={`btn ${namePrimary === "en" ? "btn--primary" : ""}`}
                style={{ flex: 1 }}
              >
                영문 ({nameEn})
              </button>
            </div>
          </div>
        )}

        {/* 팀 태그 (시안 신규, UI 만) */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            팀 태그 <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(준비 중 · 자동 생성 예정)</span>
          </label>
          <input
            className="input"
            type="text"
            value={tag}
            onChange={(e) => onTagChange(e.target.value.toUpperCase())}
            placeholder="RDM"
            maxLength={4}
            style={{ fontFamily: "var(--ff-mono)", width: 160, textTransform: "uppercase" }}
          />
          <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>
            영문·숫자 2~4자 · 리그·대진표에 표시. 비워두면 팀명 첫 3자로 자동 생성
          </div>
        </div>

        {/* 팀 소개 */}
        <div>
          <label htmlFor={idDesc} style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            팀 소개
          </label>
          <textarea
            id={idDesc}
            className="input"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            placeholder="우리 팀은 어떤 팀인가요? 주 활동 지역, 실력 수준, 분위기 등을 적어주세요."
            maxLength={500}
            style={{ resize: "vertical" }}
          />
          <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>{description.length}/500</div>
        </div>
      </div>
    </div>
  );
}
