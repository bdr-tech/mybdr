import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

// FR-061: 유저 관리
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageStr, q } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { nickname: { contains: q, mode: "insensitive" as const } }] }
    : undefined;

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

  const roleBadge = (type: number) => {
    const map: Record<number, { label: string; variant: "default" | "success" | "error" | "info" }> = {
      0: { label: "free", variant: "success" },
      1: { label: "pro", variant: "info" },
      2: { label: "host", variant: "default" },
      3: { label: "admin", variant: "default" },
      4: { label: "super", variant: "error" },
    };
    return map[type] ?? { label: String(type), variant: "success" as const };
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">유저 관리</h1>
          <p className="mt-1 text-sm text-[#A0A0A0]">
            전체 <span className="font-semibold text-white">{totalCount.toLocaleString()}명</span>
            {totalCount > 0 && <span className="ml-1">· {from}–{to}번째</span>}
          </p>
        </div>
        {/* 검색 */}
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="닉네임/이메일 검색"
            className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-[#F4A261]"
          />
          <button type="submit" className="rounded-full bg-[#F4A261] px-4 py-2 text-sm font-semibold text-[#0A0A0A]">검색</button>
        </form>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#2A2A2A] text-[#A0A0A0]">
              <tr>
                <th className="px-5 py-4 font-medium">닉네임</th>
                <th className="px-5 py-4 font-medium">이메일</th>
                <th className="px-5 py-4 font-medium">역할</th>
                <th className="px-5 py-4 font-medium">상태</th>
                <th className="px-5 py-4 font-medium">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const role = roleBadge(user.membershipType);
                const isActive = user.status === "active";
                return (
                  <tr
                    key={user.id.toString()}
                    className="border-b border-[#1F1F1F] hover:bg-[#252525] transition-colors"
                  >
                    <td className="px-5 py-4 font-medium">{user.nickname ?? "-"}</td>
                    <td className="px-5 py-4 text-[#A0A0A0]">{user.email}</td>
                    <td className="px-5 py-4">
                      <Badge variant={role.variant}>{role.label}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={isActive ? "success" : "error"}>
                        {isActive ? "활성" : "정지"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-[#666666]">
                      {user.createdAt.toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
              className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-[#A0A0A0] hover:bg-[#252525]"
            >
              이전
            </Link>
          )}
          <span className="text-sm text-[#666666]">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
              className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-[#A0A0A0] hover:bg-[#252525]"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
