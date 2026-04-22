"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
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
    // public_id로 게시글 찾기 (알림용으로 user_id, title도 조회)
    const post = await prisma.community_posts.findUnique({
      where: { public_id: postPublicId },
      select: { id: true, likes_count: true, user_id: true, title: true },
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
      // 본인 글이 아닌 경우에만 알림도 함께 생성
      const isOwnPost = post.user_id === userId;
      // 세 가지 Prisma delegate의 create/update 반환 타입이 다르므로
      // 트랜잭션 배열의 공통 타입으로 PrismaPromise<unknown>[] 사용
      const txOps: Prisma.PrismaPromise<unknown>[] = [
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
      ];

      // 본인 글에 좋아요 시 알림 생략
      if (!isOwnPost) {
        const likerUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { nickname: true, name: true },
        });
        const likerName = likerUser?.nickname ?? likerUser?.name ?? "누군가";
        const postTitle = post.title && post.title.length > 20
          ? post.title.slice(0, 20) + "..."
          : (post.title ?? "게시글");

        txOps.push(
          prisma.notifications.create({
            data: {
              user_id: post.user_id,
              notification_type: "like",
              title: "게시글 좋아요",
              content: `${likerName}님이 "${postTitle}" 글을 좋아합니다.`,
              action_url: `/community/${postPublicId}`,
              action_type: "link",
              status: "unread",
              created_at: new Date(),
              updated_at: new Date(),
            },
          })
        );
      }

      await prisma.$transaction(txOps);

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
  // 이미지 URL 배열 파싱 (JSON 문자열로 전달됨, 없으면 빈 배열)
  const imagesRaw = formData.get("images") as string;
  let images: string[] = [];
  try {
    const parsed = JSON.parse(imagesRaw || "[]");
    if (Array.isArray(parsed)) images = parsed.filter((u: unknown) => typeof u === "string" && (u as string).startsWith("http"));
  } catch { /* 파싱 실패 시 빈 배열 유지 */ }

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
        // 이미지가 있을 때만 JSON으로 저장
        ...(images.length > 0 && { images }),
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

/**
 * updatePostAction - 게시글 수정
 *
 * 본인 게시글만 수정 가능 (session.sub === post.user_id)
 * useActionState 패턴에 맞춰 prevState + formData 시그니처 사용
 */
export async function updatePostAction(_prevState: { error?: string } | null, formData: FormData) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const publicId = formData.get("public_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const category = (formData.get("category") as string) || "general";

  if (!title || !content) {
    return { error: "제목과 내용을 입력하세요." };
  }

  try {
    // public_id로 게시글 조회 + 소유자 확인
    const post = await prisma.community_posts.findUnique({
      where: { public_id: publicId },
      select: { id: true, user_id: true },
    });
    if (!post) return { error: "게시글을 찾을 수 없습니다." };

    // 본인 확인: session.sub(문자열)과 post.user_id(BigInt) 비교
    if (post.user_id !== BigInt(session.sub)) {
      return { error: "본인의 글만 수정할 수 있습니다." };
    }

    await prisma.community_posts.update({
      where: { id: post.id },
      data: { title, content, category, updated_at: new Date() },
    });
  } catch {
    return { error: "글 수정 중 오류가 발생했습니다." };
  }

  // 수정 후 상세 페이지로 리다이렉트
  revalidatePath(`/community/${publicId}`);
  redirect(`/community/${publicId}`);
}

/**
 * deletePostAction - 게시글 삭제
 *
 * 본인 게시글만 삭제 가능. soft delete 대신 status를 "deleted"로 변경.
 * 실제 데이터는 남겨두되 목록/상세에서 필터링.
 */
export async function deletePostAction(publicId: string): Promise<{ error?: string; success?: boolean }> {
  const session = await getWebSession();
  if (!session) return { error: "로그인이 필요합니다." };

  try {
    const post = await prisma.community_posts.findUnique({
      where: { public_id: publicId },
      select: { id: true, user_id: true },
    });
    if (!post) return { error: "게시글을 찾을 수 없습니다." };

    // 본인 확인
    if (post.user_id !== BigInt(session.sub)) {
      return { error: "본인의 글만 삭제할 수 있습니다." };
    }

    // soft delete: status를 "deleted"로 변경
    await prisma.community_posts.update({
      where: { id: post.id },
      data: { status: "deleted", updated_at: new Date() },
    });

    revalidatePath("/community");
    return { success: true };
  } catch {
    return { error: "글 삭제 중 오류가 발생했습니다." };
  }
}

/**
 * updateCommentAction - 댓글 수정
 *
 * 본인 댓글만 수정 가능. 인라인 편집에서 사용.
 */
export async function updateCommentAction(
  commentId: string,
  content: string,
  postPublicId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getWebSession();
  if (!session) return { error: "로그인이 필요합니다." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "댓글 내용을 입력하세요." };

  try {
    const comment = await prisma.comments.findUnique({
      where: { id: BigInt(commentId) },
      select: { id: true, user_id: true },
    });
    if (!comment) return { error: "댓글을 찾을 수 없습니다." };

    // 본인 확인
    if (comment.user_id !== BigInt(session.sub)) {
      return { error: "본인의 댓글만 수정할 수 있습니다." };
    }

    await prisma.comments.update({
      where: { id: comment.id },
      data: { content: trimmed, updated_at: new Date() },
    });

    revalidatePath(`/community/${postPublicId}`);
    return { success: true };
  } catch {
    return { error: "댓글 수정 중 오류가 발생했습니다." };
  }
}

/**
 * deleteCommentAction - 댓글 삭제
 *
 * 본인 댓글만 삭제 가능. soft delete (status → "deleted").
 * comments_count 카운터도 1 감소.
 */
export async function deleteCommentAction(
  commentId: string,
  postPublicId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getWebSession();
  if (!session) return { error: "로그인이 필요합니다." };

  try {
    const comment = await prisma.comments.findUnique({
      where: { id: BigInt(commentId) },
      select: { id: true, user_id: true, commentable_id: true },
    });
    if (!comment) return { error: "댓글을 찾을 수 없습니다." };

    // 본인 확인
    if (comment.user_id !== BigInt(session.sub)) {
      return { error: "본인의 댓글만 삭제할 수 있습니다." };
    }

    // 트랜잭션: 댓글 soft delete + 게시글 댓글 수 감소
    await prisma.$transaction([
      prisma.comments.update({
        where: { id: comment.id },
        data: { status: "deleted", updated_at: new Date() },
      }),
      prisma.community_posts.update({
        where: { id: comment.commentable_id },
        data: { comments_count: { decrement: 1 } },
      }),
    ]);

    revalidatePath(`/community/${postPublicId}`);
    return { success: true };
  } catch {
    return { error: "댓글 삭제 중 오류가 발생했습니다." };
  }
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

/**
 * toggleCommentLikeAction - 댓글 좋아요 토글 (추가/취소)
 *
 * 게시글 좋아요와 동일한 패턴: comment_likes 테이블 + likes_count 카운터 캐시
 * 본인 댓글에도 좋아요 가능 (알림은 생략)
 */
export async function toggleCommentLikeAction(
  commentId: string,
  postPublicId: string,
): Promise<{ liked: boolean; count: number; error?: string }> {
  const session = await getWebSession();
  if (!session) {
    return { liked: false, count: 0, error: "로그인이 필요합니다." };
  }

  try {
    const comment = await prisma.comments.findUnique({
      where: { id: BigInt(commentId) },
      select: { id: true, likes_count: true, user_id: true },
    });
    if (!comment) {
      return { liked: false, count: 0, error: "댓글을 찾을 수 없습니다." };
    }

    const userId = BigInt(session.sub);

    // 기존 좋아요 확인
    const existing = await prisma.comment_likes.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: comment.id,
          user_id: userId,
        },
      },
    });

    if (existing) {
      // 이미 좋아요 -> 취소
      await prisma.$transaction([
        prisma.comment_likes.delete({ where: { id: existing.id } }),
        prisma.comments.update({
          where: { id: comment.id },
          data: { likes_count: { decrement: 1 } },
        }),
      ]);
      revalidatePath(`/community/${postPublicId}`);
      return { liked: false, count: Math.max(0, comment.likes_count - 1) };
    } else {
      // 좋아요 추가
      await prisma.$transaction([
        prisma.comment_likes.create({
          data: {
            comment_id: comment.id,
            user_id: userId,
            created_at: new Date(),
          },
        }),
        prisma.comments.update({
          where: { id: comment.id },
          data: { likes_count: { increment: 1 } },
        }),
      ]);
      revalidatePath(`/community/${postPublicId}`);
      return { liked: true, count: comment.likes_count + 1 };
    }
  } catch {
    return { liked: false, count: 0, error: "좋아요 처리 중 오류가 발생했습니다." };
  }
}
