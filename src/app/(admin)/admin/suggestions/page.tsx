import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// 건의사항 상태 한글 매핑 (DB에는 영어로 저장, UI에서 한글로 표시)
const SUGGESTION_STATUS_LABEL: Record<string, string> = {
  open: "접수됨",
  in_progress: "처리중",
  resolved: "완료",
};

export default async function AdminSuggestionsPage() {
  const suggestions = await prisma.suggestions.findMany({
    orderBy: { created_at: "desc" },
    take: 30,
  }).catch(() => []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>건의사항</h1>
      <div className="space-y-3">
        {suggestions.map((s) => (
          <Card key={s.id.toString()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{s.title}</h3>
              <Badge>{SUGGESTION_STATUS_LABEL[s.status ?? "open"] ?? (s.status ?? "접수됨")}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{s.content}</p>
          </Card>
        ))}
        {suggestions.length === 0 && <Card className="text-center py-12 text-[var(--color-text-muted)]">건의사항이 없습니다.</Card>}
      </div>
    </div>
  );
}
