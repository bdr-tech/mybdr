import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { encryptAccount, maskAccount } from "@/lib/security/account-crypto";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getProfile, updateProfile } from "@/lib/services/user";
import { checkProfileCompletion } from "@/lib/profile/completion";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// BUG-001 수정: Zod 스키마로 허용 필드만 통과
const profilePatchSchema = z.object({
  nickname: z.string().max(30).nullish(),
  position: z.string().max(20).nullish(),
  height: z.number().min(100).max(250).nullish(),
  city: z.string().max(50).nullish(),
  bio: z.string().max(500).nullish(),
  name: z.string().max(50).nullish(),
  phone: z.string().max(20).nullish(),
  birth_date: z.string().nullish(),
  district: z.string().max(50).nullish(),
  weight: z.number().min(30).max(200).nullish(),
  bank_name: z.string().max(30).nullish(),
  bank_code: z.string().max(10).nullish(),
  account_number: z.string().max(50).nullish(),
  account_holder: z.string().max(30).nullish(),
  account_consent: z.boolean().optional(),
  profile_completed: z.boolean().optional(),
}).strict();

export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    const { user, teams, gameApplications, tournamentTeams } = await getProfile(ctx.userId);

    if (!user) return apiError("User not found", 404);

    const { account_number, createdAt, ...userRest } = user;
    const account_number_masked = account_number
      ? maskAccount(account_number.startsWith("enc:") ? account_number : account_number)
      : null;

    return apiSuccess({
      user: {
        ...userRest,
        birth_date: user.birth_date?.toISOString().slice(0, 10) ?? null,
        created_at: createdAt?.toISOString() ?? null,
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
    return apiError("Internal error", 500);
  }
});

export const PATCH = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const raw = await req.json();
    const parsed = profilePatchSchema.safeParse(raw);
    if (!parsed.success) {
      return apiError("입력값이 올바르지 않습니다.", 400);
    }

    const body = parsed.data;

    // 계좌 필드: account_consent가 true일 때만 업데이트
    const bankUpdate: Record<string, unknown> = {};
    if (body.account_consent === true) {
      if (body.bank_name !== undefined) bankUpdate.bank_name = body.bank_name || null;
      if (body.bank_code !== undefined) bankUpdate.bank_code = body.bank_code || null;
      if (body.account_holder !== undefined) bankUpdate.account_holder = body.account_holder || null;
      if (body.account_number && body.account_number.trim()) {
        bankUpdate.account_number = encryptAccount(body.account_number.trim());
      }
    }

    // BUG-005 수정: phone을 DB에서 읽어와 completion 체크에 사용
    const currentUser = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true, nickname: true, phone: true, position: true, city: true },
    });

    // profile_completed 자동 동기화 (단일 쓰기)
    const mergedForCheck = {
      name: body.name ?? currentUser?.name ?? null,
      nickname: body.nickname ?? currentUser?.nickname ?? null,
      phone: body.phone ?? currentUser?.phone ?? null,
      position: body.position ?? currentUser?.position ?? null,
      city: body.city ?? currentUser?.city ?? null,
    };
    const isComplete = checkProfileCompletion(mergedForCheck);

    const updateData: Record<string, unknown> = {
      ...(body.nickname !== undefined && { nickname: body.nickname || null }),
      ...(body.position !== undefined && { position: body.position || null }),
      ...(body.height !== undefined && { height: body.height ?? null }),
      ...(body.city !== undefined && { city: body.city || null }),
      ...(body.bio !== undefined && { bio: body.bio || null }),
      ...(body.name !== undefined && { name: body.name || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.birth_date !== undefined && { birth_date: body.birth_date ? new Date(body.birth_date) : null }),
      ...(body.district !== undefined && { district: body.district || null }),
      ...(body.weight !== undefined && { weight: body.weight ?? null }),
      ...(body.profile_completed !== undefined && { profile_completed: body.profile_completed }),
      ...bankUpdate,
      // 자동 동기화: 체크 결과 반영 (이미 true면 그대로, false→true만)
      ...(isComplete && { profile_completed: true }),
    };

    const updated = await updateProfile(ctx.userId, updateData);

    return apiSuccess(updated);
  } catch {
    return apiError("Internal error", 500);
  }
});
