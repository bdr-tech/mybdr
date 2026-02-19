import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CourtsPage() {
  const courts = await prisma.court_infos.findMany({
    orderBy: { created_at: "desc" },
    take: 30,
  }).catch(() => []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">코트 찾기</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {courts.map((c) => (
          <Card key={c.id.toString()} className="hover:bg-[#252525] transition-colors">
            <h3 className="font-semibold">{c.name}</h3>
            <p className="mt-1 text-sm text-[#A0A0A0]">{c.address}</p>
            <div className="mt-2 flex gap-2 text-xs text-[#666666]">
              {c.court_type === "indoor" && <span className="rounded-full bg-[#252525] px-2 py-0.5">실내</span>}
              {c.is_free && <span className="rounded-full bg-[rgba(74,222,128,0.2)] px-2 py-0.5 text-[#4ADE80]">무료</span>}
              {c.hoops_count && <span>골대 {c.hoops_count}개</span>}
            </div>
          </Card>
        ))}
        {courts.length === 0 && (
          <Card className="col-span-full text-center text-[#A0A0A0]">등록된 코트가 없습니다.</Card>
        )}
      </div>
    </div>
  );
}
