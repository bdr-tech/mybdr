/**
 * (referee) 라우트 그룹 레이아웃.
 *
 * 이유: 루트 layout.tsx에서 이미 <html>/<body>를 담당하므로 여기선 단순 pass-through.
 * 실제 심판 플랫폼 셸(헤더/사이드바)은 /referee 경로의 하위 layout에서 처리한다.
 */
export default function RefereeGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
