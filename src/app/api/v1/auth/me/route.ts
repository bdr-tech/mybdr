import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, notFound } from "@/lib/api/response";

// FR-021: 내 정보 API
async function handler(_req: NextRequest, ctx: AuthContext) {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(ctx.userId) },
    select: {
      id: true,
      email: true,
      nickname: true,
      profile_image_url: true,
      membershipType: true,
      isAdmin: true,
    },
  });

  if (!user) return notFound("User not found");

  return apiSuccess({
    id: user.id.toString(),
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.profile_image_url,
    membershipType: user.membershipType,
    isAdmin: user.isAdmin ?? false,
  });
}

export const GET = withErrorHandler(withAuth(handler));
