import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// 맞춤 설정 검증 스키마 - preferred_cities 제거 (user.city를 직접 활용)
const preferencesSchema = z.object({
  preferred_divisions: z.array(z.string()).optional(),
  preferred_board_categories: z.array(z.string()).optional(),
  // 경기 유형: 0=PICKUP, 1=GUEST, 2=PRACTICE (숫자 배열)
  preferred_game_types: z.array(z.number().int().min(0).max(2)).optional(),
  // 맞춤 지역/요일/시간대/실력 (문자열 배열)
  preferred_regions: z.array(z.string()).optional(),
  preferred_days: z.array(z.string()).optional(),
  preferred_time_slots: z.array(z.string()).optional(),
  preferred_skill_levels: z.array(z.string()).optional(),
  // 맞춤 성별 필터 (["male","female","mixed"] 등)
  preferred_gender: z.array(z.string()).optional(),
  // 맞춤 보기 토글 ON/OFF 상태 (true=켜짐, false=꺼짐)
  prefer_filter_enabled: z.boolean().optional(),
  // 숨긴 메뉴 slug 배열 (예: ["/rankings", "/organizations"])
  hidden_menus: z.array(z.string()).optional(),
});

// GET: 현재 유저의 맞춤 설정 조회
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        preferred_divisions: true,
        preferred_board_categories: true,
        preferred_game_types: true,
        preferred_regions: true,
        preferred_days: true,
        preferred_time_slots: true,
        preferred_skill_levels: true,
        preferred_gender: true,
        hidden_menus: true,
      },
    });

    if (!user) return apiError("User not found", 404);

    return apiSuccess({
      preferred_divisions: user.preferred_divisions ?? [],
      preferred_board_categories: user.preferred_board_categories ?? [],
      preferred_game_types: user.preferred_game_types ?? [],
      preferred_regions: user.preferred_regions ?? [],
      preferred_days: user.preferred_days ?? [],
      preferred_time_slots: user.preferred_time_slots ?? [],
      preferred_skill_levels: user.preferred_skill_levels ?? [],
      preferred_gender: user.preferred_gender ?? [],
      hidden_menus: user.hidden_menus ?? [],
    });
  } catch (e) {
    // 에러 원인 추적을 위해 서버 로그에 기록
    console.error("[preferences:GET]", e);
    return apiError("Internal error", 500);
  }
});

// PATCH: 맞춤 설정 업데이트
export const PATCH = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json();

    // Zod로 입력값 검증
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("유효하지 않은 입력입니다.", 422);
    }

    const { preferred_divisions, preferred_board_categories, preferred_game_types, preferred_regions, preferred_days, preferred_time_slots, preferred_skill_levels, preferred_gender, prefer_filter_enabled, hidden_menus } = parsed.data;

    // 변경할 필드만 모아서 업데이트 (undefined인 필드는 건너뜀)
    const updateData: Record<string, unknown> = {};
    if (preferred_divisions !== undefined) updateData.preferred_divisions = preferred_divisions;
    if (preferred_board_categories !== undefined) updateData.preferred_board_categories = preferred_board_categories;
    if (preferred_game_types !== undefined) updateData.preferred_game_types = preferred_game_types;
    // 맞춤 지역/요일/시간대/실력
    if (preferred_regions !== undefined) updateData.preferred_regions = preferred_regions;
    if (preferred_days !== undefined) updateData.preferred_days = preferred_days;
    if (preferred_time_slots !== undefined) updateData.preferred_time_slots = preferred_time_slots;
    if (preferred_skill_levels !== undefined) updateData.preferred_skill_levels = preferred_skill_levels;
    // 맞춤 성별 필터
    if (preferred_gender !== undefined) updateData.preferred_gender = preferred_gender;
    // 맞춤 보기 토글 상태를 DB에 저장 (OFF→false, ON→true)
    if (prefer_filter_enabled !== undefined) updateData.prefer_filter_enabled = prefer_filter_enabled;
    // 숨긴 메뉴 목록 저장
    if (hidden_menus !== undefined) updateData.hidden_menus = hidden_menus;

    // 변경할 내용이 없으면 현재 값 그대로 반환
    if (Object.keys(updateData).length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: {
          preferred_divisions: true,
          preferred_board_categories: true,
          preferred_game_types: true,
          preferred_regions: true,
          preferred_days: true,
          preferred_time_slots: true,
          preferred_skill_levels: true,
          preferred_gender: true,
          hidden_menus: true,
        },
      });
      return apiSuccess(user);
    }

    // 현재 유저의 onboarding_step 확인 — 맞춤 설정 완료 시 step 2로 진행시키기 위함
    const currentUser = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { onboarding_step: true },
    });

    // onboarding_step이 2보다 작으면 2로 업데이트 (이미 2 이상이면 건드리지 않음)
    if (currentUser && currentUser.onboarding_step < 2) {
      updateData.onboarding_step = 2;
    }

    const updated = await prisma.user.update({
      where: { id: ctx.userId },
      data: updateData,
      select: {
        preferred_divisions: true,
        preferred_board_categories: true,
        preferred_game_types: true,
        preferred_regions: true,
        preferred_days: true,
        preferred_time_slots: true,
        preferred_skill_levels: true,
        preferred_gender: true,
        hidden_menus: true,
      },
    });

    return apiSuccess(updated);
  } catch (e) {
    // 에러 원인 추적을 위해 서버 로그에 기록
    console.error("[preferences:PATCH]", e);
    return apiError("Internal error", 500);
  }
});
