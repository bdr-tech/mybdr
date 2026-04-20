import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./_components/notifications-client";
import {
  type NotifCategory,
  categorize,
} from "@/lib/notifications/category";

// SEO: 알림 페이지 메타데이터
export const metadata: Metadata = {
  title: "알림 | MyBDR",
  description: "경기 초대, 팀 소식, 대회 알림을 확인하세요.",
};

export const dynamic = "force-dynamic";

// 알림 데이터를 직렬화 가능한 형태로 변환하는 인터페이스
interface SerializedNotification {
  id: string;
  title: string;
  content: string | null;
  notification_type: string;
  status: string;
  action_url: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

export default async function NotificationsPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  // 3쿼리 병렬: 알림 목록 50건 + 전체 건수 + 카테고리별 unread groupBy
  // 인덱스(user_id+created_at, user_id+status, user_id+notification_type) 모두 활용
  const [notifications, total, unreadByType] = await Promise.all([
    prisma.notifications
      .findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: PAGE_SIZE,
      })
      .catch(() => []),
    prisma.notifications.count({ where: { user_id: userId } }).catch(() => 0),
    // 카테고리 unread 집계용 — type별 count 후 server에서 카테고리로 합산
    prisma.notifications
      .groupBy({
        by: ["notification_type"],
        where: { user_id: userId, status: "unread" },
        _count: { _all: true },
      })
      .catch(
        () =>
          [] as Array<{
            notification_type: string;
            _count: { _all: number };
          }>,
      ),
  ]);

  // BigInt, Date 직렬화
  const serialized: SerializedNotification[] = notifications.map((n) => ({
    id: n.id.toString(),
    title: n.title,
    content: n.content,
    notification_type: n.notification_type,
    status: n.status ?? "unread",
    action_url: n.action_url,
    created_at: n.created_at?.toISOString() ?? new Date().toISOString(),
  }));

  // type별 unread → 카테고리별 합산 (initialCategoryCounts)
  const initialCategoryCounts: Record<NotifCategory, number> = {
    tournament: 0,
    game: 0,
    team: 0,
    community: 0,
    system: 0,
  };
  for (const row of unreadByType) {
    const cat = categorize(row.notification_type);
    initialCategoryCounts[cat] += row._count._all;
  }

  return (
    <NotificationsClient
      notifications={serialized}
      total={total}
      initialCategoryCounts={initialCategoryCounts}
    />
  );
}
