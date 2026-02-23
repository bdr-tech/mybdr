import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminSuggestionsPage() {
  const suggestions = await prisma.suggestions.findMany({
    orderBy: { created_at: "desc" },
    take: 30,
  }).catch(() => []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">건의사항</h1>
      <div className="space-y-3">
        {suggestions.map((s) => (
          <Card key={s.id.toString()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{s.title}</h3>
              <Badge>{s.status ?? "open"}</Badge>
            </div>
            <p className="mt-1 text-sm text-[#6B7280]">{s.content}</p>
          </Card>
        ))}
        {suggestions.length === 0 && <Card className="text-center py-12 text-[#6B7280]">건의사항이 없습니다.</Card>}
      </div>
    </div>
  );
}
