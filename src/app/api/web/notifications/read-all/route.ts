import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { NextRequest } from "next/server";
import {
  type NotifCategory,
  TYPES_BY_CATEGORY,
} from "@/lib/notifications/category";

/**
 * POST /api/web/notifications/read-all
 *   본인 알림 전체를 읽음 처리. body.category 지정 시 해당 카테고리만 처리.
 *
 * 이유:
 *   - referee 플랫폼 벨 드롭다운/목록 페이지의 "전체 읽음" 버튼 전용 (기존 동작)
 *   - (web)/notifications M6: 카테고리 탭에서 "이 탭만 모두 읽음" 액션 지원
 *
 * 입력:
 *   body: { category?: 'tournament' | 'game' | 'team' | 'community' | 'system' }
 *   - 없거나 잘못된 값이면 전체 읽음 (하위호환)
 *   - 있으면 TYPES_BY_CATEGORY[category] 화이트리스트의 type만 read 전환
 */
export async function POST(req: NextRequest) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }

  // body.category 파라싱 — body가 없을 수도 있으므로 try/catch 후 fallback
  // (기존 referee 코드는 body 없이 fetch 했으므로 무 body 호출도 정상 처리)
  let category: NotifCategory | null = null;
  try {
    const body = (await req.json().catch(() => null)) as
      | { category?: string }
      | null;
    const cand = body?.category as NotifCategory | undefined;
    if (cand && cand in TYPES_BY_CATEGORY) category = cand;
  } catch {
    // body 무시 — 기존 동작 유지
  }

  try {
    // 카테고리 지정 시 해당 type만 필터, 미지정 시 전체 unread
    const where: Record<string, unknown> = {
      user_id: BigInt(session.sub),
      status: "unread",
    };
    if (category) {
      where.notification_type = { in: [...TYPES_BY_CATEGORY[category]] };
    }

    const result = await prisma.notifications.updateMany({
      where,
      data: {
        status: "read",
        read_at: new Date(),
      },
    });

    // ⚠️ snake_case 자동 변환: 클라는 data.updated 로 접근 (단일 단어라 변환 동일)
    return apiSuccess({ updated: result.count });
  } catch (error) {
    console.error("[web/notifications/read-all] POST 실패:", error);
    return apiError("전체 읽음 처리 실패", 500, "INTERNAL_ERROR");
  }
}
