import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { encryptAccount, maskAccount } from "@/lib/security/account-crypto";

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
        // 기존 필드 (profile 조회용)
        nickname: true,
        email: true,
        position: true,
        height: true,
        city: true,
        bio: true,
        profile_image_url: true,
        total_games_participated: true,
        // 신규 필드 (profile/edit 용)
        name: true,
        phone: true,
        birth_date: true,
        district: true,
        weight: true,
        bank_name: true,
        bank_code: true,
        account_number: true,
        account_holder: true,
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
      include: { games: { select: { id: true, uuid: true, title: true, scheduled_at: true, status: true } } },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    const tournamentTeams = await prisma.tournamentTeamPlayer.findMany({
      where: { userId },
      include: { tournamentTeam: { include: { tournament: { select: { id: true, name: true, status: true } } } } },
      take: 10,
    });

    // account_number는 마스킹 처리 후 전송
    const { account_number, ...userRest } = user;
    const account_number_masked = account_number
      ? maskAccount(account_number.startsWith("enc:") ? account_number : account_number)
      : null;

    return NextResponse.json({
      user: {
        ...userRest,
        birth_date: user.birth_date?.toISOString().slice(0, 10) ?? null,
        account_number_masked,
        has_account: !!account_number,
      },
      teams: teams.map((m) => ({
        id: m.team.id.toString(),
        name: m.team.name,
        role: m.role ?? "member",
      })),
      recentGames: gameApplications.map((a) => ({
        id: a.games?.uuid ?? a.game_id.toString(),
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
    const body = await req.json() as Record<string, unknown>;

    const {
      // 기존 필드
      nickname, position, height, city, bio,
      // 신규 필드
      name, phone, birth_date, district, weight,
      // 계좌 필드 (account_consent 필수)
      bank_name, bank_code, account_number, account_holder, account_consent,
    } = body;

    // 계좌 필드: account_consent가 true일 때만 업데이트
    const bankUpdate: Record<string, unknown> = {};
    if (account_consent === true) {
      if (bank_name !== undefined) bankUpdate.bank_name = bank_name || null;
      if (bank_code !== undefined) bankUpdate.bank_code = bank_code || null;
      if (account_holder !== undefined) bankUpdate.account_holder = account_holder || null;
      if (account_number && typeof account_number === "string" && account_number.trim()) {
        bankUpdate.account_number = encryptAccount(account_number.trim());
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname !== undefined && { nickname: nickname as string || null }),
        ...(position !== undefined && { position: position as string || null }),
        ...(height !== undefined && { height: height ? Number(height) : null }),
        ...(city !== undefined && { city: city as string || null }),
        ...(bio !== undefined && { bio: bio as string || null }),
        ...(name !== undefined && { name: name as string || null }),
        ...(phone !== undefined && { phone: phone as string || null }),
        ...(birth_date !== undefined && { birth_date: birth_date ? new Date(birth_date as string) : null }),
        ...(district !== undefined && { district: district as string || null }),
        ...(weight !== undefined && { weight: weight ? Number(weight) : null }),
        ...bankUpdate,
      },
      select: { nickname: true, position: true, height: true, city: true, bio: true, name: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
