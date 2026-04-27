"use client";

// Phase 3 TeamCreate v2 — 4스텝 멀티스텝 폼 메인 컨테이너
// 이유:
//  - 시안 TeamCreate.jsx 의 4스텝(기본정보/엠블럼/활동/검토) 구조 도입
//  - 단, 서버 액션(createTeamAction) / Zod 스키마 / Prisma 는 절대 변경 금지
//  - 따라서 FormData 키 6종(name, name_en, name_primary, description, primary_color, secondary_color)은
//    숨은 필드 또는 가시 input 으로 그대로 유지하고, 시안 신규 필드(tag/home/level/days/privacy/엠블럼)는
//    UI 만 배치 + "준비 중" 라벨로 표시 → 추후 스키마 확장 시 hooking point 만 남긴다
//  - B 옵션(영문 팀명 보존): Step1 "기본 정보"에 보조 입력으로 영문명 + 대표언어 토글 그대로 흡수

import { useActionState, useState } from "react";
import { createTeamAction } from "@/app/actions/teams";
import { Stepper } from "./stepper";
import { StepBasic } from "./step-basic";
import { StepEmblem } from "./step-emblem";
import { StepActivity } from "./step-activity";
import { StepReview } from "./step-review";

// 영문명 허용 패턴 — 서버 Zod 스키마와 동일 규칙(영문/숫자/공백/하이픈)
// 이유: 서버 400 응답 전에 클라에서 친절한 메시지로 차단
const NAME_EN_PATTERN = /^[A-Za-z0-9 \-]+$/;

// 시안 컬러 팔레트 10종 — Step2 에서 클릭으로 primary_color 변경
// 이유: 시안 TeamCreate.jsx 의 colors 배열 그대로 재현 (BDR Red 첫 번째)
export const TEAM_COLORS = [
  "#E31B23", // BDR Red (시안은 #DC2626 이지만 프로젝트 토큰과 일치시킴)
  "#0F5FCC",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#0EA5E9",
  "#7C2D12",
  "#475569",
  "#EC4899",
  "#111111",
] as const;

// 활동 요일 / 실력 수준 / 공개 설정 옵션 — UI 만, DB 미반영
export const TEAM_LEVELS = ["초보", "초-중급", "중급", "중-상급", "상급", "선수급"] as const;
export const TEAM_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export const TEAM_PRIVACY = [
  { id: "public", l: "공개", d: "누구나 검색·신청 가능" },
  { id: "invite", l: "초대제", d: "초대 코드로만 합류" },
  { id: "closed", l: "비공개", d: "팀장 승인 후 합류" },
] as const;

export function TeamFormV2() {
  // 서버 액션 결과 (에러 메시지)
  const [state, formAction, pending] = useActionState(createTeamAction, null);

  // 현재 스텝 (1~4)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // === FormData 6키 (실제 서버에 제출되는 값) ===
  const [name, setName] = useState(""); // 한글 팀명 (필수)
  const [nameEn, setNameEn] = useState(""); // 영문 팀명 (선택)
  const [namePrimary, setNamePrimary] = useState<"ko" | "en">("ko"); // 대표 언어
  const [description, setDescription] = useState(""); // 팀 소개
  const [primaryColor, setPrimaryColor] = useState<string>(TEAM_COLORS[0]); // 대표 색상
  const [secondaryColor, setSecondaryColor] = useState("#E76F51"); // 보조 색상

  // === 시안 신규 필드 (UI 만, DB 미반영) ===
  const [tag, setTag] = useState(""); // 영문 태그 2~4자 (등록 시 미사용)
  const [home, setHome] = useState(""); // 홈코트
  const [level, setLevel] = useState<(typeof TEAM_LEVELS)[number]>("중급");
  const [days, setDays] = useState<string[]>([]); // 활동 요일
  const [privacy, setPrivacy] = useState<"public" | "invite" | "closed">("public");

  // === 검증 상태 ===
  const [nameEnError, setNameEnError] = useState<string | null>(null);
  // Step4 약관 동의 — 두 개 모두 체크되어야 제출 가능
  const [agreeRules, setAgreeRules] = useState(false);
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);

  // 다음 스텝으로 이동 — 각 스텝별 필수 입력 검증
  // 이유: 한글명/영문명 형식은 클라에서 먼저 막아 서버 400 회피
  function goNext() {
    if (step === 1) {
      const trimmedName = name.trim();
      if (!trimmedName) return; // 한글명 필수
      const trimmedEn = nameEn.trim();
      if (trimmedEn && !NAME_EN_PATTERN.test(trimmedEn)) {
        setNameEnError("영문/숫자/공백/하이픈만 입력할 수 있습니다.");
        return;
      }
      setNameEnError(null);
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
  }

  function goPrev() {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
  }

  // 폼 제출 직전 최종 검증 — 약관 미체크 시 차단
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!agreeRules || !agreeAccuracy) {
      e.preventDefault();
      return;
    }
    // 영문명 형식 최종 체크 (Step1을 우회한 경우 대비)
    const trimmedEn = nameEn.trim();
    if (trimmedEn && !NAME_EN_PATTERN.test(trimmedEn)) {
      e.preventDefault();
      setNameEnError("영문/숫자/공백/하이픈만 입력할 수 있습니다.");
      setStep(1);
      return;
    }
  }

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      {/* Breadcrumb — 시안 TeamCreate.jsx 그대로 */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <a href="/" style={{ cursor: "pointer" }}>홈</a>
        <span>›</span>
        <a href="/teams" style={{ cursor: "pointer" }}>팀</a>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>팀 등록</span>
      </div>

      {/* 페이지 헤더 — 시안 그대로 (eyebrow + h1 + 부제) */}
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">CREATE TEAM · 새 팀 등록</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>팀 만들기</h1>
        <p style={{ margin: "4px 0 0", color: "var(--ink-mute)", fontSize: 13 }}>
          최소 3명 이상부터 팀 등록 가능. 등록 후 팀원을 초대할 수 있어요.
        </p>
      </div>

      {/* 스텝 진행 표시 */}
      <Stepper step={step} />

      {/* 본문 — 시안 그리드 (메인 카드 + 우측 Tips aside) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 20, alignItems: "flex-start" }}>
        {/* 메인 폼 카드 */}
        <div className="card" style={{ padding: "28px 32px" }}>
          {/* 서버 에러 표시 */}
          {state?.error && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
                color: "var(--color-error)",
                fontSize: 13,
                borderRadius: 4,
              }}
            >
              {state.error}
            </div>
          )}

          {/* form 자체는 한 번만 렌더 — 모든 스텝의 hidden 필드를 항상 포함해 마지막에 일괄 전송 */}
          <form action={formAction} onSubmit={handleSubmit}>
            {/* === 항상 함께 제출되는 hidden 필드 === */}
            {/* 이유: 사용자가 어느 스텝에 있든, 최종 제출 시 6키 모두 전송되어야 한다.
                Step1 의 input 은 가시 input 이지만 step !== 1 일 때 unmount 되어도
                hidden 으로 값을 보장한다. */}
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="name_en" value={nameEn} />
            <input type="hidden" name="name_primary" value={namePrimary} />
            <input type="hidden" name="description" value={description} />
            <input type="hidden" name="primary_color" value={primaryColor} />
            <input type="hidden" name="secondary_color" value={secondaryColor} />

            {/* === 스텝별 본문 === */}
            {step === 1 && (
              <StepBasic
                name={name}
                onNameChange={setName}
                nameEn={nameEn}
                onNameEnChange={(v) => {
                  setNameEn(v);
                  if (nameEnError) setNameEnError(null);
                }}
                namePrimary={namePrimary}
                onNamePrimaryChange={setNamePrimary}
                description={description}
                onDescriptionChange={setDescription}
                tag={tag}
                onTagChange={setTag}
                nameEnError={nameEnError}
              />
            )}

            {step === 2 && (
              <StepEmblem
                tag={tag || (nameEn || name).trim().slice(0, 3).toUpperCase() || "TAG"}
                primaryColor={primaryColor}
                onPrimaryColorChange={setPrimaryColor}
                secondaryColor={secondaryColor}
                onSecondaryColorChange={setSecondaryColor}
              />
            )}

            {step === 3 && (
              <StepActivity
                home={home}
                onHomeChange={setHome}
                level={level}
                onLevelChange={setLevel}
                days={days}
                onDaysChange={setDays}
                privacy={privacy}
                onPrivacyChange={setPrivacy}
              />
            )}

            {step === 4 && (
              <StepReview
                name={name}
                nameEn={nameEn}
                namePrimary={namePrimary}
                tag={tag}
                primaryColor={primaryColor}
                home={home}
                level={level}
                privacy={privacy}
                agreeRules={agreeRules}
                onAgreeRulesChange={setAgreeRules}
                agreeAccuracy={agreeAccuracy}
                onAgreeAccuracyChange={setAgreeAccuracy}
              />
            )}

            {/* === 네비게이션 === */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 28,
                paddingTop: 20,
                borderTop: "1px solid var(--border)",
              }}
            >
              {/* 이전/취소 — 1단계에선 /teams 로 이동 */}
              {step > 1 ? (
                <button type="button" className="btn" onClick={goPrev}>
                  ← 이전
                </button>
              ) : (
                <a href="/teams" className="btn">
                  취소
                </a>
              )}

              {step < 4 && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={goNext}
                  // 1단계: 이름 비어있거나 영문명 형식 오류면 비활성
                  disabled={step === 1 && (!name.trim() || !!nameEnError)}
                >
                  다음 →
                </button>
              )}

              {step === 4 && (
                <button
                  type="submit"
                  className="btn btn--primary btn--lg"
                  // 약관 둘 다 동의해야만 제출
                  disabled={pending || !agreeRules || !agreeAccuracy}
                >
                  {pending ? "생성 중..." : "팀 등록 완료"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 우측 Tips aside — 시안 그대로 */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 120 }}>
          <div className="card" style={{ padding: "18px 20px", background: "var(--bg-alt)" }}>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 800, letterSpacing: ".1em", marginBottom: 8 }}>
              TIP
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-soft)" }}>
              좋은 팀명은 <b>3음절 이내 + 기억하기 쉬운 단어</b>가 성공적입니다. REDEEM, 3POINT, 몽키즈 모두 한 단어로 떠오르는 팀들이죠.
            </div>
          </div>
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>등록 후에는…</h3>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.8, color: "var(--ink-soft)" }}>
              <li>팀원 2명 이상 초대</li>
              <li>3명 이상일 때 리그·대회 등록 가능</li>
              <li>엠블럼/배너 업로드 (BDR+)</li>
              <li>첫 공식 경기 완료 시 레이팅 1500 부여</li>
            </ol>
          </div>
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 700, marginBottom: 6 }}>현재 요금제</div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>FREE</div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>팀 1개까지 등록 가능</div>
            <a href="/pricing" className="btn btn--sm" style={{ width: "100%", marginTop: 10, display: "inline-flex", justifyContent: "center" }}>
              BDR+ 업그레이드 →
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
