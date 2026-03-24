import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const notifications = await prisma.notifications.findMany({
    where: { user_id: BigInt(session.sub) },
    orderBy: { created_at: "desc" },
    take: 30,
  }).catch(() => []);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>알림</h1>
        {unreadCount > 0 && (
          <Badge>{unreadCount}개 안읽음</Badge>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id.toString()}
              className={`rounded-[16px] border border-[var(--color-border)] overflow-hidden transition-colors ${n.status === "unread" ? "border-l-2 border-l-[var(--color-accent)]" : "opacity-70"}`}
            >
              {n.action_url ? (
                <Link href={n.action_url} className="block">
                  <NotificationItem n={n} />
                </Link>
              ) : (
                <NotificationItem n={n} />
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-[var(--color-text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
          새로운 알림이 없습니다.
        </Card>
      )}
    </div>
  );
}

function NotificationItem({ n }: { n: { title: string; content: string | null; created_at: Date; notification_type: string } }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm">{n.title}</p>
        <span className="whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
          {n.created_at.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
        </span>
      </div>
      {n.content && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{n.content}</p>}
    </div>
  );
}
