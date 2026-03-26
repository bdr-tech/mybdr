import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

// VAPID 설정 (서버 사이드 전용)
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    "mailto:bdr.wonyoung@gmail.com",
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
}

/**
 * 특정 유저에게 Web Push 발송
 * push_subscription이 없거나 발송 실패 시 silent fail
 */
export async function sendPushToUser(
  userId: bigint,
  payload: PushPayload
): Promise<void> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { push_subscription: true },
    });

    if (!user?.push_subscription) return;

    const subscription = user.push_subscription as unknown as webpush.PushSubscription;

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body ?? "",
        url: payload.url ?? "/notifications",
        icon: payload.icon ?? "/icons/icon-192x192.png",
      })
    );
  } catch (error: unknown) {
    // 구독 만료(410 Gone) 시 자동 정리
    if (error && typeof error === "object" && "statusCode" in error) {
      const statusCode = (error as { statusCode: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await prisma.user.update({
          where: { id: userId },
          data: { push_subscription: Prisma.JsonNull },
        }).catch(() => {});
      }
    }
  }
}

/**
 * 여러 유저에게 Web Push 벌크 발송
 */
export async function sendPushBulk(
  userIds: bigint[],
  payload: PushPayload
): Promise<void> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE || userIds.length === 0) return;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, push_subscription: { not: Prisma.JsonNull } },
    select: { id: true, push_subscription: true },
  });

  await Promise.allSettled(
    users.map((user) =>
      sendPushToUser(user.id, payload)
    )
  );
}
