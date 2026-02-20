import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "./comment-form";

export const revalidate = 30;

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.community_posts.findUnique({
    where: { id: BigInt(id) },
    include: {
      users: { select: { nickname: true } },
    },
  }).catch(() => null);
  if (!post) return notFound();

  const comments = await prisma.comments.findMany({
    where: { commentable_type: "CommunityPost", commentable_id: post.id },
    orderBy: { created_at: "asc" },
    include: { users: { select: { nickname: true } } },
  }).catch(() => []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-3 flex items-center gap-2">
          {post.category && <Badge>{post.category}</Badge>}
          <h1 className="text-xl font-bold">{post.title}</h1>
        </div>
        <div className="mb-4 flex items-center gap-3 text-xs text-[#666666]">
          <span>{post.users?.nickname ?? "익명"}</span>
          <span>{post.created_at.toLocaleString("ko-KR")}</span>
          <span>조회 {post.view_count ?? 0}</span>
        </div>
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[#A0A0A0]">
          {post.content}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">댓글 {comments.length}개</h2>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id.toString()} className="rounded-[12px] bg-[#252525] p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-[#666666]">
                <span className="font-medium text-white">{c.users?.nickname ?? "익명"}</span>
                <span>{c.created_at.toLocaleString("ko-KR")}</span>
              </div>
              <p className="text-sm text-[#A0A0A0]">{c.content}</p>
            </div>
          ))}
        </div>
        <CommentForm postId={id} />
      </Card>
    </div>
  );
}
