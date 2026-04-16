import { NextRequest } from "next/server";
import { withWebAuth, type WebAuthContext, getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createTournament, hasCreatePermission, listTournaments } from "@/lib/services/tournament";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * GET /api/web/tournaments
 *
 * 대회 목록을 반환하는 공개 API
 * - 인증 불필요 (공개 목록)
 * - 쿼리 파라미터: status (대회 상태 필터)
 * - Date/Decimal 필드를 JSON 직렬화 가능한 형태로 변환
 */
export async function GET(request: NextRequest) {
  // 공개 API(GET) — IP 기반 rate limit (분당 100회, POST는 withWebAuth가 보호)
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`web-tournaments:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  try {
    const { searchParams } = request.nextUrl;

    // 쿼리 파라미터 추출
    const status = searchParams.get("status") || undefined;
    const prefer = searchParams.get("prefer") === "true";

    // 세션 조회 — 비공개 대회 포함 여부(관계자/super_admin) 판단에 사용
    // prefer=true일 때는 맞춤 설정 추출에도 재사용
    const session = await getWebSession();
    const viewerUserId = session ? BigInt(session.sub) : undefined;
    const viewerIsSuperAdmin =
      session?.role === "super_admin" || session?.admin_role === "super_admin";

    // prefer=true일 때 로그인 유저의 맞춤 설정(지역, 종별, 성별)을 조회
    let preferredCities: string[] | undefined;
    let preferredDivisions: string[] | undefined;
    let preferredGender: string[] | undefined;
    if (prefer) {
      if (session) {
        const user = await prisma.user.findUnique({
          where: { id: BigInt(session.sub) },
          select: {
            city: true,
            preferred_divisions: true,
            // 맞춤 지역(17개 광역시/도) — user.city보다 우선 사용
            preferred_regions: true,
            // 맞춤 성별 필터 (male/female/mixed 배열)
            preferred_gender: true,
          },
        });

        // 지역 필터: preferred_regions(맞춤 설정)를 우선, 없으면 user.city(프로필) 사용
        const regions = user?.preferred_regions as string[] | null;
        if (Array.isArray(regions) && regions.length > 0) {
          preferredCities = regions;
        } else if (user?.city) {
          const cities = user.city.split(",").map((c) => c.trim()).filter(Boolean);
          if (cities.length > 0) {
            preferredCities = cities;
          }
        }

        // preferred_divisions는 Json 배열 -- Array.isArray()로 안전하게 검증
        if (user?.preferred_divisions && Array.isArray(user.preferred_divisions)) {
          const divs = user.preferred_divisions as string[];
          if (divs.length > 0) {
            preferredDivisions = divs;
          }
        }

        // 맞춤 성별 필터 (tournament.gender가 선택한 성별 중 하나와 일치)
        const genders = user?.preferred_gender as string[] | null;
        if (Array.isArray(genders) && genders.length > 0) {
          preferredGender = genders;
        }
      }
    }

    // 서비스 함수로 DB 조회 (prefer=true이면 cities + divisions + gender 파라미터 전달)
    // viewerUserId/isSuperAdmin — 세션 유저가 관계자인 비공개 대회도 결과에 포함
    const rows = await listTournaments({
      status,
      cities: preferredCities,
      divisions: preferredDivisions,
      gender: preferredGender,
      take: 60,
      viewerUserId,
      viewerIsSuperAdmin,
    }).catch(() => []);

    // Date, Decimal 필드를 JSON 직렬화 가능하도록 변환
    const tournaments = rows.map((t) => ({
      id: t.id,
      name: t.name,
      format: t.format,
      status: t.status,
      startDate: t.startDate?.toISOString() ?? null,   // Date -> ISO string
      endDate: t.endDate?.toISOString() ?? null,        // Date -> ISO string
      entryFee: t.entry_fee?.toString() ?? null,        // Decimal -> string
      city: t.city,
      venueName: t.venue_name,
      maxTeams: t.maxTeams,
      divisions: t.divisions ?? [],                      // 종별 목록 (Json 배열)
      categories: t.categories ?? {},                    // 종별 정보 (Json 객체)
      divisionTiers: t.division_tiers ?? [],             // 디비전 목록 (Json 배열)
      teamCount: t._count.tournamentTeams,              // 참가팀 수
    }));

    // 60초 캐시: 비로그인은 공용 캐시(public), 로그인 유저는 개인화 결과라 private
    // (관계자 계정에만 비공개 대회가 추가되므로 결과가 사용자마다 달라짐)
    const response = apiSuccess({ tournaments });
    if (session) {
      response.headers.set("Cache-Control", "private, max-age=60");
    } else {
      response.headers.set("Cache-Control", "public, s-maxage=60, max-age=60");
    }
    return response;
  } catch (error) {
    console.error("[GET /api/web/tournaments] Error:", error);
    return apiError("대회 목록을 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}

const FORMAT_MAP: Record<string, string> = {
  "싱글 엘리미네이션": "single_elimination",
  "라운드 로빈": "round_robin",
  "그룹 스테이지": "group_stage",
  "더블 엘리미네이션": "double_elimination",
  "스위스": "swiss",
};

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json();
    const {
      name, format, startDate, endDate, subdomain, primaryColor, secondaryColor,
      description,
      registrationStartAt, registrationEndAt,
      venueName, venueAddress, city,
      categories, divCaps, divFees,
      allowWaitingList, waitingListCap,
      entryFee, bankName, bankAccount, bankHolder, feeNotes,
      maxTeams, teamSize, rosterMin, rosterMax, autoApproveTeams,
      // 대회 관리 확장 필드
      organizer, host, sponsors, gameTime, gameBall, gameMethod, places, gender,
      rules, prizeInfo,
      // 디자인 템플릿 + 이미지 URL
      designTemplate, logoUrl, bannerUrl,
      // settings JSON (bracket 세부설정 등) — createTournament에 그대로 전달
      settings,
    } = body;

    if (!name?.trim()) {
      return apiError("대회 이름은 필수입니다.", 400);
    }

    // 슈퍼관리자는 구독 체크 우회
    if (ctx.session.role !== "super_admin") {
      const canCreate = await hasCreatePermission(ctx.userId);
      if (!canCreate) {
        return apiError("UPGRADE_REQUIRED", 402);
      }
    }
    const normalizedFormat = FORMAT_MAP[format] ?? format ?? "single_elimination";

    // TC-NEW-022: 날짜 유효성 검사 (Invalid Date 방지)
    const parsedStart = startDate ? new Date(startDate) : null;
    const parsedEnd = endDate ? new Date(endDate) : null;
    if (parsedStart && isNaN(parsedStart.getTime())) {
      return apiError("유효하지 않은 시작일입니다.", 400);
    }
    if (parsedEnd && isNaN(parsedEnd.getTime())) {
      return apiError("유효하지 않은 종료일입니다.", 400);
    }
    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      return apiError("시작일이 종료일보다 늦을 수 없습니다.", 400);
    }

    // 접수 날짜 파싱
    const parsedRegStart = registrationStartAt ? new Date(registrationStartAt) : null;
    const parsedRegEnd = registrationEndAt ? new Date(registrationEndAt) : null;

    const tournament = await createTournament({
      name: name.trim(),
      organizerId: ctx.userId,
      format: normalizedFormat,
      startDate: parsedStart,
      endDate: parsedEnd,
      primaryColor,
      secondaryColor,
      subdomain: subdomain?.trim()?.toLowerCase(),
      // 접수 설정
      description: description || undefined,
      registrationStartAt: parsedRegStart,
      registrationEndAt: parsedRegEnd,
      venueName: venueName || undefined,
      venueAddress: venueAddress || undefined,
      city: city || undefined,
      // 대회 관리 확장 필드
      organizer: organizer || undefined,
      host: host || undefined,
      sponsors: sponsors || undefined,
      gameTime: gameTime || undefined,
      gameBall: gameBall || undefined,
      gameMethod: gameMethod || undefined,
      places: places || undefined,
      gender: gender || undefined,
      rules: rules || undefined,
      prizeInfo: prizeInfo || undefined,
      categories: categories || undefined,
      divCaps: divCaps || undefined,
      divFees: divFees || undefined,
      allowWaitingList: allowWaitingList ?? undefined,
      waitingListCap: waitingListCap ? Number(waitingListCap) : undefined,
      entryFee: entryFee ? Number(entryFee) : undefined,
      bankName: bankName || undefined,
      bankAccount: bankAccount || undefined,
      bankHolder: bankHolder || undefined,
      feeNotes: feeNotes || undefined,
      maxTeams: maxTeams ? Number(maxTeams) : undefined,
      teamSize: teamSize ? Number(teamSize) : undefined,
      rosterMin: rosterMin ? Number(rosterMin) : undefined,
      rosterMax: rosterMax ? Number(rosterMax) : undefined,
      autoApproveTeams: autoApproveTeams ?? undefined,
      // 디자인 템플릿 + 이미지 URL
      designTemplate: designTemplate || undefined,
      logoUrl: logoUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      // settings JSON (bracket 세부 설정 등)
      settings: settings && typeof settings === "object" ? settings : undefined,
    });

    return apiSuccess({
      success: true,
      tournamentId: tournament.id,
      redirectUrl: `/tournament-admin/tournaments/${tournament.id}`,
    });
  } catch {
    return apiError("대회 생성 중 오류가 발생했습니다.", 500);
  }
});
