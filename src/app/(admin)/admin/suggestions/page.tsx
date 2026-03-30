import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateSuggestionStatusAction } from "@/app/actions/admin-suggestions";
import { AdminSuggestionsContent } from "./admin-suggestions-content";

export const dynamic = "force-dynamic";

// 건의사항 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { content: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [suggestions, totalCount] = await Promise.all([
    prisma.suggestions
      .findMany({
        where,
        orderBy: { created_at: "desc" },
        take: 50,
        include: {
          users_suggestions_user_idTousers: {
            select: { nickname: true, email: true },
          },
        },
      })
      .catch(() => []),
    prisma.suggestions.count({ where }).catch(() => 0),
  ]);

  // 직렬화
  const serialized = suggestions.map((s) => ({
    id: s.id.toString(),
    title: s.title,
    content: s.content,
    status: s.status ?? "pending",
    createdAt: s.created_at.toISOString(),
    authorName: s.users_suggestions_user_idTousers?.nickname ?? null,
    authorEmail: s.users_suggestions_user_idTousers?.email ?? null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="건의사항"
        subtitle={`전체 ${totalCount}건`}
        searchPlaceholder="제목/내용 검색"
        searchDefaultValue={q ?? ""}
      />
      <AdminSuggestionsContent
        suggestions={serialized}
        updateStatusAction={updateSuggestionStatusAction}
      />
    </div>
  );
}
