import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { RefereeShell } from "./_components/referee-shell";

/**
 * /referee 루트 레이아웃.
 *
 * 이유: 심판 플랫폼은 로그인 필수. 서버에서 세션을 먼저 체크하고 없으면
 *      /login?redirect=/referee 로 돌려보낸다. 자식 페이지들은 세션 존재를
 *      가정할 수 있으므로 클라이언트 가드 로직이 필요 없다.
 *
 * 독립 셸(RefereeShell)은 클라이언트 컴포넌트이지만 이 layout 자체는 서버
 * 컴포넌트로 유지해야 getWebSession이 동작한다.
 */
export default async function RefereeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWebSession();
  // 세션 없음 → 심판 전용 로그인 페이지로 리다이렉트 (복귀 경로 파라미터 포함)
  // 이유: 심판 플랫폼은 자체 브랜딩을 가진 전용 로그인 입구(/referee/login)를 사용한다.
  //      (referee-public) 라우트 그룹의 페이지는 이 가드 바깥이라 리다이렉트 무한루프 없음.
  if (!session) {
    redirect(`/referee/login?redirect=${encodeURIComponent("/referee")}`);
  }

  return <RefereeShell>{children}</RefereeShell>;
}
