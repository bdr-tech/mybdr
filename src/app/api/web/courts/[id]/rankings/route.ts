/**
 * GET /api/web/courts/[id]/rankings
 *
 * 코트별 체크인 랭킹 TOP 10 (공개 API)
 * court_sessions를 user_id로 GROUP BY → COUNT → 상위 10명
 * User join으로 닉네임 + 레벨 포함
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getLevelInfo } from "@/lib/services/gamification";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  { params }: RouteCtx
) {
  const { id } = await params;
  const courtId = BigInt(id);

  // 코트 존재 확인
  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
    select: { id: true, name: true },
  });
  if (!court) {
    return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");
  }

  // 체크아웃 완료된 세션을 user_id별로 GROUP BY → COUNT
  const grouped = await prisma.court_sessions.groupBy({
    by: ["user_id"],
    where: {
      court_id: courtId,
      checked_out_at: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // 유저 정보 조회 (닉네임 + XP/레벨)
  const userIds = grouped.map((g) => g.user_id);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      nickname: true,
      profile_image_url: true,
      xp: true,
    },
  });
  const userMap = new Map(users.map((u) => [u.id.toString(), u]));

  // 랭킹 데이터 조합
  const rankings = grouped.map((g, index) => {
    const user = userMap.get(g.user_id.toString());
    const levelInfo = getLevelInfo(user?.xp ?? 0);
    return {
      rank: index + 1,
      userId: g.user_id.toString(),
      nickname: user?.nickname ?? "사용자",
      profileImage: user?.profile_image_url ?? null,
      checkinCount: g._count.id,
      level: levelInfo.level,
      title: levelInfo.title,
      emoji: levelInfo.emoji,
    };
  });

  return apiSuccess({
    courtName: court.name,
    rankings,
  });
}
