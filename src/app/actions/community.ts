"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

export async function createPostAction(_prevState: { error: string } | null, formData: FormData) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const category = (formData.get("category") as string) || "general";

  if (!title || !content) {
    return { error: "제목과 내용을 입력하세요." };
  }

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

    redirect(`/community/${post.id.toString()}`);
  } catch {
    return { error: "글 작성 중 오류가 발생했습니다." };
  }
}

export async function createCommentAction(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const session = await getWebSession();
  if (!session) return { error: "로그인이 필요합니다." };

  const postId = formData.get("post_id") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!content) return { error: "댓글 내용을 입력하세요." };

  try {
    await prisma.comments.create({
      data: {
        commentable_type: "CommunityPost",
        commentable_id: BigInt(postId),
        user_id: BigInt(session.sub),
        content,
        status: "published",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 댓글 수 업데이트
    await prisma.community_posts.update({
      where: { id: BigInt(postId) },
      data: { comments_count: { increment: 1 } },
    });

    revalidatePath(`/community/${postId}`);
    return { success: true };
  } catch {
    return { error: "댓글 등록 중 오류가 발생했습니다." };
  }
}
