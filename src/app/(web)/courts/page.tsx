import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const revalidate = 300; // 5분 캐시 (코트 정보는 자주 바뀌지 않음)

export default async function CourtsPage() {
  const courts = await prisma.court_infos.findMany({
    orderBy: { created_at: "desc" },
    take: 30,
  }).catch(() => []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>코트 찾기</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {courts.map((c) => (
          <Link key={c.id.toString()} href={`/courts/${c.id}`}>
            <Card className="hover:bg-[var(--color-surface-bright)] transition-colors h-full">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{c.address}</p>
              <div className="mt-2 flex gap-2 text-xs text-[var(--color-text-secondary)]">
                {c.court_type === "indoor" && <span className="rounded-[10px] bg-[var(--color-surface-bright)] px-2 py-0.5">실내</span>}
                {c.is_free && <span className="rounded-[10px] bg-[rgba(16,185,129,0.15)] px-2 py-0.5 text-[var(--color-success)]">무료</span>}
                {c.hoops_count && <span>골대 {c.hoops_count}개</span>}
                {c.average_rating && Number(c.average_rating) > 0 && (
                  <span className="ml-auto font-semibold text-[var(--color-primary)]">{Number(c.average_rating).toFixed(1)}</span>
                )}
              </div>
            </Card>
          </Link>
        ))}
        {courts.length === 0 && (
          <Card className="col-span-full text-center text-[var(--color-text-muted)]">등록된 코트가 없습니다.</Card>
        )}
      </div>
    </div>
  );
}
