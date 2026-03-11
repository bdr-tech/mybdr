import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { updateUserRoleAction, updateUserStatusAction, toggleUserAdminAction } from "@/app/actions/admin-users";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ROLE_MAP: Record<number, { label: string; variant: "default" | "success" | "error" | "info" | "warning" }> = {
  0: { label: "일반유저", variant: "default" },
  1: { label: "픽업호스트", variant: "info" },
  2: { label: "팀장", variant: "warning" },
  3: { label: "대회관리자", variant: "info" },
};

// FR-061: 유저 관리
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
        membershipType: true,
        isAdmin: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const from = skip + 1;
  const to = Math.min(skip + users.length, totalCount);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">유저 관리</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            전체 <span className="font-semibold text-[#111827]">{totalCount.toLocaleString()}명</span>
            {totalCount > 0 && <span className="ml-1">· {from}–{to}번째</span>}
            <span className="ml-2 rounded-full bg-[rgba(239,68,68,0.1)] px-2 py-0.5 text-xs text-[#EF4444]">
              슈퍼관리자 {superAdminCount}/4
            </span>
          </p>
        </div>
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="닉네임/이메일 검색"
            className="rounded-full border border-[#E8ECF0] bg-[#FFFFFF] px-4 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#0066FF]"
          />
          <button type="submit" className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white">검색</button>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#EF4444]">{error}</div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-max text-left text-sm">
            <thead className="border-b border-[#E8ECF0] bg-[#F5F7FA] text-[#6B7280]">
              <tr>
                <th className="whitespace-nowrap px-5 py-4 font-medium">닉네임</th>
                <th className="whitespace-nowrap px-5 py-4 font-medium">이메일</th>
                <th className="whitespace-nowrap px-5 py-4 font-medium">역할 변경</th>
                <th className="whitespace-nowrap px-5 py-4 font-medium">슈퍼관리자</th>
                <th className="whitespace-nowrap px-5 py-4 font-medium">상태</th>
                <th className="whitespace-nowrap px-5 py-4 font-medium">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const role = ROLE_MAP[user.membershipType] ?? { label: String(user.membershipType), variant: "default" as const };
                const isActive = user.status === "active";
                return (
                  <tr
                    key={user.id.toString()}
                    className={`border-b border-[#F1F5F9] transition-colors hover:bg-[#EEF2FF] ${user.isAdmin ? "bg-[rgba(239,68,68,0.02)]" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-medium">
                      {user.isAdmin && <span className="mr-1 text-[#EF4444]">★</span>}
                      {user.nickname ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[#6B7280]">{user.email}</td>

                    {/* 역할 변경 */}
                    <td className="whitespace-nowrap px-5 py-3">
                      <form action={updateUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="user_id" value={user.id.toString()} />
                        <Badge variant={role.variant}>{role.label}</Badge>
                        <select
                          name="membership_type"
                          defaultValue={user.membershipType}
                          className="rounded-full border border-[#E8ECF0] bg-[#FFFFFF] px-3 py-1 text-xs text-[#374151] outline-none focus:border-[#0066FF]"
                        >
                          <option value={0}>일반유저</option>
                          <option value={1}>픽업호스트</option>
                          <option value={2}>팀장</option>
                          <option value={3}>대회관리자</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-full bg-[#0066FF] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0052CC]"
                        >
                          변경
                        </button>
                      </form>
                    </td>

                    {/* 슈퍼관리자 토글 */}
                    <td className="whitespace-nowrap px-5 py-3">
                      <form action={toggleUserAdminAction}>
                        <input type="hidden" name="user_id" value={user.id.toString()} />
                        <input type="hidden" name="make_admin" value={user.isAdmin ? "false" : "true"} />
                        <button
                          type="submit"
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.isAdmin
                              ? "bg-[rgba(239,68,68,0.1)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)]"
                              : "bg-[#EEF2FF] text-[#6B7280] hover:text-[#111827]"
                          }`}
                        >
                          {user.isAdmin ? "해제" : "지정"}
                        </button>
                      </form>
                    </td>

                    {/* 상태 변경 */}
                    <td className="whitespace-nowrap px-5 py-3">
                      <form action={updateUserStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="user_id" value={user.id.toString()} />
                        <input type="hidden" name="status" value={isActive ? "suspended" : "active"} />
                        <Badge variant={isActive ? "success" : "error"}>
                          {isActive ? "활성" : "정지"}
                        </Badge>
                        <button
                          type="submit"
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive
                              ? "bg-[rgba(239,68,68,0.1)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)]"
                              : "bg-[rgba(0,102,255,0.1)] text-[#0066FF] hover:bg-[rgba(0,102,255,0.2)]"
                          }`}
                        >
                          {isActive ? "정지" : "활성화"}
                        </button>
                      </form>
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-[#9CA3AF]">
                      {user.createdAt.toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
              className="rounded-full border border-[#E8ECF0] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EEF2FF]"
            >
              이전
            </Link>
          )}
          <span className="text-sm text-[#9CA3AF]">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
              className="rounded-full border border-[#E8ECF0] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EEF2FF]"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
