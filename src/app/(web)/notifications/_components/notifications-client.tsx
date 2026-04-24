"use client";

/**
 * 알림 페이지 클라이언트 컴포넌트 (M6) — BDR v2 재구성
 *
 * 이유: Phase 1/2와 일관된 `.page` 쉘 + 780px 폭 + v2 tokens 적용. 단
 *      상태/핸들러/fetch 로직은 기존 그대로 보존 (PM 지시: UI만 재구성).
 *
 * v2 변경점:
 * - 탭 7종: 전체 / 안읽음 / 대회 / 경기 / 팀 / 커뮤니티 / 시스템
 * - unread 아이템: 배경 강조 (var(--accent-soft) + 좌측 accent bar)
 * - "알림 설정" 버튼: /profile/notification-settings 로 Link
 * - .page 래퍼 + inline maxWidth 780
 * - Material Symbols Outlined 아이콘 (이모지 금지)
 *
 * 불변:
 * - SerializedNotification / Props 타입
 * - useState 6종 (activeTab 제외) + handleLoadMore / handleDelete / handleMarkAllRead
 * - window CustomEvent "notifications:read-all" 발행 (헤더 벨 즉시 갱신)
 * - PushPermissionBanner 유지
 * - 삭제 버튼 / 더 보기 버튼 유지
 */

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PushPermissionBanner } from "@/components/shared/push-permission";
import {
  type NotifCategory,
  ICON_MAP,
  categorize,
} from "@/lib/notifications/category";

// 직렬화된 알림 타입 (서버에서 전달) — 기존 그대로
interface SerializedNotification {
  id: string;
  title: string;
  content: string | null;
  notification_type: string;
  status: string;
  action_url: string | null;
  created_at: string;
}

// 탭 정의 — 7종 (전체 + 안읽음 + 5카테고리)
// key가 "all"이면 필터 없음, "unread"는 status==="unread"만, 그 외는 NotifCategory
type TabKey = "all" | "unread" | NotifCategory;
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "unread", label: "안읽음" },
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
  // - all: 전체
  // - unread: status==="unread" && readIds에 없는 것만
  // - 그 외: categorize 매칭
  const filtered = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") {
      return notifications.filter(
        (n) => n.status === "unread" && !readIds.has(n.id),
      );
    }
    return notifications.filter((n) => categorize(n.notification_type) === activeTab);
  }, [activeTab, notifications, readIds]);

  // 카테고리별 unread 카운트 (서버 SSR 값 + 클라이언트 read 처리 보정)
  // 이유: SSR 값은 정확하지만 사용자가 페이지에서 "모두 읽음" 누르면 0이 되어야 함
  const categoryCounts = useMemo(() => {
    const counts: Record<NotifCategory, number> = { ...initialCategoryCounts };
    for (const id of readIds) {
      const n = allNotifications.find((x) => x.id === id);
      if (!n) continue;
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
    activeTab === "all" || activeTab === "unread"
      ? unreadCount
      : categoryCounts[activeTab];

  // 탭별 뱃지 카운트
  // - all: 전체 건수 (표시 안함 — unread가 아니라 total이므로 뱃지 없음)
  // - unread: 미확인 총 건수
  // - 각 카테고리: 해당 카테고리 unread
  const tabUnreadCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: 0, // 전체 탭은 뱃지 미표시
      unread: unreadCount,
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

  // 더 보기 — 다음 page fetch 후 append (기존 로직 그대로)
  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/web/notifications?list=true&page=${nextPage}&limit=${PAGE_SIZE}`,
        { credentials: "include" },
      );
      if (!res.ok) return;
      // snake_case 응답 직접 사용 (apiSuccess 자동 변환)
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

  // 개별 알림 삭제 (기존 로직 그대로)
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/web/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDeletedIds((prev) => new Set(prev).add(id));
      }
    } catch {
      /* 실패 시 무시 */
    } finally {
      setDeletingId(null);
    }
  }

  // "모두 읽음" 처리 (기존 로직 그대로)
  // - all/unread 탭: 전체 카테고리 대상
  // - 개별 카테고리 탭: 해당 카테고리만
  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const body: { category?: NotifCategory } = {};
      // "unread" 탭은 전체를 읽음 처리 (전체 대상). 개별 카테고리만 category 전송
      if (activeTab !== "all" && activeTab !== "unread") {
        body.category = activeTab;
      }
      const res = await fetch("/api/web/notifications/read-all", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const targetIds =
          activeTab === "all" || activeTab === "unread"
            ? notifications.map((n) => n.id)
            : notifications
                .filter((n) => categorize(n.notification_type) === activeTab)
                .map((n) => n.id);
        setReadIds((prev) => {
          const next = new Set(prev);
          targetIds.forEach((id) => next.add(id));
          return next;
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("notifications:read-all"));
        }
      }
    } catch {
      // 실패 시 무시
    } finally {
      setMarkingAll(false);
    }
  }

  useEffect(() => {
    /* no-op — 기존 주석 보존 */
  }, []);

  // 활성 탭 라벨 (모두 읽음 버튼 문구용)
  const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label ?? "";

  return (
    // v2 시안 .page 쉘 + 알림 페이지는 780px로 좁힘 (Phase 1/2 일관)
    <div className="page" style={{ maxWidth: 780 }}>
      {/* ==== 헤더: 제목 + unread 배지 + 우측 액션 2개 ==== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
            }}
          >
            알림
          </h1>
          {unreadCount > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 22,
                height: 22,
                padding: "0 7px",
                borderRadius: 999,
                background: "var(--accent)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* "모두 읽음" — 활성 탭에 unread가 있을 때만 */}
          {activeTabUnread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="btn btn--sm"
              style={{
                color: "var(--accent)",
                borderColor: "var(--border)",
                fontWeight: 700,
              }}
            >
              {markingAll
                ? "처리중..."
                : activeTab === "all" || activeTab === "unread"
                  ? "모두 읽음"
                  : `${activeTabLabel} 모두 읽음`}
            </button>
          )}
          {/* "알림 설정" — /profile/notification-settings 로 이동 */}
          <Link
            href="/profile/notification-settings"
            className="btn btn--sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              color: "var(--ink)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              settings
            </span>
            알림 설정
          </Link>
        </div>
      </div>

      {/* ==== 푸시 알림 구독 배너: 권한 요청 + SW 구독 + 서버 저장 ==== */}
      <div style={{ marginBottom: 16 }}>
        <PushPermissionBanner />
      </div>

      {/* ==== 탭: 7종 (전체 / 안읽음 / 대회 / 경기 / 팀 / 커뮤니티 / 시스템) ==== */}
      <div
        className="scrollbar-hide"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          marginBottom: 16,
          paddingBottom: 4,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabUnreadCounts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="btn btn--sm"
              aria-pressed={isActive}
              style={{
                flexShrink: 0,
                background: isActive ? "var(--accent)" : "var(--bg-elev)",
                color: isActive ? "#fff" : "var(--ink)",
                borderColor: isActive ? "var(--accent)" : "var(--border)",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tab.label}
              {/* 뱃지 — 비활성 탭이고 unread > 0 일 때만 */}
              {count > 0 && !isActive && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 16,
                    height: 16,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
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
          <div
            className="card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            {filtered.map((n, idx) => {
              const isUnread = n.status === "unread" && !readIds.has(n.id);
              const { icon, color } = getNotificationIcon(n.notification_type);
              const timeStr = formatRelativeTime(n.created_at);
              const isLast = idx === filtered.length - 1;

              const itemContent = (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 16px",
                    // unread 배경 강조 — accent-soft (라이트 #FDE8E9 / 다크 #2A1214)
                    background: isUnread ? "var(--accent-soft)" : "transparent",
                    // unread 좌측 accent bar (3px)
                    boxShadow: isUnread
                      ? "inset 3px 0 0 var(--accent)"
                      : "none",
                    borderBottom: isLast ? "none" : "1px solid var(--border)",
                    transition: "background 0.15s ease",
                  }}
                >
                  {/* 아이콘 원형 배경 */}
                  <div
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: color,
                      opacity: isUnread ? 1 : 0.55,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 20, color: "#fff" }}
                    >
                      {icon}
                    </span>
                  </div>

                  {/* 본문 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: isUnread ? 700 : 500,
                          color: isUnread ? "var(--ink)" : "var(--ink-dim)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.title}
                      </p>
                      <span
                        style={{
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                          fontSize: 11,
                          color: "var(--ink-mute)",
                        }}
                      >
                        {timeStr}
                      </span>
                    </div>
                    {n.content && (
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: "var(--ink-mute)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.content}
                      </p>
                    )}
                  </div>

                  {/* action_url 화살표 */}
                  {n.action_url && (
                    <span
                      className="material-symbols-outlined"
                      style={{
                        flexShrink: 0,
                        fontSize: 18,
                        alignSelf: "center",
                        color: "var(--ink-mute)",
                      }}
                    >
                      chevron_right
                    </span>
                  )}

                  {/* 삭제 버튼 — 기존 로직 그대로 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    disabled={deletingId === n.id}
                    title="알림 삭제"
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      border: "none",
                      background: "transparent",
                      color: "var(--ink-mute)",
                      cursor: "pointer",
                      alignSelf: "center",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16 }}
                    >
                      {deletingId === n.id ? "hourglass_empty" : "close"}
                    </span>
                  </button>
                </div>
              );

              if (n.action_url) {
                return (
                  <Link
                    key={n.id}
                    href={n.action_url}
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    {itemContent}
                  </Link>
                );
              }
              return <div key={n.id}>{itemContent}</div>;
            })}
          </div>

          {/* ==== 더 보기 — "전체" 탭에서만 노출 (기존 조건 유지) ==== */}
          {hasMore && activeTab === "all" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 12,
              }}
            >
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn"
                style={{ fontWeight: 700 }}
              >
                {loadingMore
                  ? "불러오는 중..."
                  : `더 보기 (남은 ${total - allNotifications.length}건)`}
              </button>
            </div>
          )}
        </>
      ) : (
        /* ==== 빈 상태 ==== */
        <div
          className="card"
          style={{
            padding: "64px 20px",
            textAlign: "center",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 48,
              color: "var(--ink-mute)",
              marginBottom: 12,
              display: "inline-block",
            }}
          >
            notifications_off
          </span>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink-dim)",
            }}
          >
            알림이 없어요
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-mute)" }}>
            {activeTab === "unread"
              ? "미확인 알림이 없습니다"
              : activeTab !== "all"
                ? "이 카테고리에 해당하는 알림이 없습니다"
                : "새로운 소식이 도착하면 여기에 표시됩니다"}
          </p>
        </div>
      )}
    </div>
  );
}
