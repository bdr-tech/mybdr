import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// 가벼운 세션 확인 엔드포인트 — DB 쿼리 없이 JWT만 검증
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  return apiSuccess({
    id: ctx.session.sub,
    email: ctx.session.email,
    name: ctx.session.name,
    role: ctx.session.role,
  });
});
