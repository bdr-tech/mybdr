"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

/**
 * toggleLikeAction - 게시글 좋아요 토글 (추가/취소)
 *
 * 로그인 유저만 사용 가능. 이미 좋아요한 상태면 취소, 아니면 추가.
 * likes_count 카운터 캐시를 함께 업데이트하여 매번 count 쿼리를 피함.
 */
export async function toggleLikeAction(postPublicId: string): Promise<{ liked: boolean; count: number; error?: string }> {
  // 인증 확인: 비로그인이면 에러 반환
  const session = await getWebSession();
  if (!session) {
    return { liked: false, count: 0, error: "로그인이 필요합니다." };
  }

  try {
    // public_id로 게시글 찾기
    const post = await prisma.community_posts.findUnique({
      where: { public_id: postPublicId },
      select: { id: true, likes_count: true },
    });
    if (!post) {
      return { liked: false, count: 0, error: "게시글을 찾을 수 없습니다." };
    }

    const userId = BigInt(session.sub);

    // 기존 좋아요 여부 확인 (@@unique 인덱스 활용)
    const existingLike = await prisma.community_post_likes.findUnique({
      where: {
        community_post_id_user_id: {
          community_post_id: post.id,
          user_id: userId,
        },
      },
    });

    if (existingLike) {
      // 이미 좋아요한 상태 -> 취소 (삭제 + 카운트 -1)
      await prisma.$transaction([
        prisma.community_post_likes.delete({
          where: { id: existingLike.id },
        }),
        prisma.community_posts.update({
          where: { id: post.id },
          data: { likes_count: { decrement: 1 } },
        }),
      ]);

      revalidatePath(`/community/${postPublicId}`);
      return { liked: false, count: Math.max(0, post.likes_count - 1) };
    } else {
      // 좋아요 안 한 상태 -> 추가 (생성 + 카운트 +1)
      await prisma.$transaction([
        prisma.community_post_likes.create({
          data: {
            community_post_id: post.id,
            user_id: userId,
            created_at: new Date(),
          },
        }),
        prisma.community_posts.update({
          where: { id: post.id },
          data: { likes_count: { increment: 1 } },
        }),
      ]);

      revalidatePath(`/community/${postPublicId}`);
      return { liked: true, count: post.likes_count + 1 };
    }
  } catch {
    return { liked: false, count: 0, error: "좋아요 처리 중 오류가 발생했습니다." };
  }
}

export async function createPostAction(_prevState: { error: string } | null, formData: FormData) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const category = (formData.get("category") as string) || "general";

  if (!title || !content) {
    return { error: "제목과 내용을 입력하세요." };
  }

  let publicId: string;
  try {
    const post = await prisma.community_posts.create({
      data: {
        user_id: BigInt(session.sub),
        title,
        content,
        category,
        status: "published",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    publicId = post.public_id;
  } catch {
    return { error: "글 작성 중 오류가 발생했습니다." };
  }

  redirect(`/community/${publicId}`);
}

export async function createCommentAction(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const session = await getWebSession();
  if (!session) return { error: "로그인이 필요합니다." };

  const publicId = formData.get("post_id") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!content) return { error: "댓글 내용을 입력하세요." };

  try {
    const post = await prisma.community_posts.findUnique({
      where: { public_id: publicId },
      select: { id: true },
    });
    if (!post) return { error: "게시글을 찾을 수 없습니다." };

    await prisma.comments.create({
      data: {
        commentable_type: "CommunityPost",
        commentable_id: post.id,
        user_id: BigInt(session.sub),
        content,
        status: "published",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 댓글 수 업데이트
    await prisma.community_posts.update({
      where: { id: post.id },
      data: { comments_count: { increment: 1 } },
    });

    revalidatePath(`/community/${publicId}`);
    return { success: true };
  } catch {
    return { error: "댓글 등록 중 오류가 발생했습니다." };
  }
}
