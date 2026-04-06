import { NextRequest } from "next/server";
import { listGames, listGameCities } from "@/lib/services/game";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * GET /api/web/games
 *
 * 경기 목록 + 도시 목록을 한번에 반환하는 공개 API
 * - 인증 불필요 (공개 목록)
 * - 쿼리 파라미터: q(검색), type(경기유형), city(도시), date(날짜범위), prefer(선호지역필터)
 * - prefer=true이면 로그인 유저의 city(쉼표 구분)를 자동 필터로 적용
 * - BigInt/Date/Decimal 필드를 JSON 직렬화 가능한 형태로 변환
 */
export async function GET(request: NextRequest) {
  // 공개 API — IP 기반 rate limit (분당 100회)
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`web-games:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  try {
    const { searchParams } = request.nextUrl;

    // 쿼리 파라미터 추출
    const q = searchParams.get("q") || undefined;
    const type = searchParams.get("type") || undefined;
    const city = searchParams.get("city") || undefined;
    const date = searchParams.get("date") || undefined;
    const prefer = searchParams.get("prefer") === "true";

    // prefer=true일 때 로그인 유저의 맞춤 설정을 모두 읽어서 필터로 사용
    // 명시적 city 파라미터가 있으면 그것을 우선하므로 preferredCities는 적용하지 않음
    let preferredCities: string[] | undefined;
    // 맞춤 경기 유형 (0=PICKUP, 1=GUEST, 2=PRACTICE) — 빈 배열이면 필터 미적용
    let preferredGameTypes: number[] | undefined;
    // 맞춤 실력 수준 — 빈 배열이면 필터 미적용
    let preferredSkillLevels: string[] | undefined;
    // 맞춤 요일/시간대 — JS 후처리 필터링에 사용
    let preferredDays: string[] | undefined;
    let preferredTimeSlots: string[] | undefined;
    if (prefer && !city) {
      const session = await getWebSession();
      if (session) {
        const user = await prisma.user.findUnique({
          where: { id: BigInt(session.sub) },
          select: {
            city: true,
            preferred_game_types: true,
            // 맞춤 설정에서 선택한 지역(17개 광역시/도)을 우선 사용
            preferred_regions: true,
            // 맞춤 실력 수준 (7단계 코드 배열)
            preferred_skill_levels: true,
            // 맞춤 요일 (mon/tue/wed 등 코드 배열)
            preferred_days: true,
            // 맞춤 시간대 (morning/afternoon/evening/night 코드 배열)
            preferred_time_slots: true,
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

        // preferred_game_types: JSON 필드이므로 배열로 캐스팅 후 유효한 값만 사용
        if (user?.preferred_game_types) {
          const gameTypes = user.preferred_game_types as number[];
          if (Array.isArray(gameTypes) && gameTypes.length > 0) {
            preferredGameTypes = gameTypes;
          }
        }

        // 맞춤 실력 수준: DB에서 Prisma 쿼리로 필터링
        const skills = user?.preferred_skill_levels as string[] | null;
        if (Array.isArray(skills) && skills.length > 0) {
          preferredSkillLevels = skills;
        }

        // 맞춤 요일/시간대: DB 조회 후 JS 후처리에서 사용 (Prisma에서 DOW 추출 불가)
        const days = user?.preferred_days as string[] | null;
        if (Array.isArray(days) && days.length > 0) {
          preferredDays = days;
        }
        const slots = user?.preferred_time_slots as string[] | null;
        if (Array.isArray(slots) && slots.length > 0) {
          preferredTimeSlots = slots;
        }
      }
    }

    // 날짜 범위 계산 (기존 page.tsx에서 이동)
    let scheduledAt: { gte?: Date; lt?: Date } | undefined;
    if (date && date !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (date === "today") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        scheduledAt = { gte: today, lt: tomorrow };
      } else if (date === "week") {
        // 이번 주 월요일 ~ 다음 주 월요일
        const mon = new Date(today);
        mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const nextMon = new Date(mon);
        nextMon.setDate(mon.getDate() + 7);
        scheduledAt = { gte: mon, lt: nextMon };
      } else if (date === "month") {
        scheduledAt = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
      }
    }

    // 서비스 함수로 DB 조회 (병렬 실행으로 성능 최적화)
    // prefer=true이고 맞춤 설정이 있으면 해당 필터 파라미터로 전달
    const [games, cities] = await Promise.all([
      listGames({
        q, type, city,
        cities: preferredCities,
        gameTypes: preferredGameTypes,
        skillLevels: preferredSkillLevels,
        scheduledAt,
        take: 60,
      }).catch(() => []),
      listGameCities(30).catch(() => []),
    ]);

    // ── 맞춤 요일/시간대 후처리 필터 ──────────────────────────────
    // Prisma에서 날짜의 요일/시간을 직접 추출하기 어려우므로,
    // DB에서 가져온 결과를 JS 레벨에서 필터링한다.
    // 요일 코드 매핑: JS Date.getDay() → 0(일)~6(토)
    const DAY_CODE_MAP: Record<string, number> = {
      sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
    };
    // 시간대 코드별 시간 범위 (시작 시 <= hour < 종료 시)
    const TIME_SLOT_RANGES: Record<string, [number, number]> = {
      morning: [6, 12],     // 오전: 06~12시
      afternoon: [12, 18],  // 오후: 12~18시
      evening: [18, 22],    // 저녁: 18~22시
      night: [22, 6],       // 심야: 22~06시 (자정 넘김)
    };

    let filteredGames = games;

    // 맞춤 요일 필터: scheduled_at의 요일이 선택한 요일 중 하나와 일치
    if (preferredDays && preferredDays.length > 0) {
      const allowedDows = preferredDays.map((d) => DAY_CODE_MAP[d]).filter((n) => n !== undefined);
      if (allowedDows.length > 0) {
        filteredGames = filteredGames.filter((g) => {
          if (!g.scheduled_at) return true; // 날짜 없으면 통과 (필터 안 함)
          return allowedDows.includes(g.scheduled_at.getDay());
        });
      }
    }

    // 맞춤 시간대 필터: scheduled_at의 시간이 선택한 시간대 범위에 포함
    if (preferredTimeSlots && preferredTimeSlots.length > 0) {
      filteredGames = filteredGames.filter((g) => {
        if (!g.scheduled_at) return true; // 시간 없으면 통과
        const hour = g.scheduled_at.getHours();
        // 선택한 시간대 중 하나라도 매칭되면 통과
        return preferredTimeSlots!.some((slot) => {
          const range = TIME_SLOT_RANGES[slot];
          if (!range) return false;
          const [start, end] = range;
          // 심야(night)는 22~6으로 자정을 넘기므로 특수 처리
          if (start > end) return hour >= start || hour < end;
          return hour >= start && hour < end;
        });
      });
    }

    // BigInt, Date, Decimal 필드를 JSON 직렬화 가능하도록 변환
    const serializedGames = filteredGames.map((g) => ({
      id: g.id.toString(),                                    // BigInt -> string
      uuid: g.uuid,
      title: g.title,
      status: g.status,
      gameType: g.game_type,
      city: g.city,
      venueName: g.venue_name,
      scheduledAt: g.scheduled_at?.toISOString() ?? null,      // Date -> ISO string
      currentParticipants: g.current_participants,
      maxParticipants: g.max_participants,
      feePerPerson: g.fee_per_person?.toString() ?? null,      // Decimal -> string
      skillLevel: g.skill_level,
    }));

    // 30초 캐시: 경기 목록은 자주 변경되므로 짧은 캐시 적용
    const response = apiSuccess({ games: serializedGames, cities });
    response.headers.set("Cache-Control", "public, s-maxage=30, max-age=30");
    return response;
  } catch (error) {
    console.error("[GET /api/web/games] Error:", error);
    return apiError("경기 목록을 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
