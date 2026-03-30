import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { hidePostAction, unhidePostAction, deletePostAction } from "@/app/actions/admin-community";
import { AdminCommunityContent } from "./admin-community-content";

export const dynamic = "force-dynamic";

// 커뮤니티 관리 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { users: { nickname: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  const [posts, totalCount] = await Promise.all([
    prisma.community_posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        public_id: true,
        title: true,
        category: true,
        view_count: true,
        comments_count: true,
        likes_count: true,
        status: true,
        created_at: true,
        users: { select: { nickname: true, email: true } },
      },
    }),
    prisma.community_posts.count({ where }),
  ]);

  // 직렬화
  const serialized = posts.map((p) => ({
    id: String(p.id),
    publicId: p.public_id,
    title: p.title,
    category: p.category,
    viewCount: p.view_count ?? 0,
    commentsCount: p.comments_count,
    likesCount: p.likes_count,
    status: p.status,
    createdAt: p.created_at.toISOString(),
    authorName: p.users?.nickname ?? null,
    authorEmail: p.users?.email ?? null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="커뮤니티 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="제목, 작성자 검색"
        searchDefaultValue={q ?? ""}
      />
      <AdminCommunityContent
        posts={serialized}
        hidePostAction={hidePostAction}
        unhidePostAction={unhidePostAction}
        deletePostAction={deletePostAction}
      />
    </div>
  );
}
