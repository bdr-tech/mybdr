/**
 * 웹 푸시 알림 서비스 (서버 전용)
 *
 * web-push 라이브러리를 사용해 VAPID 인증 기반으로
 * 유저의 브라우저에 푸시 알림을 전송한다.
 *
 * 주의: 이 파일은 서버(Node.js)에서만 import해야 한다.
 * 클라이언트 컴포넌트에서 import하면 빌드 에러가 발생한다.
 */
import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

// VAPID 키 설정 — 환경변수에서 가져온다
// VAPID lazy init


// web-push에 VAPID 인증 정보 등록
// subject는 푸시 서비스에 문의할 이메일 (필수)
let _vapidReady = false;
function ensureVapid(): boolean {
  if (_vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails("mailto:admin@mybdr.co.kr", pub, priv);
    _vapidReady = true;
    return true;
  } catch {
    return false;
  }
}
/**
 * 특정 유저에게 푸시 알림 전송
 *
 * 유저가 여러 기기/브라우저에서 구독했을 수 있으므로
 * 해당 유저의 모든 구독에 알림을 전송한다.
 *
 * 만료된 구독(410 Gone)은 자동으로 DB에서 삭제한다.
 */
export async function sendPushToUser(
  userId: bigint,
  title: string,
  body: string,
  url?: string
): Promise<void> {
  if (!ensureVapid()) return;
  // 1) 해당 유저의 모든 푸시 구독 조회
  const subscriptions = await prisma.push_subscriptions.findMany({
    where: { user_id: userId },
  });

  if (subscriptions.length === 0) return;

  // 2) 푸시 페이로드 구성 — 서비스워커의 push 이벤트에서 파싱한다
  const payload = JSON.stringify({
    title,
    body,
    url: url ?? "/notifications", // 클릭 시 이동할 경로 (기본: 알림 페이지)
    icon: "/icons/icon-192x192.png",
  });

  // 3) 모든 구독에 병렬 전송, 실패한 구독은 삭제 대상에 모은다
  const expiredIds: bigint[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        // 410 Gone = 구독이 만료됨 → DB에서 삭제
        // 404 Not Found = 엔드포인트가 더 이상 유효하지 않음
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          expiredIds.push(sub.id);
        }
        // 그 외 에러(네트워크 등)는 무시 — 다음번에 다시 시도
      }
    })
  );

  // 4) 만료된 구독 정리
  if (expiredIds.length > 0) {
    await prisma.push_subscriptions.deleteMany({
      where: { id: { in: expiredIds } },
    });
  }
}

/**
 * 여러 유저에게 한번에 푸시 전송 (대량 알림용)
 */
export async function sendPushToUsers(
  userIds: bigint[],
  title: string,
  body: string,
  url?: string
): Promise<void> {
  if (!ensureVapid()) return;
  await Promise.allSettled(
    userIds.map((uid) => sendPushToUser(uid, title, body, url))
  );
}
