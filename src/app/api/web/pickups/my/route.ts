/**
 * GET /api/web/pickups/my — 내가 참가 중인 픽업게임 목록 (인증 필수)
 *
 * 프로필이나 "내 픽업" 섹션에서 사용.
 * 날짜순 정렬, 최근 20건.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const userId = BigInt(session.sub);

  // 내가 참가 중인 픽업게임 (참가자 테이블에서 역으로 조회)
  const participations = await prisma.pickup_participants.findMany({
    where: { user_id: userId },
    orderBy: { pickup_game: { scheduled_date: "desc" } },
    take: 20,
    include: {
      pickup_game: {
        include: {
          court_infos: { select: { id: true, name: true, address: true } },
          host: { select: { nickname: true } },
          _count: { select: { participants: true } },
        },
      },
    },
  });

  const serialized = participations.map((pt) => {
    const g = pt.pickup_game;
    return {
      id: g.id.toString(),
      courtInfoId: g.court_info_id.toString(),
      courtName: g.court_infos.name,
      courtAddress: g.court_infos.address,
      hostNickname: g.host?.nickname ?? "사용자",
      title: g.title,
      scheduledDate: g.scheduled_date.toISOString().split("T")[0],
      startTime: g.start_time,
      endTime: g.end_time,
      maxPlayers: g.max_players,
      currentPlayers: g._count.participants,
      skillLevel: g.skill_level,
      status: g.status,
      joinedAt: pt.joined_at.toISOString(),
    };
  });

  return apiSuccess({ pickups: serialized, total: serialized.length });
}
