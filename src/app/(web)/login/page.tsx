"use client";

import { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { loginAction, devLoginAction } from "@/app/actions/auth";
import { InfoDialog } from "@/components/ui/info-dialog";

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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, null);
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

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (showEmailModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showEmailModal]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 -mt-8">
      <div className="mb-4 text-center">
        <Image src="/images/logo.png" alt="BDR" width={208} height={104} className="mx-auto mb-2 w-52 h-auto" />
        {/* 브랜드 타이틀: 메인 텍스트 색상 */}
        <p className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-primary)' }}>
          새로운 BDR의 시작
        </p>
        {/* 브랜드 서브타이틀: BDR 이니셜 웜 오렌지 accent */}
        <p className="mt-1 text-base tracking-[0.12em] font-semibold uppercase" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-secondary)' }}>
          My <span className="font-bold" style={{ color: 'var(--color-accent)' }}>B</span>asketball <span className="font-bold" style={{ color: 'var(--color-accent)' }}>D</span>aily <span className="font-bold" style={{ color: 'var(--color-accent)' }}>R</span>outine
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* 로그인 필요 안내는 InfoDialog(플로팅)로 노출 — 인라인 배너 제거
            전역 컨벤션: 확인 버튼/backdrop/ESC 3방식 닫힘 (conventions.md 2026-04-19) */}
        {/* OAuth 에러도 InfoDialog(플로팅)로 노출 — 인라인 배너 제거 */}

        {/* 간편 로그인 카드: CSS 변수 */}
        <div className="rounded-[20px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-card)' }}>
          <p className="mb-4 text-center text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>간편 로그인</p>
          <div className="flex flex-col gap-2.5">
            {/* 카카오: 고유 브랜드 색상 유지 */}
            <a
              href={`/api/auth/login?provider=kakao${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 1C4.58 1 1 3.8 1 7.2c0 2.2 1.46 4.13 3.66 5.23l-.93 3.42c-.08.3.26.54.52.36L8.1 13.6c.3.03.6.05.9.05 4.42 0 8-2.8 8-6.25S13.42 1 9 1" fill="#191919"/></svg>
              <span className="whitespace-nowrap text-sm font-semibold">카카오로 시작하기</span>
            </a>
            {/* 네이버: 준비 중 (비활성화) */}
            <div
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] opacity-40 cursor-not-allowed"
              style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10.85 8.55L4.92 0H0v16h5.15V7.45L11.08 16H16V0h-5.15v8.55z" fill="white"/></svg>
              <span className="whitespace-nowrap text-sm font-semibold">네이버 (준비 중)</span>
            </div>
            {/* 구글: 테두리/배경 CSS 변수 */}
            <a
              href={`/api/auth/login?provider=google${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border transition-colors"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              <span className="whitespace-nowrap text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Google로 시작하기</span>
            </a>

            {/* 이메일 로그인 버튼: primary 색상 */}
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
              <span className="whitespace-nowrap text-sm font-semibold">이메일 로그인</span>
            </button>
          </div>

          {/* 회원가입 / 아이디, 비밀번호 찾기 */}
          <div className="mt-4 flex items-center justify-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <Link href="/signup" className="transition-colors font-medium" style={{ color: 'var(--color-text-secondary)' }}>회원가입</Link>
            <span style={{ color: 'var(--color-text-muted)' }}>|</span>
            <Link href="/forgot-password" className="transition-colors font-medium" style={{ color: 'var(--color-text-secondary)' }}>비밀번호 찾기</Link>
          </div>
        </div>

        {/* Dev 로그인 */}
        {process.env.NODE_ENV !== "production" && (
          <form action={devFormAction} className="text-center">
            <button type="submit" disabled={devPending}
              className="text-sm underline disabled:opacity-50" style={{ color: 'var(--color-text-muted)' }}>
              {devPending ? "..." : "Dev 자동 로그인"}
            </button>
            {devState?.error && <p className="mt-1 text-sm text-[var(--color-error)]">{devState.error}</p>}
          </form>
        )}

        <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
          가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.
        </p>
      </div>

      {/* 이메일 로그인 플로팅 모달 */}
      {showEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEmailModal(false); }}
        >
          {/* 모달 카드: CSS 변수 */}
          <div className="w-full max-w-sm rounded-t-[24px] sm:rounded-[24px] p-6 animate-slide-up sm:animate-fade-in" style={{ backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-elevated)' }}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>이메일 로그인</h2>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 에러 메시지 */}
            {loginState?.error && (
              <div className="mb-3 rounded-[10px] bg-[var(--color-error-light)] px-3 py-2 text-sm text-[var(--color-error)]">{loginState.error}</div>
            )}

            {/* 로그인 폼: 입력 필드 테두리/배경 CSS 변수 */}
            <form action={loginFormAction} className="space-y-3">
              {/* 로그인 성공 후 복귀할 경로를 hidden input으로 전달 */}
              {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
              <input name="email" type="email" required placeholder="이메일"
                className="w-full rounded-[12px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-text-primary)' }} />
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} required placeholder="비밀번호"
                  className="w-full rounded-[12px] border px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-text-primary)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {/* 로그인 제출 버튼: primary 색상 */}
              <button type="submit" disabled={loginPending}
                className="w-full rounded-[12px] py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {loginPending ? "로그인 중..." : "로그인"}
              </button>
            </form>

            {/* 회원가입 / 아이디, 비밀번호 찾기 */}
            <div className="mt-4 flex items-center justify-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Link href="/signup" className="transition-colors font-medium" onClick={() => setShowEmailModal(false)}>회원가입</Link>
              <span style={{ color: 'var(--color-text-muted)' }}>|</span>
              <Link href="/forgot-password" className="transition-colors font-medium" onClick={() => setShowEmailModal(false)}>비밀번호 찾기</Link>
            </div>
          </div>
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

      {/* 모달 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
