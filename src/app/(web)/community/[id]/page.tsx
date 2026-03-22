import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "./comment-form";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.community_posts.findUnique({
    where: { public_id: id },
    select: { title: true, content: true },
  }).catch(() => null);

  if (!post) return {};

  const description = post.content?.slice(0, 120) ?? "";
  return {
    title: `${post.title} - BDR 커뮤니티`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: [{ url: "/images/logo.png", width: 600, height: 600, alt: "BDR" }],
    },
  };
}

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.community_posts.findUnique({
    where: { public_id: id },
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
          <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{post.title}</h1>
        </div>
        <div className="mb-4 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span>{post.users?.nickname ?? "익명"}</span>
          <span>{post.created_at.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span>
          <span>조회 {post.view_count ?? 0}</span>
        </div>
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[var(--color-text-muted)]">
          {post.content}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>댓글 {comments.length}개</h2>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id.toString()} className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-text-primary)]">{c.users?.nickname ?? "익명"}</span>
                <span>{c.created_at.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">{c.content}</p>
            </div>
          ))}
        </div>
        <CommentForm postId={id} />
      </Card>
    </div>
  );
}
