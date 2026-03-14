import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

// 인증 없는 공개 엔드포인트 — 현재 진행 중인 경기 목록
// NOTE: 모든 필드는 camelCase로 빌드 — apiSuccess()가 자동으로 snake_case 변환
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 공개 엔드포인트 — IP 기반 rate limiting (30req/min)
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`live:${ip}`, RATE_LIMITS.subdomain);
  if (!rl.allowed) {
    return apiError("Too many requests", 429);
  }

  try {
    const matches = await prisma.tournamentMatch.findMany({
      where: {
        status: { in: ["live", "in_progress"] },
      },
      orderBy: { started_at: "desc" },
      include: {
        homeTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
          },
        },
        awayTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
          },
        },
        tournament: {
          select: { name: true, id: true },
        },
      },
    });

    // 최근 종료된 경기도 표시 (30분 이내)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentCompleted = await prisma.tournamentMatch.findMany({
      where: {
        status: "completed",
        ended_at: { gte: thirtyMinAgo },
      },
      orderBy: { ended_at: "desc" },
      take: 10,
      include: {
        homeTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
          },
        },
        awayTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
          },
        },
        tournament: {
          select: { name: true, id: true },
        },
      },
    });

    const formatMatch = (m: typeof matches[number]) => ({
      id: Number(m.id),
      status: m.status ?? "scheduled",
      homeScore: m.homeScore ?? 0,
      awayScore: m.awayScore ?? 0,
      roundName: m.roundName,
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
      startedAt: m.started_at?.toISOString() ?? null,
      endedAt: m.ended_at?.toISOString() ?? null,
      tournamentName: m.tournament?.name ?? "",
      tournamentId: m.tournament?.id ?? "",
      homeTeam: {
        name: m.homeTeam?.team?.name ?? "홈",
        color: m.homeTeam?.team?.primaryColor ?? "#F97316",
      },
      awayTeam: {
        name: m.awayTeam?.team?.name ?? "원정",
        color: m.awayTeam?.team?.primaryColor ?? "#10B981",
      },
    });

    return apiSuccess({
      live: matches.map(formatMatch),
      recentCompleted: recentCompleted.map(formatMatch),
    });
  } catch (err) {
    console.error("[live] error:", err);
    return apiSuccess({ live: [], recentCompleted: [] });
  }
}
