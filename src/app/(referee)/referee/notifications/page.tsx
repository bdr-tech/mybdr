"use client";

/**
 * 알림 전체 목록 페이지 — /referee/notifications
 *
 * 이유: 벨 드롭다운은 최근 10건까지만 보여주므로, 과거 알림까지 훑어볼 수 있는
 *      전용 페이지가 필요하다. 필터(전체/안읽음) + 페이지네이션 + 전체 읽음 버튼.
 *
 * 재사용: /api/web/notifications?list=true + /api/web/notifications/read-all +
 *        /api/web/notifications/[id]/read
 *
 * 디자인: var(--color-*) + border-radius 4px + Material Symbols + 반응형
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Notification = {
  id: string;
  notification_type: string;
  title: string;
  content: string | null;
  action_url: string | null;
  status: "unread" | "read" | string;
  read_at: string | null;
  created_at: string;
};

type ListResponse = {
  items: Notification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
};

// 목록에서 타입별 아이콘 — bell과 동일 로직을 공유하되 간단히 인라인 복제
// (별도 유틸 파일로 뺄 수도 있지만, 파일 하나 줄이기 위해 여기에 유지)
function iconForType(type: string): string {
  if (type.startsWith("referee.pool.chief")) return "star";
  if (type.startsWith("referee.pool.selected")) return "how_to_vote";
  if (type.startsWith("referee.assignment")) return "sports_basketball";
  if (type.startsWith("referee.settlement")) return "payments";
  if (type.startsWith("referee.announcement")) return "campaign";
  if (type.startsWith("tournament")) return "emoji_events";
  if (type.startsWith("game")) return "sports";
  if (type.startsWith("team")) return "group";
  return "notifications";
}

// 상대 시간 (bell과 동일 규약)
function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return iso.slice(0, 10);
}

const LIMIT = 20;

export default function NotificationsPage() {
  // 탭: 전체 / 안읽음
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 목록 fetch
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        list: "true",
        page: String(page),
        limit: String(LIMIT),
      });
      if (tab === "unread") params.set("unread_only", "true");
      const res = await fetch(`/api/web/notifications?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();
      // ⚠️ apiSuccess는 `{ data: ... }` 래핑 없이 최상위에 직접 직렬화한다
      //    (errors.md 6회차 가드: `json?.data` 접근은 항상 undefined로 사일런트 실패)
      if (json && Array.isArray(json.items)) {
        setData({
          items: json.items.map((i: Notification) => ({ ...i, id: String(i.id) })),
          total: Number(json.total ?? 0),
          unread_count: Number(json.unread_count ?? 0),
          page: Number(json.page ?? page),
          limit: Number(json.limit ?? LIMIT),
        });
      }
    } catch {
      // 실패 조용히 — 재시도 버튼 대신 탭 전환 유도
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  // 탭 변경 시 페이지 1로 리셋
  const changeTab = (next: "all" | "unread") => {
    setTab(next);
    setPage(1);
  };

  // 단건 읽음 + optimistic
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/web/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((n) =>
                n.id === id
                  ? { ...n, status: "read", read_at: new Date().toISOString() }
                  : n
              ),
              unread_count: Math.max(0, prev.unread_count - 1),
            }
          : prev
      );
    } catch {
      // 무시
    }
  };

  // 전체 읽음
  const markAllRead = async () => {
    try {
      await fetch("/api/web/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      // 서버에서 동기화되지만 즉시 반영이 UX 좋음 → 재조회
      load();
    } catch {
      // 무시
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-4">
      {/* 상단 타이틀 + 전체 읽음 */}
      <div className="flex items-center justify-between">
        <h1
          className="text-xl font-black uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          알림
        </h1>
        <button
          type="button"
          onClick={markAllRead}
          disabled={!data || data.unread_count === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
            borderRadius: 4,
          }}
        >
          <span className="material-symbols-outlined text-sm">done_all</span>
          전체 읽음
        </button>
      </div>

      {/* 탭 */}
      <div
        className="flex gap-1 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        {(
          [
            { key: "all", label: "전체" },
            { key: "unread", label: "안 읽음" },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => changeTab(t.key)}
              className="px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                color: active
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
                borderBottom: active
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              }}
            >
              {t.label}
              {t.key === "unread" && data && data.unread_count > 0 && (
                <span
                  className="ml-1 text-[11px]"
                  style={{ color: "var(--color-primary)" }}
                >
                  ({data.unread_count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 목록 */}
      <div
        className="overflow-hidden border"
        style={{
          borderColor: "var(--color-border)",
          borderRadius: 4,
          backgroundColor: "var(--color-background)",
        }}
      >
        {loading && !data && (
          <div
            className="px-4 py-12 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            불러오는 중...
          </div>
        )}
        {data && data.items.length === 0 && !loading && (
          <div
            className="px-4 py-12 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            {tab === "unread" ? "안 읽은 알림이 없습니다." : "알림이 없습니다."}
          </div>
        )}
        {data &&
          data.items.map((n) => {
            const isUnread = n.status === "unread";
            const href = n.action_url || "#";
            return (
              <Link
                key={n.id}
                href={href}
                onClick={() => {
                  if (isUnread) markAsRead(n.id);
                }}
                className="block border-b px-4 py-3 transition-colors hover:opacity-90 last:border-b-0"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: isUnread
                    ? "color-mix(in srgb, var(--color-primary) 6%, transparent)"
                    : "transparent",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="material-symbols-outlined text-xl mt-0.5"
                    style={{
                      color: isUnread
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {iconForType(n.notification_type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {n.title}
                      </span>
                      <span
                        className="shrink-0 text-[11px]"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {formatRelative(n.created_at)}
                      </span>
                    </div>
                    {n.content && (
                      <div
                        className="mt-1 text-[13px] leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {n.content}
                      </div>
                    )}
                  </div>
                  {isUnread && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
      </div>

      {/* 페이지네이션 */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            총 {data.total}건
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                borderRadius: 4,
              }}
            >
              <span className="material-symbols-outlined text-base">
                chevron_left
              </span>
            </button>
            <span
              className="px-2 text-xs font-semibold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                borderRadius: 4,
              }}
            >
              <span className="material-symbols-outlined text-base">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
