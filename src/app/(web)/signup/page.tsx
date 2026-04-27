"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signupAction } from "@/app/actions/auth";

// 이유: OAuth 콜백 실패 시 ?error=... 쿼리로 진입 → 사용자에게 안내 (기존 패턴 유지)
const OAUTH_ERRORS: Record<string, string> = {
  kakao_token: "카카오 로그인에 실패했습니다.",
  kakao_fail: "카카오 로그인 중 오류가 발생했습니다.",
  naver_token: "네이버 로그인에 실패했습니다.",
  naver_fail: "네이버 로그인 중 오류가 발생했습니다.",
  google_token: "구글 로그인에 실패했습니다.",
  google_fail: "구글 로그인 중 오류가 발생했습니다.",
};

// 이유: Step 1 진입 가드용 — 표준 RFC 단순 정규식 (서버 액션이 최종 검증, 여기는 UX 차단용)
function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function SignupPage() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  // 이유: 시안의 3-step 위저드 — 1=계정, 2=프로필, 3=활동환경
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 이유: Step 1 — 실제 회원가입에 사용되는 필드 (signupAction과 매핑)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);

  // 이유: Step 2 — 닉네임만 실작동, 나머지(포지션·키·등번호)는 UI만 (DB 컬럼 없음)
  const [nickname, setNickname] = useState("");

  // 이유: 클라이언트 진입 가드 에러 메시지 (서버 액션 에러와 별도 노출)
  const [stepError, setStepError] = useState<string | null>(null);

  // 이유: signupAction은 그대로 사용 (재작성 금지). useActionState로 서버 에러 수신
  const [serverState, formAction, pending] = useActionState(signupAction, null);

  // 이유: Step 1 → 2 진입 가드 (이메일 형식 + 비번 8자 + 일치 + 약관)
  function tryGoToStep2() {
    if (!isValidEmail(email)) {
      setStepError("올바른 이메일 형식을 입력하세요.");
      return;
    }
    if (password.length < 8) {
      setStepError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setStepError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!agreed) {
      setStepError("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }
    setStepError(null);
    setStep(2);
  }

  // 이유: Step 2 → 3 진입 가드 (닉네임 2~20자, signupAction과 동일 규칙)
  function tryGoToStep3() {
    if (nickname.length < 2 || nickname.length > 20) {
      setStepError("닉네임은 2~20자여야 합니다.");
      return;
    }
    setStepError(null);
    setStep(3);
  }

  // 이유: Step 3에서 "다음" 버튼 → form submit. 클라이언트 가드는 별도로 안 함 (signupAction이 모든 검증 수행)
  // Step 2/3의 추가 입력(포지션·키 등)은 DB 컬럼이 없어 무시. 추후 Phase 6에서 hidden field로 추가.

  const totalSteps = 3;

  return (
    <div className="page" style={{ maxWidth: 520, paddingTop: 60, margin: "0 auto" }}>
      {/* ─────────── Step indicator (원 1·2·3 + 진행선) ─────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        {[1, 2, 3].map((s) => (
          // React.Fragment 대신 Fragment를 쓰지 않고 div로 감싸도 되지만, 시안 그대로 사용
          <Step key={s} s={s} step={step} isLast={s === 3} />
        ))}
      </div>

      {/* 단계 표시 텍스트 — "회원가입 · N/3" */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-mute)",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        회원가입 · {step}/{totalSteps}
      </div>

      {/* 단계별 헤딩 */}
      <h1
        style={{
          margin: "0 0 6px",
          fontSize: 28,
          fontWeight: 800,
          textAlign: "center",
          letterSpacing: "-0.015em",
          color: "var(--ink)",
        }}
      >
        {step === 1 ? "계정 만들기" : step === 2 ? "선수 프로필" : "활동 환경"}
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          color: "var(--ink-mute)",
          textAlign: "center",
          fontSize: 14,
        }}
      >
        {step === 1
          ? "이메일과 비밀번호를 입력해주세요"
          : step === 2
            ? "경기에서 부를 이름과 포지션을 알려주세요"
            : "주로 뛰는 지역과 실력을 선택하면 맞춤 추천을 드려요"}
      </p>

      {/* ─────────── 본문 카드 ─────────── */}
      {/* form action을 카드 전체에 두는 이유: Step 3 "시작하기" 버튼이 type=submit으로 signupAction 호출 */}
      <form action={formAction}>
        <div className="card" style={{ padding: "28px 28px" }}>
          {/* OAuth 에러 표시 (있을 때만) */}
          {oauthError && OAUTH_ERRORS[oauthError] && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--danger)",
                fontSize: 13,
              }}
            >
              {OAUTH_ERRORS[oauthError]}
            </div>
          )}

          {/* 클라이언트 진입 가드 에러 */}
          {stepError && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--danger)",
                fontSize: 13,
              }}
            >
              {stepError}
            </div>
          )}

          {/* 서버 액션 에러 (signupAction 반환) */}
          {serverState?.error && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--danger)",
                fontSize: 13,
              }}
            >
              {serverState.error}
            </div>
          )}

          {/* ─────────── Step 1: 계정 (실작동) ─────────── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="label">이메일</div>
                {/* name="email" — signupAction이 formData.get("email")로 수신 */}
                <input
                  className="input"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <div className="label">비밀번호</div>
                <input
                  className="input"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상"
                  style={{ marginTop: 6 }}
                />
                <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>
                  8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다
                </div>
              </div>
              <div>
                <div className="label">비밀번호 확인</div>
                {/* name="password_confirm" — signupAction이 formData.get("password_confirm")로 수신 */}
                <input
                  className="input"
                  name="password_confirm"
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재입력"
                  style={{ marginTop: 6 }}
                />
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  marginTop: 6,
                  color: "var(--ink)",
                }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  <Link href="/terms" className="link" style={{ color: "var(--cafe-blue)" }}>
                    이용약관
                  </Link>
                  {" 및 "}
                  <Link href="/privacy" className="link" style={{ color: "var(--cafe-blue)" }}>
                    개인정보처리방침
                  </Link>
                  에 동의합니다
                </span>
              </label>

              {/* OAuth 3종 — 시안 외 보존 (간편 가입) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: "8px 0 4px",
                  color: "var(--ink-dim)",
                  fontSize: 12,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                또는 간편 가입
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {/* 카카오 */}
                <a
                  className="btn"
                  href="/api/auth/login?provider=kakao"
                  style={{ background: "#FEE500", borderColor: "#FEE500", color: "#000" }}
                >
                  카카오
                </a>
                {/* 네이버 */}
                <a
                  className="btn"
                  href="/api/auth/login?provider=naver"
                  style={{ background: "#03C75A", borderColor: "#03C75A", color: "#fff" }}
                >
                  네이버
                </a>
                {/* 구글 */}
                <a
                  className="btn"
                  href="/api/auth/login?provider=google"
                  style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                  Google
                </a>
              </div>
            </div>
          )}

          {/* ─────────── Step 2: 프로필 (닉네임만 실작동) ─────────── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="label">닉네임</div>
                {/* name="nickname" — signupAction이 formData.get("nickname")로 수신 */}
                <input
                  className="input"
                  name="nickname"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="2~20자"
                  style={{ marginTop: 6 }}
                />
              </div>

              {/* 포지션 — UI만, "준비 중" 뱃지 (DB 컬럼 없음, Phase 6 예정) */}
              <div>
                <div
                  className="label"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  포지션
                  <span
                    style={{
                      padding: "1px 6px",
                      fontSize: 10,
                      borderRadius: 4,
                      background: "var(--bg-alt)",
                      color: "var(--ink-mute)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    준비 중
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  {["가드", "슈가", "스포", "파포", "센터"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled
                      title="준비 중"
                      className="btn btn--sm"
                      style={{ cursor: "not-allowed" }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 키 / 등번호 — UI만, "준비 중" */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div
                    className="label"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    키 (cm)
                    <span
                      style={{
                        padding: "1px 6px",
                        fontSize: 10,
                        borderRadius: 4,
                        background: "var(--bg-alt)",
                        color: "var(--ink-mute)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      준비 중
                    </span>
                  </div>
                  <input
                    className="input"
                    disabled
                    placeholder="예: 182"
                    title="준비 중"
                    style={{ marginTop: 6, cursor: "not-allowed" }}
                  />
                </div>
                <div>
                  <div
                    className="label"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    등번호
                    <span
                      style={{
                        padding: "1px 6px",
                        fontSize: 10,
                        borderRadius: 4,
                        background: "var(--bg-alt)",
                        color: "var(--ink-mute)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      준비 중
                    </span>
                  </div>
                  <input
                    className="input"
                    disabled
                    placeholder="예: 7"
                    title="준비 중"
                    style={{ marginTop: 6, cursor: "not-allowed" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─────────── Step 3: 활동 환경 (UI만, 모두 "준비 중") ─────────── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div
                  className="label"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  주 활동 지역 (복수선택)
                  <span
                    style={{
                      padding: "1px 6px",
                      fontSize: 10,
                      borderRadius: 4,
                      background: "var(--bg-alt)",
                      color: "var(--ink-mute)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    준비 중
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {["강남", "강북", "강서", "강동", "분당", "일산", "수원", "인천"].map(
                    (a) => (
                      <button
                        key={a}
                        type="button"
                        disabled
                        title="준비 중"
                        className="btn btn--sm"
                        style={{ cursor: "not-allowed" }}
                      >
                        {a}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <div
                  className="label"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  실력 수준
                  <span
                    style={{
                      padding: "1px 6px",
                      fontSize: 10,
                      borderRadius: 4,
                      background: "var(--bg-alt)",
                      color: "var(--ink-mute)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    준비 중
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {["초보", "초중급", "중급", "중상급", "상급"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      disabled
                      title="준비 중"
                      className="btn btn--sm"
                      style={{ cursor: "not-allowed" }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div
                  className="label"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  관심 경기 유형
                  <span
                    style={{
                      padding: "1px 6px",
                      fontSize: 10,
                      borderRadius: 4,
                      background: "var(--bg-alt)",
                      color: "var(--ink-mute)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    준비 중
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {["픽업", "게스트", "스크림", "대회", "정기팀"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled
                      title="준비 중"
                      className="btn btn--sm"
                      style={{ cursor: "not-allowed" }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─────────── 하단 버튼 (이전 / 다음 or 시작하기) ─────────── */}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 1 && (
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setStepError(null);
                  setStep((step - 1) as 1 | 2 | 3);
                }}
              >
                이전
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                className="btn btn--primary btn--xl"
                style={{ flex: 2 }}
                onClick={tryGoToStep2}
              >
                다음
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                className="btn btn--primary btn--xl"
                style={{ flex: 2 }}
                onClick={tryGoToStep3}
              >
                다음
              </button>
            )}
            {step === 3 && (
              // Step 3 "시작하기" — type=submit으로 form action(signupAction) 호출
              // signupAction은 email/nickname/password/password_confirm 4필드만 사용 (Step 2/3 추가 필드는 무시)
              <button
                type="submit"
                className="btn btn--primary btn--xl"
                style={{ flex: 2 }}
                disabled={pending}
              >
                {pending ? "가입 중..." : "시작하기 →"}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ─────────── 풋터: 로그인 링크 ─────────── */}
      <div
        style={{
          textAlign: "center",
          marginTop: 18,
          fontSize: 13,
          color: "var(--ink-mute)",
        }}
      >
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          style={{ color: "var(--cafe-blue)", fontWeight: 600 }}
        >
          로그인
        </Link>
      </div>
    </div>
  );
}

// 이유: Step 인디케이터 1개 단위 (원 + 진행선) — render 함수로 분리하여 가독성 향상
function Step({ s, step, isLast }: { s: number; step: number; isLast: boolean }) {
  const active = s <= step;
  const done = s < step;
  return (
    <>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: active ? "var(--cafe-blue)" : "var(--bg-alt)",
          color: active ? "#fff" : "var(--ink-dim)",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 14,
          fontFamily: "var(--ff-mono)",
        }}
      >
        {s}
      </div>
      {!isLast && (
        <div
          style={{
            flex: 1,
            height: 2,
            background: done ? "var(--cafe-blue)" : "var(--bg-alt)",
          }}
        />
      )}
    </>
  );
}
