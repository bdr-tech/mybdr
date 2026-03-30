import { type NextRequest } from "next/server";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { updateTournamentSchema } from "@/lib/validation/tournament";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getTournament, updateTournament } from "@/lib/services/tournament";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/[id]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const tournament = await getTournament(id);

  if (!tournament)
    return apiError("대회를 찾을 수 없습니다.", 404);

  return apiSuccess(tournament);
}

// PATCH /api/web/tournaments/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const result = updateTournamentSchema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return apiError(firstIssue?.message ?? "유효하지 않은 값입니다.", 400);
  }

  const data = result.data;

  // Zod 검증 통과된 데이터를 Prisma update 형식으로 변환
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.format !== undefined) updateData.format = data.format;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.venue_name !== undefined) updateData.venue_name = data.venue_name;
  if (data.venue_address !== undefined) updateData.venue_address = data.venue_address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.district !== undefined) updateData.district = data.district;
  if (data.maxTeams !== undefined) updateData.maxTeams = data.maxTeams;
  if (data.team_size !== undefined) updateData.team_size = data.team_size;
  if (data.roster_min !== undefined) updateData.roster_min = data.roster_min;
  if (data.roster_max !== undefined) updateData.roster_max = data.roster_max;
  if (data.entry_fee !== undefined) updateData.entry_fee = data.entry_fee;
  if (data.registration_start_at !== undefined) updateData.registration_start_at = data.registration_start_at ? new Date(data.registration_start_at) : null;
  if (data.registration_end_at !== undefined) updateData.registration_end_at = data.registration_end_at ? new Date(data.registration_end_at) : null;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.rules !== undefined) updateData.rules = data.rules;
  if (data.prize_info !== undefined) updateData.prize_info = data.prize_info;
  if (data.is_public !== undefined) updateData.is_public = data.is_public;
  if (data.auto_approve_teams !== undefined) updateData.auto_approve_teams = data.auto_approve_teams;
  if (data.primary_color !== undefined) updateData.primary_color = data.primary_color;
  if (data.secondary_color !== undefined) updateData.secondary_color = data.secondary_color;
  // 접수 설정
  if (data.categories !== undefined) updateData.categories = data.categories;
  if (data.div_caps !== undefined) updateData.div_caps = data.div_caps;
  if (data.div_fees !== undefined) updateData.div_fees = data.div_fees;
  if (data.allow_waiting_list !== undefined) updateData.allow_waiting_list = data.allow_waiting_list;
  if (data.waiting_list_cap !== undefined) updateData.waiting_list_cap = data.waiting_list_cap;
  if (data.bank_name !== undefined) updateData.bank_name = data.bank_name;
  if (data.bank_account !== undefined) updateData.bank_account = data.bank_account;
  if (data.bank_holder !== undefined) updateData.bank_holder = data.bank_holder;
  if (data.fee_notes !== undefined) updateData.fee_notes = data.fee_notes;
  // 새 필드: 주최/주관/후원/성별/경기설정/장소
  if (data.organizer !== undefined) updateData.organizer = data.organizer;
  if (data.host !== undefined) updateData.host = data.host;
  if (data.sponsors !== undefined) updateData.sponsors = data.sponsors;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.game_time !== undefined) updateData.game_time = data.game_time;
  if (data.game_ball !== undefined) updateData.game_ball = data.game_ball;
  if (data.game_method !== undefined) updateData.game_method = data.game_method;
  if (data.places !== undefined) updateData.places = data.places;
  // 디자인 템플릿 + 이미지 URL
  if (data.design_template !== undefined) updateData.design_template = data.design_template;
  if (data.logo_url !== undefined) updateData.logo_url = data.logo_url || null;
  if (data.banner_url !== undefined) updateData.banner_url = data.banner_url || null;

  const updated = await updateTournament(id, updateData);

  return apiSuccess(updated);
}
