"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";

// 슈퍼관리자 권한 확인 (기존 admin action 패턴 동일)
async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") throw new Error("권한이 없습니다.");
  return session;
}

/**
 * 게시글 숨김 처리 — status를 "hidden"으로 변경
 * community_posts에 is_hidden 컬럼은 없으므로 status 필드 활용
 */
export async function hidePostAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const postId = formData.get("post_id") as string;
  if (!postId) return;

  const prev = await prisma.community_posts.findUnique({
    where: { id: BigInt(postId) },
    select: { title: true, status: true },
  });

  await prisma.community_posts.update({
    where: { id: BigInt(postId) },
    data: { status: "hidden" },
  });

  await adminLog("community.hide_post", "CommunityPost", {
    resourceId: postId,
    description: `게시글 숨김: ${prev?.title}`,
    previousValues: { status: prev?.status },
    changesMade: { status: "hidden" },
    severity: "warning",
  });

  revalidatePath("/admin/community");
}

/**
 * 게시글 삭제 — DB에서 완전 삭제
 * 좋아요(community_post_likes)는 onDelete: Cascade로 자동 삭제됨
 */
export async function deletePostAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const postId = formData.get("post_id") as string;
  if (!postId) return;

  const prev = await prisma.community_posts.findUnique({
    where: { id: BigInt(postId) },
    select: { title: true, user_id: true },
  });

  await prisma.community_posts.delete({
    where: { id: BigInt(postId) },
  });

  await adminLog("community.delete_post", "CommunityPost", {
    resourceId: postId,
    description: `게시글 삭제: ${prev?.title}`,
    previousValues: { title: prev?.title },
    changesMade: { deleted: true },
    severity: "error",
  });

  revalidatePath("/admin/community");
}

/**
 * 게시글 숨김 해제 — status를 "published"로 복원
 */
export async function unhidePostAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const postId = formData.get("post_id") as string;
  if (!postId) return;

  await prisma.community_posts.update({
    where: { id: BigInt(postId) },
    data: { status: "published" },
  });

  await adminLog("community.unhide_post", "CommunityPost", {
    resourceId: postId,
    description: `게시글 숨김 해제`,
    changesMade: { status: "published" },
    severity: "info",
  });

  revalidatePath("/admin/community");
}
