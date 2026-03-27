import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateSuggestionStatusAction } from "@/app/actions/admin-suggestions";

export const dynamic = "force-dynamic";

// 건의사항 상태 한글 매핑 (DB에는 영어로 저장, UI에서 한글로 표시)
const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  open: "접수됨",
  in_progress: "처리중",
  resolved: "완료",
};

// 상태별 뱃지 색상 (Badge variant와 매핑)
const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "error"> = {
  pending: "default",
  open: "warning",
  in_progress: "warning",
  resolved: "success",
};

// 상태 전환 가능 목록 (현재 상태 -> 다음 가능한 상태들)
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["open", "in_progress", "resolved"],
  open: ["in_progress", "resolved"],
  in_progress: ["resolved"],
  resolved: [],
};

export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // 검색어가 있으면 제목/내용에서 검색
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
        // 작성자 정보도 함께 조회
        include: {
          users_suggestions_user_idTousers: {
            select: { nickname: true, email: true },
          },
        },
      })
      .catch(() => []),
    prisma.suggestions.count({ where }).catch(() => 0),
  ]);

  return (
    <div>
      {/* 공통 헤더: 제목 + 건수 + 검색 */}
      <AdminPageHeader
        title="건의사항"
        subtitle={`전체 ${totalCount}건`}
        searchPlaceholder="제목/내용 검색"
        searchDefaultValue={q ?? ""}
      />

      {/* 테이블 형태로 표시 (카드 나열에서 변경) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col />
              <col className="w-[110px]" />
              <col className="w-[200px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">제목 / 내용</th>
                <th className="px-5 py-4 font-medium">작성자</th>
                <th className="px-5 py-4 font-medium">상태</th>
                <th className="px-5 py-4 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => {
                const status = s.status ?? "pending";
                const author = s.users_suggestions_user_idTousers;
                const transitions = STATUS_TRANSITIONS[status] ?? [];

                return (
                  <tr
                    key={s.id.toString()}
                    className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-elevated)] transition-colors"
                  >
                    {/* 제목 + 내용 미리보기 */}
                    <td className="px-5 py-3">
                      <p className="truncate font-medium">{s.title}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                        {s.content}
                      </p>
                    </td>

                    {/* 작성자 */}
                    <td className="px-5 py-3 truncate text-[var(--color-text-muted)]">
                      {author?.nickname ?? author?.email ?? "-"}
                    </td>

                    {/* 상태 뱃지 + 상태 변경 드롭다운 */}
                    <td className="px-5 py-3">
                      <form
                        action={updateSuggestionStatusAction}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="suggestion_id" value={s.id.toString()} />
                        <Badge variant={STATUS_BADGE[status]}>
                          {STATUS_LABEL[status] ?? status}
                        </Badge>
                        {transitions.length > 0 && (
                          <>
                            <select
                              name="status"
                              defaultValue=""
                              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                            >
                              <option value="" disabled>
                                변경
                              </option>
                              {transitions.map((st) => (
                                <option key={st} value={st}>
                                  {STATUS_LABEL[st] ?? st}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="rounded-[10px] bg-[var(--color-accent)] px-2 py-1 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)]"
                            >
                              적용
                            </button>
                          </>
                        )}
                      </form>
                    </td>

                    {/* 날짜 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {s.created_at.toLocaleDateString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {suggestions.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            건의사항이 없습니다.
          </div>
        )}
      </Card>
    </div>
  );
}
