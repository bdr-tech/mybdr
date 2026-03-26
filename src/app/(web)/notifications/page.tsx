"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  content: string | null;
  type: string;
  status: string;
  actionUrl: string | null;
  createdAt: string | null;
  readAt: string | null;
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function getIcon(type: string) {
  if (type.startsWith("game.")) return "sports_basketball";
  if (type.startsWith("team.")) return "groups";
  if (type.startsWith("tournament.")) return "emoji_events";
  return "notifications";
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/web/notifications?list=true", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        return;
      }
      const data = await res.json();
      setNotifications(data.data?.notifications ?? []);
      setUnreadCount(data.data?.unreadCount ?? 0);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const markAsRead = async (notif: Notification) => {
    if (notif.status === "unread") {
      // 낙관적 업데이트
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, status: "read" } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      fetch("/api/web/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: notif.id }),
      }).catch(() => {});
    }

    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
    setUnreadCount(0);

    fetch("/api/web/notifications", {
      method: "PATCH",
      credentials: "include",
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-32 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-elevated)" }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-elevated)" }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1
            className="text-xl font-extrabold uppercase tracking-wide sm:text-2xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            알림
          </h1>
          {unreadCount > 0 && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-medium transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            모두 읽음
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markAsRead(n)}
              className="w-full text-left rounded-xl border p-4 transition-all"
              style={{
                backgroundColor: n.status === "unread" ? "var(--color-card)" : "transparent",
                borderColor: n.status === "unread" ? "var(--color-border)" : "var(--color-border-subtle)",
                opacity: n.status === "unread" ? 1 : 0.6,
              }}
            >
              <div className="flex gap-3">
                <span
                  className="material-symbols-outlined mt-0.5 shrink-0 text-xl"
                  style={{
                    color: n.status === "unread" ? "var(--color-primary)" : "var(--color-text-muted)",
                    fontVariationSettings: n.status === "unread" ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {getIcon(n.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  {n.content && (
                    <p className="mt-1 text-xs whitespace-pre-line" style={{ color: "var(--color-text-secondary)" }}>
                      {n.content}
                    </p>
                  )}
                </div>
                {n.status === "unread" && (
                  <span
                    className="mt-2 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border py-16 text-center"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <span className="material-symbols-outlined mb-2 text-4xl" style={{ color: "var(--color-text-secondary)" }}>
            notifications_none
          </span>
          <p className="text-sm">새로운 알림이 없습니다</p>
        </div>
      )}
    </div>
  );
}
