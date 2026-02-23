import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await prisma.admin_logs.findMany({
    orderBy: { created_at: "desc" },
    take: 50,
  }).catch(() => []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">활동 로그</h1>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E8ECF0] text-[#6B7280]">
              <tr>
                <th className="px-5 py-3 font-medium">액션</th>
                <th className="px-5 py-3 font-medium">대상</th>
                <th className="px-5 py-3 font-medium">일시</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id.toString()} className="border-b border-[#F1F5F9]">
                  <td className="px-5 py-3">{l.action}</td>
                  <td className="px-5 py-3 text-[#6B7280]">{l.resource_type}</td>
                  <td className="px-5 py-3 text-[#9CA3AF]">{l.created_at.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && <div className="p-6 text-center text-[#6B7280]">활동 로그가 없습니다.</div>}
      </Card>
    </div>
  );
}
