"use client";

import { useState, useActionState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { loginAction, devLoginAction } from "@/app/actions/auth";
import { InfoDialog } from "@/components/ui/info-dialog";

// OAuth 콜백 에러 코드 → 사용자용 한국어 메시지 매핑
// (기존 로직 유지 — UI만 교체하므로 동일)
const OAUTH_ERRORS: Record<string, string> = {
  kakao_token: "카카오 로그인에 실패했습니다.",
  kakao_fail: "카카오 로그인 중 오류가 발생했습니다.",
  naver_token: "네이버 로그인에 실패했습니다.",
  naver_fail: "네이버 로그인 중 오류가 발생했습니다.",
  google_token: "구글 로그인에 실패했습니다.",
  google_fail: "구글 로그인 중 오류가 발생했습니다.",
  no_permission: "해당 페이지에 접근할 권한이 없습니다.",
};

// 로그인 후 이동할 경로별 안내 배너 매핑
// 등록된 경로만 배너 표시 (화이트리스트 방식 — 임의 경로 메시지 주입 차단)
const REDIRECT_BANNERS: Record<string, { title: string; desc: string }> = {
  "/games/new": {
    title: "경기 만들기는 로그인이 필요해요",
    desc: "로그인 후 바로 경기 생성 화면으로 이동합니다.",
  },
};

// open redirect 방어: 내부 경로만 허용 (외부 URL, 프로토콜 상대 URL 차단)
// 참고: src/app/api/auth/login/route.ts의 isValidRedirect와 동일 로직
function isValidRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export default function LoginPage() {
  // 탭 상태 — 시안 기준 'login' | 'signup'
  // 회원가입 탭은 모든 입력이 disabled 상태이며, "가입하기" 버튼만 /signup 페이지로 이동
  const [tab, setTab] = useState<"login" | "signup">("login");

  // 로그인 폼 상태 (서버 액션 바인딩) — 기존 로직 그대로
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, null);
  // 개발 환경 자동 로그인 (NODE_ENV !== production일 때만 노출)
  const [devState, devFormAction, devPending] = useActionState(devLoginAction, null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const oauthError = searchParams.get("error");
  // OAuth 에러를 InfoDialog(모달)로 노출: URL 쿼리가 있으면 열림, 확인 시 쿼리에서 제거하여 재열림 방지
  // 로컬 state를 두는 이유: 사용자가 확인을 눌러도 URL에는 error가 남아있는 타이밍에 모달이 재열리는 걸 막음
  const [showOauthErrorDialog, setShowOauthErrorDialog] = useState<boolean>(
    !!(oauthError && OAUTH_ERRORS[oauthError]),
  );
  // 로그인 후 돌아갈 경로 (예: /referee → layout에서 redirect=/referee로 보냄)
  // open redirect 방어를 통과한 값만 실제 redirect 값으로 사용
  const rawRedirect = searchParams.get("redirect");
  const redirectTo = rawRedirect && isValidRedirect(rawRedirect) ? rawRedirect : null;
  // 등록된 경로에 한해 안내 플로팅 다이얼로그 노출 (매핑에 없으면 생략)
  // 전역 컨벤션: "모든 플로팅 UI는 확인 버튼 / backdrop / ESC로 닫힘" 적용
  const redirectBanner = redirectTo ? REDIRECT_BANNERS[redirectTo] : null;
  const [showRedirectDialog, setShowRedirectDialog] = useState<boolean>(!!redirectBanner);

  return (
    // BDR v2 시안 — page 컨테이너 + 상단 여백 확보
    <div className="page" style={{ maxWidth: 480, paddingTop: 60, margin: "0 auto" }}>
      {/* 헤더: MyBDR. 대형 타이포 + 서브타이틀 */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          MyBDR<span style={{ color: "var(--accent)" }}>.</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 6 }}>
          서울 3x3 농구 커뮤니티
        </div>
      </div>

      {/* 카드: 탭 헤더 + 본문 */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* 탭 (로그인 / 회원가입) — cafe-blue 하단 라인 */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {[
            ["login", "로그인"] as const,
            ["signup", "회원가입"] as const,
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{
                flex: 1,
                padding: "14px 0",
                background: tab === k ? "var(--bg-elev)" : "var(--bg-alt)",
                border: 0,
                borderBottom:
                  tab === k ? "3px solid var(--cafe-blue)" : "3px solid transparent",
                color: tab === k ? "var(--ink)" : "var(--ink-mute)",
                fontWeight: tab === k ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* 본문 패딩 — 시안 기준 24px */}
        <div style={{ padding: "24px 24px 28px" }}>
          {tab === "login" ? (
            // ─────────── 로그인 탭 ───────────
            <>
              {/* 서버 액션 에러 메시지 */}
              {loginState?.error && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--accent-soft)",
                    color: "var(--danger)",
                    fontSize: 13,
                  }}
                >
                  {loginState.error}
                </div>
              )}

              {/* 로그인 폼 — 서버 액션은 그대로, 시안 input/label만 적용 */}
              <form action={loginFormAction}>
                {/* 로그인 성공 후 복귀할 경로를 hidden input으로 전달 */}
                {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

                <div className="label">이메일</div>
                <input
                  className="input"
                  name="email"
                  type="email"
                  required
                  placeholder="email@example.com"
                  style={{ marginBottom: 14 }}
                />

                <div className="label">비밀번호</div>
                <input
                  className="input"
                  name="password"
                  type="password"
                  required
                  placeholder="비밀번호"
                  style={{ marginBottom: 12 }}
                />

                {/* 자동 로그인 + 비밀번호 찾기 한 줄 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    marginBottom: 18,
                  }}
                >
                  {/* 자동 로그인: UI만 배치 + disabled + tooltip ("준비 중")
                      추후 구현 — Phase 6 Login (token 시스템 필요) */}
                  <label
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      cursor: "not-allowed",
                      color: "var(--ink-dim)",
                    }}
                    title="준비 중"
                  >
                    <input type="checkbox" disabled />
                    자동 로그인
                    <span
                      style={{
                        marginLeft: 4,
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
                  </label>
                  {/* 비밀번호 찾기 — 기존 /forgot-password 라우트 유지 */}
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      color: "var(--link)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    비밀번호 찾기
                  </button>
                </div>

                {/* 로그인 제출 버튼 — 시안 .btn--primary .btn--xl */}
                <button type="submit" className="btn btn--primary btn--xl" disabled={loginPending}>
                  {loginPending ? "로그인 중..." : "로그인"}
                </button>
              </form>

              {/* 또는 divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: "18px 0",
                  color: "var(--ink-dim)",
                  fontSize: 12,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                또는
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* 카카오 / 네이버 grid (시안) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {/* 카카오: 정상 동작 — 기존 OAuth 라우트 유지 */}
                <a
                  className="btn"
                  href={`/api/auth/login?provider=kakao${
                    redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""
                  }`}
                  style={{ background: "#FEE500", borderColor: "#FEE500", color: "#000" }}
                >
                  카카오
                </a>
                {/* 네이버: 준비 중 (비활성화) — disabled 표시
                    추후 구현 — Phase 6 Login (네이버 OAuth 활성화) */}
                <button
                  type="button"
                  className="btn"
                  disabled
                  title="준비 중"
                  style={{ cursor: "not-allowed" }}
                >
                  네이버 (준비 중)
                </button>
              </div>

              {/* Google OAuth — 시안 외 추가 (기능 보존을 위해 유지) */}
              <a
                className="btn"
                href={`/api/auth/login?provider=google${
                  redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""
                }`}
                style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 8 }}
              >
                {/* Google 컬러 G 로고 */}
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                Google로 시작하기
              </a>
            </>
          ) : (
            // ─────────── 회원가입 탭 (모두 disabled + "준비 중" 뱃지) ───────────
            // 시안 인라인 폼은 노출하되, 입력은 모두 비활성화하고
            // "가입하기" 버튼은 실제 가입 페이지(/signup)로 라우팅한다.
            // 추후 구현 — Phase 6 Login (회원가입 인라인 폼)
            <>
              {/* 준비 중 안내 뱃지 */}
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--cafe-blue-soft)",
                  color: "var(--cafe-blue-deep)",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "var(--cafe-blue)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                >
                  준비 중
                </span>
                인라인 회원가입은 곧 제공돼요. 우선 기존 가입 페이지로 이동합니다.
              </div>

              <div className="label">아이디</div>
              <input
                className="input"
                placeholder="영문+숫자 6자 이상"
                disabled
                style={{ marginBottom: 14 }}
              />
              <div className="label">비밀번호</div>
              <input
                className="input"
                type="password"
                placeholder="8자 이상"
                disabled
                style={{ marginBottom: 14 }}
              />
              <div className="label">비밀번호 확인</div>
              <input
                className="input"
                type="password"
                disabled
                style={{ marginBottom: 14 }}
              />
              <div className="label">닉네임</div>
              <input
                className="input"
                placeholder="커뮤니티에서 표시됩니다"
                disabled
                style={{ marginBottom: 14 }}
              />
              <div className="label">활동 지역</div>
              <select className="select" disabled style={{ marginBottom: 18 }}>
                <option>서울 전체</option>
                <option>경기</option>
                <option>인천</option>
              </select>
              <label
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "flex-start",
                  fontSize: 12,
                  color: "var(--ink-mute)",
                  marginBottom: 16,
                }}
              >
                <input type="checkbox" disabled />
                <span>이용약관 및 개인정보처리방침에 동의합니다</span>
              </label>

              {/* 가입하기 버튼 — 인라인 폼은 disabled, 실제 가입은 /signup으로 이동 */}
              <button
                type="button"
                className="btn btn--primary btn--xl"
                onClick={() => router.push("/signup")}
              >
                가입하기
              </button>
            </>
          )}
        </div>
      </div>

      {/* 홈으로 돌아가기 */}
      <div
        style={{
          textAlign: "center",
          marginTop: 16,
          fontSize: 12,
          color: "var(--ink-dim)",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            background: "transparent",
            border: 0,
            color: "var(--ink-dim)",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          ← 홈으로 돌아가기
        </button>
      </div>

      {/* Dev 자동 로그인 — 별도 카드 (NODE_ENV !== production에서만 노출) */}
      {process.env.NODE_ENV !== "production" && (
        <div
          className="card"
          style={{
            marginTop: 16,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <form action={devFormAction}>
            <button
              type="submit"
              disabled={devPending}
              className="btn btn--sm"
              style={{ minWidth: 160 }}
            >
              {devPending ? "..." : "Dev 자동 로그인"}
            </button>
            {devState?.error && (
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--danger)" }}>
                {devState.error}
              </p>
            )}
          </form>
        </div>
      )}

      {/* 로그인 필요 안내 다이얼로그: 매핑된 redirect 경로에 한해 자동 오픈
          전역 컨벤션 준수 — 확인 버튼/backdrop/ESC 3방식 닫힘 (conventions.md 2026-04-19)
          redirect 쿼리는 유지하여 로그인 성공 후 복귀 경로를 보존 */}
      {redirectBanner && (
        <InfoDialog
          open={showRedirectDialog}
          onClose={() => setShowRedirectDialog(false)}
          title={redirectBanner.title}
          description={redirectBanner.desc}
        />
      )}

      {/* OAuth 에러 알림 다이얼로그: ESC/backdrop/확인 3가지 방법으로 닫힘 */}
      <InfoDialog
        open={showOauthErrorDialog}
        onClose={() => {
          // 1) 모달 닫기
          setShowOauthErrorDialog(false);
          // 2) URL에서 error 쿼리 제거 — 새로고침 시 재노출 방지
          //    redirect 등 다른 쿼리는 유지
          const params = new URLSearchParams(searchParams.toString());
          params.delete("error");
          const nextQuery = params.toString();
          router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
        }}
        title="로그인 오류"
        description={
          oauthError && OAUTH_ERRORS[oauthError]
            ? OAUTH_ERRORS[oauthError]
            : "로그인 중 오류가 발생했습니다."
        }
      />
    </div>
  );
}
