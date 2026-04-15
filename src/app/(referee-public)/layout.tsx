/**
 * (referee-public) 라우트 그룹 레이아웃.
 *
 * 이유: 심판 플랫폼 로그인/가입 페이지는 인증 가드가 필요 없다.
 *      (referee)/referee/layout.tsx 의 세션 체크를 우회하기 위해 별도 그룹으로 분리.
 *
 * URL 영향 없음: Next.js 라우트 그룹 `(referee-public)` 은 URL 경로에 포함되지 않으므로
 *               `/referee/login`, `/referee/signup` 으로 정상 접근된다.
 *
 * 루트 layout.tsx 가 이미 <html>/<body>/폰트/글로벌 스타일을 담당하므로
 * 여기서는 단순 pass-through 만 수행한다.
 */
export default function RefereePublicGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
