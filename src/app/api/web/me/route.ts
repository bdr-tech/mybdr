import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// 세션 확인 + 프로필 이미지 엔드포인트
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      profile_image: true,
      profile_image_url: true,
      // 맞춤 보기 토글 상태를 DB에서 직접 읽어옴 (디비전 존재 여부가 아닌 실제 저장값)
      prefer_filter_enabled: true,
    },
  }).catch(() => null);

  return apiSuccess({
    id: ctx.session.sub,
    email: ctx.session.email,
    name: ctx.session.name,
    role: ctx.session.role,
    profileImage: user?.profile_image_url || user?.profile_image || null,
    // DB에 저장된 실제 토글 상태값을 반환 (false면 OFF, true면 ON)
    prefer_filter_enabled: user?.prefer_filter_enabled ?? false,
  });
});
