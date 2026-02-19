import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// FR-061: 유저 관리
export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      email: true,
      nickname: true,
      membershipType: true,
      isAdmin: true,
      status: true,
      createdAt: true,
    },
  });

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
        <h1 className="text-2xl font-bold">유저 관리</h1>
        <span className="text-sm text-[#A0A0A0]">{users.length}명</span>
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
    </div>
  );
}
