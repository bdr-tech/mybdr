"use client";

/**
 * 알림 페이지 클라이언트 컴포넌트 (M6)
 *
 * 토스 스타일:
 * - pill 탭 6종 (전체/대회/경기/팀/커뮤니티/시스템) — 카테고리별 분류
 * - 읽지 않은 알림: 좌측 파란 점 + 굵은 텍스트
 * - "모두 읽음" 버튼 — 활성 카테고리에만 적용 (전체 탭이면 모든 카테고리)
 * - "더 보기" 버튼 — 50건씩 추가 로드 (서버에서 처음 50건 SSR + 추가는 fetch)
 * - 빈 상태: 종 아이콘 + 안내 문구
 * - mark-all-read 성공 시 헤더 벨 뱃지 즉시 갱신을 위해 window CustomEvent 발행
 */

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";
// 푸시 알림 구독 배너 — 권한 요청 + 서비스워커 구독 + 서버 저장까지 처리하는 완전한 구현
import { PushPermissionBanner } from "@/components/shared/push-permission";
import {
  type NotifCategory,
  ICON_MAP,
  categorize,
} from "@/lib/notifications/category";

// 직렬화된 알림 타입 (서버에서 전달)
interface SerializedNotification {
  id: string;
  title: string;
  content: string | null;
  notification_type: string;
  status: string;
  action_url: string | null;
  created_at: string;
}

// 탭 정의 — 6종 (전체 + 5카테고리)
// key가 "all"이면 필터 없음, 그 외는 NotifCategory enum 값
type TabKey = "all" | NotifCategory;
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "tournament", label: "대회" },
  { key: "game", label: "경기" },
  { key: "team", label: "팀" },
  { key: "community", label: "커뮤니티" },
  { key: "system", label: "시스템" },
];

// notification_type → 아이콘 (카테고리 기반 매핑 재사용)
function getNotificationIcon(type: string): { icon: string; color: string } {
  const cat = categorize(type);
  return ICON_MAP[cat];
}

// 상대 시간 표시 (예: "3분 전", "2시간 전", "어제")
function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(isoDate).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

interface Props {
  notifications: SerializedNotification[];
  // SSR에서 계산된 전체 건수 (더 보기 가능 여부 판단용)
  total: number;
  // SSR에서 계산된 카테고리별 unread (탭 뱃지 초기값)
  initialCategoryCounts: Record<NotifCategory, number>;
}

const PAGE_SIZE = 50; // 첫 SSR 50건 + "더 보기" 1회당 50건 추가

export function NotificationsClient({
  notifications: initialNotifications,
  total,
  initialCategoryCounts,
}: Props) {
  // 현재 선택된 탭
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  // 누적 알림 (SSR 50건 + 더 보기로 append)
  const [allNotifications, setAllNotifications] =
    useState<SerializedNotification[]>(initialNotifications);
  // 다음 페이지 (1: 50건 SSR 끝, 다음 fetch는 page=2부터)
  const [page, setPage] = useState(1);
  // 더 보기 fetch 진행중
  const [loadingMore, setLoadingMore] = useState(false);
  // 읽음 처리 후 로컬 상태 관리 (서버 새로고침 없이 즉시 반영)
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  // 삭제된 알림 ID (삭제 시 즉시 UI에서 제거)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  // "모두 읽음" 처리 중 로딩
  const [markingAll, setMarkingAll] = useState(false);
  // 삭제 중인 알림 ID
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 삭제된 알림을 제외한 목록
  const notifications = allNotifications.filter((n) => !deletedIds.has(n.id));

  // 탭별 필터링된 알림 목록
  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => categorize(n.notification_type) === activeTab);
  }, [activeTab, notifications]);

  // 카테고리별 unread 카운트 (서버 SSR 값 + 클라이언트 read 처리 보정)
  // 이유: SSR 값은 정확하지만 사용자가 페이지에서 "모두 읽음" 누르면 0이 되어야 함
  const categoryCounts = useMemo(() => {
    const counts: Record<NotifCategory, number> = { ...initialCategoryCounts };
    // 클라가 읽음 처리한 항목은 카테고리별로 차감
    for (const id of readIds) {
      const n = allNotifications.find((x) => x.id === id);
      if (!n) continue;
      // SSR 시점에 이미 unread였던 항목만 차감 대상
      if (n.status !== "unread") continue;
      const cat = categorize(n.notification_type);
      counts[cat] = Math.max(0, counts[cat] - 1);
    }
    return counts;
  }, [initialCategoryCounts, readIds, allNotifications]);

  // 전체 unread 카운트 (헤더 옆 빨간 뱃지)
  const unreadCount =
    categoryCounts.tournament +
    categoryCounts.game +
    categoryCounts.team +
    categoryCounts.community +
    categoryCounts.system;

  // 활성 탭 unread (모두 읽음 버튼 노출 판단)
  const activeTabUnread =
    activeTab === "all" ? unreadCount : categoryCounts[activeTab];

  // 탭별 뱃지 카운트 (전체 탭은 unreadCount, 그 외는 categoryCounts[key])
  const tabUnreadCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: unreadCount,
      tournament: categoryCounts.tournament,
      game: categoryCounts.game,
      team: categoryCounts.team,
      community: categoryCounts.community,
      system: categoryCounts.system,
    };
    return counts;
  }, [unreadCount, categoryCounts]);

  // 더 보기 가능 여부 (서버 total > 현재 누적 건수)
  const hasMore = allNotifications.length < total;

  // 더 보기 — 다음 page fetch 후 append
  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/web/notifications?list=true&page=${nextPage}&limit=${PAGE_SIZE}`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      // ⚠️ snake_case 응답 직접 사용 (apiSuccess 자동 변환). data.items / data.total 등
      const data = (await res.json()) as {
        items: Array<{
          id: string | number;
          title: string;
          content: string | null;
          notification_type: string;
          status: string | null;
          action_url: string | null;
          created_at: string;
        }>;
      };
      // BigInt id가 string으로 변환되어 옴 (case.ts L8 처리)
      const newItems: SerializedNotification[] = data.items.map((n) => ({
        id: String(n.id),
        title: n.title,
        content: n.content,
        notification_type: n.notification_type,
        status: n.status ?? "unread",
        action_url: n.action_url,
        created_at: n.created_at,
      }));
      setAllNotifications((prev) => [...prev, ...newItems]);
      setPage(nextPage);
    } catch {
      // 실패 시 무시
    } finally {
      setLoadingMore(false);
    }
  }

  // 개별 알림 삭제: DELETE /api/web/notifications/[id]
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/web/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        // 즉시 UI에서 제거
        setDeletedIds((prev) => new Set(prev).add(id));
      }
    } catch {
      /* 실패 시 무시 */
    } finally {
      setDeletingId(null);
    }
  }

  // "모두 읽음" 처리 — 활성 카테고리에만 적용 (전체 탭이면 전체)
  // 새 read-all API 사용 (body.category 지원)
  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const body: { category?: NotifCategory } = {};
      if (activeTab !== "all") body.category = activeTab;
      const res = await fetch("/api/web/notifications/read-all", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // 활성 카테고리에 해당하는 알림을 로컬에서 읽음 처리
        const targetIds = activeTab === "all"
          ? notifications.map((n) => n.id)
          : notifications
              .filter((n) => categorize(n.notification_type) === activeTab)
              .map((n) => n.id);
        setReadIds((prev) => {
          const next = new Set(prev);
          targetIds.forEach((id) => next.add(id));
          return next;
        });
        // 헤더 벨 뱃지 즉시 갱신 — layout.tsx의 polling useEffect 가 listen
        // 같은 탭 내에서만 동작 (다른 탭은 30초 폴링이 처리)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("notifications:read-all"));
        }
      }
    } catch {
      // 실패 시 무시 (다음 새로고침에서 반영)
    } finally {
      setMarkingAll(false);
    }
  }

  // 페이지 첫 마운트 시에도 헤더 벨 갱신 시그널 전송 (page 진입만으로는 폴링 30초 대기 → 즉시 갱신 유도)
  // ※ 이는 read-all과 별개. 사용자가 알림 페이지에 들어왔다는 사실 자체는 unreadCount 변화 없음.
  // (의도적으로 dispatch 안 함 — read-all을 누르기 전에는 read 상태 변화 없으므로)
  useEffect(() => {
    /* no-op — 의도적으로 비워둠 (read 변화 없을 때 이벤트 발행은 부적절) */
  }, []);

  return (
    <div className="max-w-[640px] mx-auto space-y-6">
      {/* ==== 헤더: 제목 + 읽지 않은 수 + 모두 읽음 ==== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-extrabold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            알림
          </h1>
          {unreadCount > 0 && (
            <span
              className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold text-[var(--color-on-primary)]"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {/* 모두 읽음 버튼 — 활성 탭에 unread가 있을 때만 표시 */}
        {activeTabUnread > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ color: "var(--color-primary)" }}
          >
            {markingAll
              ? "처리중..."
              : activeTab === "all"
                ? "모두 읽음"
                : `${TABS.find((t) => t.key === activeTab)?.label} 모두 읽음`}
          </button>
        )}
      </div>

      {/* ==== 푸시 알림 구독 배너: 권한 요청 + SW 구독 + 서버 저장 ==== */}
      <PushPermissionBanner />

      {/* ==== pill 탭: 6카테고리 ==== */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabUnreadCounts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all"
              style={{
                backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface)",
                color: isActive ? "var(--color-on-primary)" : "var(--color-text-secondary)",
              }}
            >
              {tab.label}
              {/* 읽지 않은 수가 있으면 작은 배지 표시 */}
              {count > 0 && !isActive && (
                <span
                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-[var(--color-on-primary)]"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==== 알림 목록 ==== */}
      {filtered.length > 0 ? (
        <>
          <TossCard className="p-0">
            {filtered.map((n) => {
              const isUnread = n.status === "unread" && !readIds.has(n.id);
              const { icon, color } = getNotificationIcon(n.notification_type);
              const timeStr = formatRelativeTime(n.created_at);

              const itemContent = (
                <div
                  className="flex items-start gap-3 px-5 py-4 border-b transition-colors hover:bg-[var(--color-surface-bright)]"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  {/* 좌: 읽지 않은 알림 파란 점 */}
                  <div className="flex flex-col items-center pt-1">
                    {isUnread ? (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: "var(--color-info)" }}
                      />
                    ) : (
                      <span className="h-2 w-2" />
                    )}
                  </div>

                  {/* 아이콘 */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: color, opacity: isUnread ? 1 : 0.6 }}
                  >
                    <span className="material-symbols-outlined text-xl text-[var(--color-on-primary)]">
                      {icon}
                    </span>
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm truncate ${isUnread ? "font-bold" : "font-medium"}`}
                        style={{ color: isUnread ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
                      >
                        {n.title}
                      </p>
                      <span
                        className="whitespace-nowrap text-[11px] shrink-0"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {timeStr}
                      </span>
                    </div>
                    {n.content && (
                      <p
                        className="mt-0.5 text-xs truncate"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {n.content}
                      </p>
                    )}
                  </div>

                  {/* 링크가 있으면 화살표 */}
                  {n.action_url && (
                    <span className="material-symbols-outlined text-lg shrink-0 self-center text-[var(--color-text-disabled)]">
                      chevron_right
                    </span>
                  )}

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    disabled={deletingId === n.id}
                    className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full self-center transition-colors hover:bg-[var(--color-surface)]"
                    style={{ color: "var(--color-text-muted)" }}
                    title="알림 삭제"
                  >
                    <span className="material-symbols-outlined text-base">
                      {deletingId === n.id ? "hourglass_empty" : "close"}
                    </span>
                  </button>
                </div>
              );

              if (n.action_url) {
                return (
                  <Link key={n.id} href={n.action_url} className="block">
                    {itemContent}
                  </Link>
                );
              }
              return <div key={n.id}>{itemContent}</div>;
            })}
          </TossCard>

          {/* ==== 더 보기 버튼 ==== */}
          {hasMore && activeTab === "all" && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded px-5 py-2.5 text-xs font-bold transition-all hover:opacity-80 disabled:opacity-40"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {loadingMore
                  ? "불러오는 중..."
                  : `더 보기 (남은 ${total - allNotifications.length}건)`}
              </button>
            </div>
          )}
        </>
      ) : (
        /* ==== 빈 상태: 종 아이콘 + 안내 ==== */
        <TossCard className="py-16 text-center">
          <span
            className="material-symbols-outlined text-5xl mb-4 block"
            style={{ color: "var(--color-text-disabled)" }}
          >
            notifications_off
          </span>
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            알림이 없어요
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {activeTab !== "all"
              ? "이 카테고리에 해당하는 알림이 없습니다"
              : "새로운 소식이 도착하면 여기에 표시됩니다"}
          </p>
        </TossCard>
      )}
    </div>
  );
}
