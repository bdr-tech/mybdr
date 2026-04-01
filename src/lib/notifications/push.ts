import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails("mailto:bdr.wonyoung@gmail.com", pub, priv);
    vapidConfigured = true;
    return true;
  } catch {
    return false;
  }
}

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
}

/**
 * 특정 유저에게 Web Push 발송
 * push_subscriptions 테이블에서 구독 정보 조회
 */
export async function sendPushToUser(
  userId: bigint,
  payload: PushPayload
): Promise<boolean> {
  if (!ensureVapid()) return false;

  try {
    const subscriptions = await prisma.push_subscriptions.findMany({
      where: { user_id: userId },
    });

    if (subscriptions.length === 0) return false;

    let sent = false;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body ?? "",
            url: payload.url ?? "/notifications",
            icon: payload.icon ?? "/icon.png",
          })
        );
        sent = true;
      } catch (error: unknown) {
        // 410 Gone = 구독 만료 → DB에서 제거
        if (error && typeof error === "object" && "statusCode" in error && (error as { statusCode: number }).statusCode === 410) {
          await prisma.push_subscriptions.delete({
            where: { id: sub.id },
          }).catch(() => {});
        }
      }
    }

    return sent;
  } catch {
    return false;
  }
}

/**
 * 여러 유저에게 Push 발송 (병렬, 개별 실패 무시)
 */
export async function sendPushToUsers(
  userIds: bigint[],
  payload: PushPayload
): Promise<number> {
  if (!ensureVapid() || userIds.length === 0) return 0;

  const results = await Promise.allSettled(
    userIds.map((uid) => sendPushToUser(uid, payload))
  );

  return results.filter(
    (r) => r.status === "fulfilled" && r.value === true
  ).length;
}
