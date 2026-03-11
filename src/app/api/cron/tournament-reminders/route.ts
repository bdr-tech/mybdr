import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";

// Vercel Cron: 매일 KST 09:00 (UTC 00:00) 실행
// vercel.json: { "crons": [{ "path": "/api/cron/tournament-reminders", "schedule": "0 0 * * *" }] }
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  // KST 기준 오늘 자정 (UTC 기준)
  const kstOffset = 9 * 60 * 60 * 1000;
  const now = new Date();
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstToday = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
  );

  // D-3, D-1 날짜 범위 (KST 자정 기준 다음날 자정까지)
  const dayMs = 24 * 60 * 60 * 1000;
  const d3Start = new Date(kstToday.getTime() + 3 * dayMs);
  const d3End = new Date(d3Start.getTime() + dayMs);
  const d1Start = new Date(kstToday.getTime() + 1 * dayMs);
  const d1End = new Date(d1Start.getTime() + dayMs);

  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ["registration", "active"] },
      startDate: {
        gte: d1Start,
        lt: d3End,
      },
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      tournamentTeams: {
        where: { status: "approved" },
        select: {
          team: {
            select: {
              teamMembers: {
                where: { role: "leader" },
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  const inputs: Parameters<typeof createNotificationBulk>[0] = [];

  for (const tournament of tournaments) {
    if (!tournament.startDate) continue;

    const diffMs = tournament.startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / dayMs);
    const dLabel = diffDays <= 1 ? "D-1" : "D-3";

    // D-1과 D-3 범위에만 발송
    const isD3 = tournament.startDate >= d3Start && tournament.startDate < d3End;
    const isD1 = tournament.startDate >= d1Start && tournament.startDate < d1End;
    if (!isD3 && !isD1) continue;

    for (const tt of tournament.tournamentTeams) {
      for (const member of tt.team.teamMembers) {
        inputs.push({
          userId: member.userId,
          notificationType: NOTIFICATION_TYPES.TOURNAMENT_DDAY_REMINDER,
          title: `대회 ${dLabel}일 전 알림`,
          content: `"${tournament.name}" 대회가 ${dLabel}일 후 시작됩니다. 준비를 확인하세요.`,
          actionUrl: `/tournament-admin/tournaments/${tournament.id}`,
        });
      }
    }
  }

  if (inputs.length > 0) {
    await createNotificationBulk(inputs);
  }

  return apiSuccess({
    success: true,
    notificationsSent: inputs.length,
    tournamentsProcessed: tournaments.length,
  });
}
