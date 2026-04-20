"use client";

/**
 * 알림 벨 — referee 플랫폼 전용 헤더 컴포넌트.
 *
 * 이유: 심판들이 공고/선정/배정/정산 이벤트를 실시간에 가깝게 확인할 수 있어야 한다.
 *      기존 (web) 레이아웃의 알림 UI는 의존성이 많아 referee 셸에 바로 붙이기 어렵다.
 *      여기서는 가벼운 드롭다운 + 30초 폴링으로 독립 운영.
 *
 * 기능:
 * - Material Symbols notifications 아이콘 + 안 읽은 수 뱃지 (9+ 형태)
 * - 클릭 시 드롭다운 열림 → 최근 10건 표시
 * - 항목 클릭 → action_url 이동 + 자동 읽음
 * - 전체 읽음 버튼 / 전체 보기 링크
 * - ESC / 외부 클릭 닫기
 * - 30초마다 /api/web/notifications?list=true 재조회
 *
 * 디자인: var(--color-*) CSS 변수 + border-radius 4px + Material Symbols 준수
 */

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

// 알림 단건 타입 — API 응답과 1:1 매핑
type Notification = {
  id: string; // BigInt를 JSON 직렬화할 때 string으로 오는 경우 대비
  notification_type: string;
  title: string;
  content: string | null;
  action_url: string | null;
  status: "unread" | "read" | string;
  read_at: string | null;
  created_at: string;
};

// 상대 시간 포맷 — "방금 / N분 전 / N시간 전 / N일 전 / 날짜"
// 이유: 드롭다운에서 초단위 시간을 보여주면 부산하므로 사람이 읽기 쉬운 축약형 사용
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
  // 일주일 이상은 날짜 YYYY-MM-DD
  return iso.slice(0, 10);
}

// 알림 타입별 아이콘 매핑 — 시각적 구분
// 이유: 한 줄짜리 알림 목록에서 타입별 색/아이콘이 있어야 훑어보기 좋음
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

export function NotificationBell() {
  // 드롭다운 open 상태
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // /api/web/notifications?list=true 호출 — 최근 10건 + unread_count
  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/web/notifications?list=true&limit=10", {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      // ⚠️ apiSuccess는 `{ data: ... }` 래핑 없이 최상위에 직접 직렬화한다
      //    (src/lib/api/response.ts — NextResponse.json(convertKeysToSnakeCase(data)))
      //    => 응답 = { items, total, unread_count, category_counts, page, limit }
      //    (errors.md 6회차 가드: `json?.data` 접근은 항상 undefined로 사일런트 실패)
      if (!json) return;
      setItems(
        Array.isArray(json.items)
          ? json.items.map((i: Notification) => ({
              ...i,
              id: String(i.id), // bigint-safe string
            }))
          : []
      );
      setUnreadCount(Number(json.unread_count ?? 0));
    } catch {
      // 네트워크 에러는 조용히 무시 — 다음 폴링에서 재시도
    } finally {
      setLoading(false);
    }
  }, []);

  // 마운트 시 1회 + 30초 폴링
  useEffect(() => {
    fetchList();
    const id = setInterval(fetchList, 30_000);
    return () => clearInterval(id);
  }, [fetchList]);

  // ESC / 외부 클릭으로 닫기
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // 드롭다운 열릴 때 최신 데이터로 갱신
  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchList();
  };

  // 단건 읽음 처리 (클릭 시) + action_url 이동은 Link가 담당
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/web/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      // optimistic update — 로컬 상태 갱신
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: "read", read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // 실패해도 이동은 진행 — 다음 폴링에서 상태 맞춰짐
    }
  };

  // 전체 읽음
  const markAllRead = async () => {
    try {
      await fetch("/api/web/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          status: "read",
          read_at: n.read_at ?? new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch {
      // 조용히 실패 — 사용자에게 에러 표시까지는 과함
    }
  };

  // 뱃지 표시용 숫자 포맷 (10 이상은 9+)
  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={wrapperRef} className="relative">
      {/* 벨 버튼 */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="알림"
        className="relative flex h-9 w-9 items-center justify-center"
        style={{
          color: "var(--color-text-muted)",
          borderRadius: 4,
        }}
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {/* 빨간 원 뱃지 — unread_count > 0일 때만 */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center px-1 text-[10px] font-black"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              borderRadius: 9999,
              lineHeight: 1,
            }}
          >
            {badge}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div
          // 모바일에서는 화면 전체 너비에 가깝게, 데스크톱에서는 360px
          className="absolute right-0 top-11 z-[60] w-80 overflow-hidden border shadow-xl sm:w-96"
          style={{
            backgroundColor: "var(--color-background)",
            borderColor: "var(--color-border)",
            borderRadius: 4,
          }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-black uppercase tracking-wider"
                style={{ color: "var(--color-text-primary)" }}
              >
                알림
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  {unreadCount}건 안 읽음
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-[11px] font-semibold disabled:opacity-40"
              style={{ color: "var(--color-text-muted)" }}
            >
              전체 읽음
            </button>
          </div>

          {/* 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && (
              <div
                className="px-4 py-8 text-center text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                불러오는 중...
              </div>
            )}
            {!loading && items.length === 0 && (
              <div
                className="px-4 py-8 text-center text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                알림이 없습니다.
              </div>
            )}
            {items.map((n) => {
              const isUnread = n.status === "unread";
              const href = n.action_url || "#";
              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => {
                    if (isUnread) markAsRead(n.id);
                    setOpen(false);
                  }}
                  className="block border-b px-4 py-3 transition-colors hover:opacity-90"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: isUnread
                      ? "color-mix(in srgb, var(--color-primary) 6%, transparent)"
                      : "transparent",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* 좌측 아이콘 */}
                    <span
                      className="material-symbols-outlined text-lg mt-0.5"
                      style={{
                        color: isUnread
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {iconForType(n.notification_type)}
                    </span>
                    {/* 본문 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="truncate text-[13px] font-bold"
                          style={{
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {n.title}
                        </span>
                        <span
                          className="shrink-0 text-[10px]"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {formatRelative(n.created_at)}
                        </span>
                      </div>
                      {n.content && (
                        <div
                          className="mt-1 line-clamp-2 text-[12px] leading-snug"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {n.content}
                        </div>
                      )}
                    </div>
                    {/* 안 읽음 점 */}
                    {isUnread && (
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 푸터: 전체 보기 */}
          <div
            className="border-t px-4 py-2"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Link
              href="/referee/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-[12px] font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              전체 알림 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
