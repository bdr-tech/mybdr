import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

/**
 * /referee/admin 레이아웃 — 서버 컴포넌트.
 *
 * 이유: 관리자 전용 페이지에 접근하기 전에 서버에서 권한을 체크한다.
 *      redirect() 대신 "접근 권한 없음" 화면을 표시한다.
 *      (이 layout은 referee layout 안에 들어가므로 셸은 유지된다.)
 *
 * 체크 순서:
 *   1) 세션 확인 (상위 referee layout에서 이미 리다이렉트하므로 방어용)
 *   2) User.admin_role === "association_admin" 확인
 *   3) AssociationAdmin 매핑 존재 확인
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWebSession();

  // 세션이 없으면 상위 layout에서 이미 redirect됨. 방어 코드.
  if (!session) {
    return <AccessDenied />;
  }

  const userId = BigInt(session.sub);

  // User.admin_role 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { admin_role: true },
  });

  if (!user || user.admin_role !== "association_admin") {
    return <AccessDenied />;
  }

  // AssociationAdmin 매핑 존재 확인
  const adminMapping = await prisma.associationAdmin.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });

  if (!adminMapping) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

// 접근 권한 없음 표시 컴포넌트
function AccessDenied() {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-24 text-center"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
      }}
    >
      <span
        className="material-symbols-outlined text-5xl"
        style={{ color: "var(--color-text-muted)" }}
      >
        lock
      </span>
      <h2
        className="mt-4 text-lg font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        접근 권한이 없습니다
      </h2>
      <p
        className="mt-2 max-w-sm text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        이 페이지는 협회 관리자만 접근할 수 있습니다.
        관리자 권한이 필요하시면 소속 협회에 문의해 주세요.
      </p>
    </div>
  );
}
