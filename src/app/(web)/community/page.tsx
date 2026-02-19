import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

const categoryMap: Record<string, { label: string; variant: "default" | "success" | "info" | "warning" }> = {
  general: { label: "자유", variant: "default" },
  info: { label: "정보", variant: "info" },
  review: { label: "후기", variant: "success" },
  marketplace: { label: "장터", variant: "warning" },
};

export default async function CommunityPage() {
  const posts = await prisma.community_posts.findMany({
    orderBy: { created_at: "desc" },
    take: 30,
    include: { users: { select: { nickname: true } } },
  }).catch(() => []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <Link href="/community/new" className="rounded-full bg-[#F4A261] px-4 py-2 text-sm font-semibold text-[#0A0A0A]">글쓰기</Link>
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Link href="/community" className="rounded-full bg-[rgba(244,162,97,0.12)] px-4 py-2 text-sm font-medium text-[#F4A261]">전체</Link>
        {Object.entries(categoryMap).map(([key, val]) => (
          <Link key={key} href={`/community?category=${key}`} className="whitespace-nowrap rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-[#A0A0A0] hover:text-white">{val.label}</Link>
        ))}
      </div>

      <div className="space-y-3">
        {posts.map((p) => {
          const cat = categoryMap[p.category ?? ""] ?? { label: p.category ?? "기타", variant: "default" as const };
          return (
            <Link key={p.id.toString()} href={`/community/${p.id}`}>
              <Card className="hover:bg-[#252525] transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Badge variant={cat.variant}>{cat.label}</Badge>
                  <h3 className="font-semibold">{p.title}</h3>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-[#666666]">
                  <span>{p.users?.nickname ?? "익명"}</span>
                  <span>{p.created_at.toLocaleDateString("ko-KR")}</span>
                  <span>조회 {p.view_count ?? 0}</span>
                  <span>댓글 {p.comments_count ?? 0}</span>
                </div>
              </Card>
            </Link>
          );
        })}
        {posts.length === 0 && <Card className="text-center text-[#A0A0A0] py-12">게시글이 없습니다.</Card>}
      </div>
    </div>
  );
}
