import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      tournamentSite: { select: { id: true, subdomain: true, isPublished: true, primaryColor: true, secondaryColor: true } },
      adminMembers: {
        where: { isActive: true },
        select: { id: true, userId: true, role: true },
      },
      _count: {
        select: { tournamentTeams: true, tournamentMatches: true },
      },
    },
  });

  if (!tournament)
    return NextResponse.json({ error: "대회를 찾을 수 없습니다." }, { status: 404 });

  return toJSON(tournament);
}

// PATCH /api/web/tournaments/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const {
    name, format, startDate, endDate, status,
    venue_name, venue_address, city, district,
    maxTeams, team_size, roster_min, roster_max,
    entry_fee, registration_start_at, registration_end_at,
    description, rules, prize_info, is_public,
    auto_approve_teams, primary_color, secondary_color,
  } = body as Record<string, string | number | boolean | null | undefined>;

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(format !== undefined && { format: String(format) }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(String(startDate)) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(String(endDate)) : null }),
      ...(status !== undefined && { status: String(status) }),
      ...(venue_name !== undefined && { venue_name: venue_name ? String(venue_name) : null }),
      ...(venue_address !== undefined && { venue_address: venue_address ? String(venue_address) : null }),
      ...(city !== undefined && { city: city ? String(city) : null }),
      ...(district !== undefined && { district: district ? String(district) : null }),
      ...(maxTeams !== undefined && { maxTeams: Number(maxTeams) }),
      ...(team_size !== undefined && { team_size: Number(team_size) }),
      ...(roster_min !== undefined && { roster_min: Number(roster_min) }),
      ...(roster_max !== undefined && { roster_max: Number(roster_max) }),
      ...(entry_fee !== undefined && { entry_fee: Number(entry_fee) }),
      ...(registration_start_at !== undefined && {
        registration_start_at: registration_start_at ? new Date(String(registration_start_at)) : null,
      }),
      ...(registration_end_at !== undefined && {
        registration_end_at: registration_end_at ? new Date(String(registration_end_at)) : null,
      }),
      ...(description !== undefined && { description: description ? String(description) : null }),
      ...(rules !== undefined && { rules: rules ? String(rules) : null }),
      ...(prize_info !== undefined && { prize_info: prize_info ? String(prize_info) : null }),
      ...(is_public !== undefined && { is_public: Boolean(is_public) }),
      ...(auto_approve_teams !== undefined && { auto_approve_teams: Boolean(auto_approve_teams) }),
      ...(primary_color !== undefined && { primary_color: primary_color ? String(primary_color) : null }),
      ...(secondary_color !== undefined && { secondary_color: secondary_color ? String(secondary_color) : null }),
    },
  });

  return toJSON(updated);
}
