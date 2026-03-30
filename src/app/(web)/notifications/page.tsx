import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./_components/notifications-client";

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

export default async function NotificationsPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  // 서버에서 알림 목록 조회 (기존 쿼리 유지)
  const notifications = await prisma.notifications
    .findMany({
      where: { user_id: BigInt(session.sub) },
      orderBy: { created_at: "desc" },
      take: 50,
    })
    .catch(() => []);

  // BigInt, Date를 직렬화 가능한 형태로 변환
  const serialized: SerializedNotification[] = notifications.map((n) => ({
    id: n.id.toString(),
    title: n.title,
    content: n.content,
    notification_type: n.notification_type,
    status: n.status ?? "unread",
    action_url: n.action_url,
    created_at: n.created_at?.toISOString() ?? new Date().toISOString(),
  }));

  return <NotificationsClient notifications={serialized} />;
}
