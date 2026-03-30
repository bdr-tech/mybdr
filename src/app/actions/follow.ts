"use server";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

/**
 * toggleFollowAction - 유저 팔로우/언팔로우 토글
 *
 * 좋아요(toggleLikeAction)와 동일한 패턴:
 * - 로그인 확인 -> 자기 자신 방지 -> 기존 팔로우 확인 -> 토글
 * - 카운터 캐시 없음 (현재 팔로워 수 표시 UI 없음)
 */
export async function toggleFollowAction(
  targetUserId: string
): Promise<{ followed: boolean; error?: string }> {
  // 인증 확인: 비로그인이면 에러 반환
  const session = await getWebSession();
  if (!session) {
    return { followed: false, error: "로그인이 필요합니다." };
  }

  // 자기 자신 팔로우 방지
  if (session.sub === targetUserId) {
    return { followed: false, error: "자기 자신은 팔로우할 수 없습니다." };
  }

  try {
    const followerId = BigInt(session.sub);
    const followingId = BigInt(targetUserId);

    // 기존 팔로우 여부 확인 (@@unique 인덱스 활용)
    const existing = await prisma.follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        },
      },
    });

    if (existing) {
      // 이미 팔로우 중 -> 언팔로우 (삭제)
      await prisma.follows.delete({
        where: { id: existing.id },
      });
      return { followed: false };
    } else {
      // 팔로우 안 한 상태 -> 팔로우 (생성) + 알림 생성
      // 팔로우 레코드와 알림을 트랜잭션으로 묶어 일관성 보장
      const followerUser = await prisma.user.findUnique({
        where: { id: followerId },
        select: { nickname: true, name: true },
      });
      const followerName = followerUser?.nickname ?? followerUser?.name ?? "누군가";

      await prisma.$transaction([
        prisma.follows.create({
          data: {
            follower_id: followerId,
            following_id: followingId,
            created_at: new Date(),
          },
        }),
        // 팔로우 대상에게 알림 전송
        prisma.notifications.create({
          data: {
            user_id: followingId,
            notification_type: "follow",
            title: "새 팔로워",
            content: `${followerName}님이 회원님을 팔로우했습니다.`,
            action_url: `/users/${followerId}`,
            action_type: "link",
            status: "unread",
            created_at: new Date(),
            updated_at: new Date(),
          },
        }),
      ]);
      return { followed: true };
    }
  } catch {
    return { followed: false, error: "팔로우 처리 중 오류가 발생했습니다." };
  }
}
