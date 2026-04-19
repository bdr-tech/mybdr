import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { encryptAccount, maskAccount } from "@/lib/security/account-crypto";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getProfile, updateProfile } from "@/lib/services/user";

export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    // M1 Day 7: followersCount/followingCount/nextGameApp 병렬 추가 (service 레벨)
    const {
      user,
      teams,
      gameApplications,
      tournamentTeams,
      followersCount,
      followingCount,
      nextGameApp,
    } = await getProfile(ctx.userId);

    if (!user) return apiError("User not found", 404);

    // account_number는 마스킹 처리 후 전송
    const { account_number, createdAt, ...userRest } = user;
    const account_number_masked = account_number
      ? maskAccount(account_number.startsWith("enc:") ? account_number : account_number)
      : null;

    // M1 Day 7: 다음 경기 요약 — 프론트에서 D-N 계산 용이하도록 ISO 문자열로 전달
    // nextGameApp이 없으면 null (허브 카드에서 "예정된 경기 없음" 표시)
    const nextGame = nextGameApp?.games
      ? {
          // 목록/상세 링크는 uuid 우선 (기존 recentGames와 동일 규칙)
          id: nextGameApp.games.uuid ?? nextGameApp.game_id.toString(),
          title: nextGameApp.games.title ?? null,
          scheduled_at: nextGameApp.games.scheduled_at?.toISOString() ?? null,
          venue_name: nextGameApp.games.venue_name ?? null,
        }
      : null;

    return apiSuccess({
      user: {
        ...userRest,
        birth_date: user.birth_date?.toISOString().slice(0, 10) ?? null,
        // 가입일을 ISO 문자열로 변환하여 전달 (profile-header에서 표시)
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
      // M1 Day 7: 허브 대시보드 전용 신규 필드 3종 (기존 필드 불변)
      followersCount,
      followingCount,
      nextGame,
    });
  } catch {
    return apiError("Internal error", 500);
  }
});

export const PATCH = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json() as Record<string, unknown>;

    const {
      // 기존 필드
      nickname, position, height, city, bio,
      // 신규 필드
      name, phone, birth_date, district, weight,
      // 계좌 필드 (account_consent 필수)
      bank_name, bank_code, account_number, account_holder, account_consent,
    } = body;

    // T2-04: 닉네임 길이 검증 (2~20자)
    if (nickname !== undefined && typeof nickname === "string" && nickname.trim().length > 0) {
      const trimmed = nickname.trim();
      if (trimmed.length < 2 || trimmed.length > 20) {
        return apiError("닉네임은 2자 이상 20자 이하여야 합니다.", 400);
      }
    }

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

    const updated = await updateProfile(ctx.userId, {
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
    });

    return apiSuccess(updated);
  } catch {
    return apiError("Internal error", 500);
  }
});
