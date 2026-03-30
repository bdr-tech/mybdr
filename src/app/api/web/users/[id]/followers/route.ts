import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/users/[id]/followers
 *
 * 특정 유저를 팔로우하는 사람(팔로워) 목록을 반환한다.
 * 닉네임 + 프로필 이미지만 선택하여 가볍게 응답.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = BigInt(id);

    // 이 유저를 팔로우하는 사람들 조회 (최신순)
    const followers = await prisma.follows.findMany({
      where: { following_id: userId },
      select: {
        follower: {
          select: {
            id: true,
            nickname: true,
            name: true,
            profile_image_url: true,
          },
        },
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      take: 100, // 최대 100명까지 반환
    });

    // 응답 형태로 변환 (follower 정보 평탄화)
    const result = followers.map((f) => ({
      id: f.follower.id.toString(),
      nickname: f.follower.nickname ?? f.follower.name ?? "사용자",
      profileImage: f.follower.profile_image_url,
      followedAt: f.created_at.toISOString(),
    }));

    return apiSuccess({ followers: result, total: result.length });
  } catch {
    return apiError("팔로워 목록을 불러올 수 없습니다.", 500);
  }
}
