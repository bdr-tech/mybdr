import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = BigInt(session.sub);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        nickname: true,
        email: true,
        position: true,
        height: true,
        city: true,
        bio: true,
        profile_image_url: true,
        total_games_participated: true,
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const teams = await prisma.teamMember.findMany({
      where: { userId, status: "active" },
      include: { team: { select: { id: true, name: true } } },
      take: 10,
    });

    const gameApplications = await prisma.game_applications.findMany({
      where: { user_id: userId },
      include: { games: { select: { id: true, title: true, scheduled_at: true, status: true } } },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    const tournamentTeams = await prisma.tournamentTeamPlayer.findMany({
      where: { userId },
      include: { tournamentTeam: { include: { tournament: { select: { id: true, name: true, status: true } } } } },
      take: 10,
    });

    return NextResponse.json({
      user,
      teams: teams.map((m) => ({
        id: m.team.id.toString(),
        name: m.team.name,
        role: m.role ?? "member",
      })),
      recentGames: gameApplications.map((a) => ({
        id: a.game_id.toString(),
        title: a.games?.title ?? null,
        scheduled_at: a.games?.scheduled_at?.toISOString() ?? null,
        status: a.games?.status ?? 0,
      })),
      tournaments: tournamentTeams.map((tp) => ({
        id: tp.tournamentTeam.tournament.id,
        name: tp.tournamentTeam.tournament.name,
        status: tp.tournamentTeam.tournament.status ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = BigInt(session.sub);
    const body = await req.json();

    const { nickname, position, height, city, bio } = body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname !== undefined && { nickname: nickname || null }),
        ...(position !== undefined && { position: position || null }),
        ...(height !== undefined && { height: height ? Number(height) : null }),
        ...(city !== undefined && { city: city || null }),
        ...(bio !== undefined && { bio: bio || null }),
      },
      select: { nickname: true, position: true, height: true, city: true, bio: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
