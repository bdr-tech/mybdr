import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";

/**
 * GET /api/web/tournaments/[id]/my-status
 *
 * 현재 로그인한 유저가 이 대회에 참가했는지,
 * 참가했다면 상태(pending/approved) + 입금 상태(unpaid/paid) 반환.
 *
 * 사이드바의 참가 상태 트래킹에 사용.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) {
    // 미로그인: 참가 상태 없음
    return apiSuccess({ registered: false, status: null, payment_status: null, team_name: null });
  }

  const { id: tournamentId } = await params;
  const userId = BigInt(session.sub);

  // 유저가 이 대회에 참가한 팀을 조회
  // tournament_team_players -> tournament_team -> tournament 경로로 조회
  const registration = await prisma.tournamentTeamPlayer
    .findFirst({
      where: {
        userId,
        tournamentTeam: { tournamentId },
      },
      select: {
        tournamentTeam: {
          select: {
            status: true,
            payment_status: true,
            team: { select: { name: true } },
          },
        },
      },
    })
    .catch(() => null);

  if (!registration) {
    return apiSuccess({ registered: false, status: null, payment_status: null, team_name: null });
  }

  return apiSuccess({
    registered: true,
    status: registration.tournamentTeam.status,
    payment_status: registration.tournamentTeam.payment_status,
    team_name: registration.tournamentTeam.team.name,
  });
}
