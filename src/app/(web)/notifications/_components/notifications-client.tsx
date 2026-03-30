"use client";

/**
 * 알림 페이지 클라이언트 컴포넌트
 *
 * 토스 스타일:
 * - pill 탭으로 유형별 필터링 (전체/경기/팀/대회/시스템)
 * - 읽지 않은 알림: 좌측 파란 점 + 배경색 차이
 * - "모두 읽음" 버튼 (기존 PATCH API 활용)
 * - 빈 상태: 종 아이콘 + 안내 문구
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";

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

// 탭 정의: notification_type 접두사로 분류
const TABS = [
  { key: "all", label: "전체", prefix: null },
  { key: "game", label: "경기", prefix: "game." },
  { key: "team", label: "팀", prefix: "team." },
  { key: "tournament", label: "대회", prefix: "tournament." },
  { key: "system", label: "시스템", prefix: "system." },
] as const;

// notification_type에 맞는 Material 아이콘 매핑
function getNotificationIcon(type: string): { icon: string; color: string } {
  if (type.startsWith("game.")) return { icon: "sports_basketball", color: "var(--color-accent)" };
  if (type.startsWith("team.")) return { icon: "groups", color: "var(--color-info)" };
  if (type.startsWith("tournament.")) return { icon: "emoji_events", color: "var(--color-primary)" };
  return { icon: "notifications", color: "var(--color-text-secondary)" };
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
  // 7일 이상이면 날짜 표시
  return new Date(isoDate).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

interface Props {
  notifications: SerializedNotification[];
}

export function NotificationsClient({ notifications }: Props) {
  // 현재 선택된 탭
  const [activeTab, setActiveTab] = useState("all");
  // 읽음 처리 후 로컬 상태 관리 (서버 새로고침 없이 즉시 반영)
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  // "모두 읽음" 처리 중 로딩
  const [markingAll, setMarkingAll] = useState(false);

  // 탭별 필터링된 알림 목록
  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab || !tab.prefix) return notifications;
    return notifications.filter((n) => n.notification_type.startsWith(tab.prefix!));
  }, [activeTab, notifications]);

  // 읽지 않은 알림 수 (전체 기준)
  const unreadCount = notifications.filter(
    (n) => n.status === "unread" && !readIds.has(n.id)
  ).length;

  // 탭별 읽지 않은 수 (배지에 표시)
  const tabUnreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of TABS) {
      if (!tab.prefix) {
        counts[tab.key] = notifications.filter(
          (n) => n.status === "unread" && !readIds.has(n.id)
        ).length;
      } else {
        counts[tab.key] = notifications.filter(
          (n) =>
            n.notification_type.startsWith(tab.prefix!) &&
            n.status === "unread" &&
            !readIds.has(n.id)
        ).length;
      }
    }
    return counts;
  }, [notifications, readIds]);

  // "모두 읽음" 처리: 기존 PATCH /api/web/notifications API 호출
  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/web/notifications", { method: "PATCH", credentials: "include" });
      // 모든 알림을 로컬에서 읽음 처리
      setReadIds(new Set(notifications.map((n) => n.id)));
    } catch {
      // 실패 시 무시 (다음 새로고침에서 반영)
    } finally {
      setMarkingAll(false);
    }
  }

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
              className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {/* 모두 읽음 버튼: 읽지 않은 알림이 있을 때만 표시 */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ color: "var(--color-primary)" }}
          >
            {markingAll ? "처리중..." : "모두 읽음"}
          </button>
        )}
      </div>

      {/* ==== pill 탭: 유형별 필터 ==== */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabUnreadCounts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all"
              style={{
                backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface)",
                color: isActive ? "#FFFFFF" : "var(--color-text-secondary)",
              }}
            >
              {tab.label}
              {/* 읽지 않은 수가 있으면 작은 배지 표시 */}
              {count > 0 && !isActive && (
                <span
                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
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
                    <span className="h-2 w-2" /> // 빈 공간 (정렬 유지)
                  )}
                </div>

                {/* 아이콘 */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: color, opacity: isUnread ? 1 : 0.6 }}
                >
                  <span className="material-symbols-outlined text-xl text-white">
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
              </div>
            );

            // action_url이 있으면 Link로 래핑
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
