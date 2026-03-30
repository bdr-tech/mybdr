import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  createCourtAction,
  updateCourtAction,
  deleteCourtAction,
} from "@/app/actions/admin-courts";
import { AdminCourtsContent } from "./admin-courts-content";

export const dynamic = "force-dynamic";

// 코트 관리 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminCourtsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { address: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [courts, totalCount, pendingSuggestions, pendingAmbassadors] = await Promise.all([
    prisma.court_infos.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        district: true,
        court_type: true,
        status: true,
        is_free: true,
        reviews_count: true,
        created_at: true,
      },
    }),
    prisma.court_infos.count({ where }),
    // 위키 수정 제안 중 대기 중인 것만 조회 (최신순 50건)
    prisma.court_edit_suggestions.findMany({
      where: { status: "pending" },
      orderBy: { created_at: "desc" },
      take: 50,
      include: {
        court_infos: { select: { id: true, name: true } },
        users: { select: { nickname: true } },
      },
    }),
    // 앰배서더 신청 전체 조회 (pending 우선, 최신순)
    prisma.court_ambassadors.findMany({
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      take: 50,
      include: {
        user: { select: { id: true, nickname: true } },
        court_infos: { select: { id: true, name: true, city: true, district: true } },
      },
    }),
  ]);

  // 직렬화
  const serialized = courts.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    address: c.address,
    city: c.city,
    district: c.district,
    courtType: c.court_type,
    status: c.status,
    isFree: c.is_free,
    reviewsCount: c.reviews_count,
    createdAt: c.created_at.toISOString(),
  }));

  // 위키 수정 제안 직렬화
  const serializedSuggestions = pendingSuggestions.map((s) => ({
    id: s.id.toString(),
    courtId: s.court_info_id.toString(),
    courtName: s.court_infos?.name ?? "코트",
    userId: s.user_id.toString(),
    nickname: s.users?.nickname ?? "사용자",
    changes: s.changes as Record<string, { old: unknown; new: unknown }>,
    reason: s.reason,
    status: s.status,
    createdAt: s.created_at.toISOString(),
  }));

  // 앰배서더 직렬화
  const serializedAmbassadors = pendingAmbassadors.map((a) => ({
    id: a.id.toString(),
    userId: a.user_id.toString(),
    nickname: a.user?.nickname ?? "사용자",
    courtId: a.court_info_id.toString(),
    courtName: a.court_infos?.name ?? "코트",
    courtCity: a.court_infos?.city ?? "",
    courtDistrict: a.court_infos?.district ?? null,
    status: a.status,
    appointedAt: a.appointed_at?.toISOString() ?? null,
    revokedAt: a.revoked_at?.toISOString() ?? null,
    createdAt: a.created_at.toISOString(),
  }));

  return (
    <div>
      <AdminPageHeader
        title="코트 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="코트명, 주소 검색"
        searchDefaultValue={q ?? ""}
      />
      <AdminCourtsContent
        courts={serialized}
        pendingSuggestions={serializedSuggestions}
        pendingAmbassadors={serializedAmbassadors}
        createCourtAction={createCourtAction}
        updateCourtAction={updateCourtAction}
        deleteCourtAction={deleteCourtAction}
      />
    </div>
  );
}
