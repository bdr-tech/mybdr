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
            <thead className="border-b border-[#2A2A2A] text-[#A0A0A0]">
              <tr>
                <th className="px-5 py-3 font-medium">액션</th>
                <th className="px-5 py-3 font-medium">대상</th>
                <th className="px-5 py-3 font-medium">일시</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id.toString()} className="border-b border-[#1F1F1F]">
                  <td className="px-5 py-3">{l.action}</td>
                  <td className="px-5 py-3 text-[#A0A0A0]">{l.resource_type}</td>
                  <td className="px-5 py-3 text-[#666666]">{l.created_at.toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && <div className="p-6 text-center text-[#A0A0A0]">활동 로그가 없습니다.</div>}
      </Card>
    </div>
  );
}
