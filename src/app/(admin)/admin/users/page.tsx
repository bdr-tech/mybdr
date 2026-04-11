import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { updateUserRoleAction, updateUserStatusAction, toggleUserAdminAction, forceWithdrawUserAction, deleteUserAction } from "@/app/actions/admin-users";
import { AdminUsersTable } from "./admin-users-table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; error?: string }>;
}) {
  const { page: pageStr, q, error } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { nickname: { contains: q, mode: "insensitive" as const } }] }
    : undefined;

  const superAdminCount = await prisma.user.count({ where: { isAdmin: true } });

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ membershipType: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip,
      select: {
        id: true,
        email: true,
        nickname: true,
        name: true,
        phone: true,
        membershipType: true,
        isAdmin: true,
        status: true,
        provider: true,
        uid: true,
        city: true,
        district: true,
        position: true,
        height: true,
        weight: true,
        bio: true,
        birth_date: true,
        profile_image_url: true,
        evaluation_rating: true,
        total_games_hosted: true,
        total_games_participated: true,
        last_login_at: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const from = skip + 1;
  const to = Math.min(skip + users.length, totalCount);

  // BigInt, Date, Decimal을 직렬화 가능한 형태로 변환
  const serializedUsers = users.map((u) => ({
    ...u,
    id: u.id.toString(),
    evaluation_rating: u.evaluation_rating ? Number(u.evaluation_rating) : null,
    birth_date: u.birth_date?.toISOString() ?? null,
    last_login_at: u.last_login_at?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">유저 관리</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            전체 <span className="font-semibold text-[var(--color-text-primary)]">{totalCount.toLocaleString()}명</span>
            {totalCount > 0 && <span className="ml-1">· {from}–{to}번째</span>}
            <span className="ml-2 rounded-full bg-[var(--color-error)]/10 px-2 py-0.5 text-xs text-[var(--color-error)]">
              슈퍼관리자 {superAdminCount}/4
            </span>
          </p>
        </div>
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="닉네임/이메일 검색"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
          />
          {/* accent 배경은 테마 반응형이므로 글씨 색상도 on-accent 변수로 자동 전환 */}
          <button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold" style={{ color: "var(--color-on-accent)" }}>검색</button>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">{error}</div>
      )}

      <AdminUsersTable
        users={serializedUsers}
        updateUserRoleAction={updateUserRoleAction}
        updateUserStatusAction={updateUserStatusAction}
        toggleUserAdminAction={toggleUserAdminAction}
        forceWithdrawAction={forceWithdrawUserAction}
        deleteAction={deleteUserAction}
      />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]"
            >
              이전
            </Link>
          )}
          <span className="text-sm text-[var(--color-text-muted)]">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
