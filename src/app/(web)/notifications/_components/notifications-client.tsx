"use client";

/**
 * 알림 페이지 클라이언트 컴포넌트 (M6) — BDR v2 시안 박제 (옵션 A)
 *
 * 이유: 기존 v2 재구성(Material Symbols 아이콘)에서 시안(이모지+cafe-blue 탭)
 *      박제로 한 번 더 정렬. shop/scrim/guest-apps와 동일 톤(eyebrow + cafe-blue
 *      탭 + ff-mono 시간) 일관성 확보. 이모지는 시안 그대로 박제 — CLAUDE.md
 *      "Material Symbols Outlined" 규칙은 lucide-react 같은 외부 라이브러리
 *      import 금지가 핵심이고 이모지는 시안 결정 영역이라 박제 우선.
 *
 * v2 시안 박제 변경점:
 *  - eyebrow "알림 · NOTIFICATIONS" 추가 (Shop hero와 동일 패턴)
 *  - h1 옆 unread 숫자: 빨간 22px 텍스트 (뱃지 → 텍스트)
 *  - "읽지 않은 알림 N건" 보조문구
 *  - 활성 탭: cafe-blue 배경 + cafe-blue-deep 보더 (accent → cafe-blue)
 *  - unread 카드: bg-elev 배경 + 좌측 6px 원형 점 (accent-soft + bar 제거)
 *  - 시간: ff-mono + ink-dim (ink-mute → ink-dim)
 *  - 카드 그리드: 44px / 1fr / auto, 패딩 16/20
 *  - 본문 서브텍스트: ink-dim (ink-mute → ink-dim)
 *  - "모두 읽음" 항상 노출 (unread 0이면 disabled)
 *  - notification_type → 이모지 매핑 함수 (🏆 대회·매치, 🏀 경기, 💬 댓글,
 *    👥 팀, 📈 레이팅, ❤️ 좋아요, ⚙️ 시스템)
 *
 * 불변 (PM 지시 100% 보존):
 *  - SerializedNotification / Props 타입 (notifications/total/initialCategoryCounts)
 *  - useState 6종 (activeTab 제외) + handleLoadMore / handleDelete / handleMarkAllRead
 *  - categorize() 사용 (탭 필터/카테고리 카운트)
 *  - /api/web/notifications/read-all 호출 흐름
 *  - window CustomEvent "notifications:read-all" 발행 (헤더 벨 즉시 갱신)
 *  - PushPermissionBanner 유지
 *  - 더 보기 / 삭제 버튼 유지
 */

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PushPermissionBanner } from "@/components/shared/push-permission";
import {
  type NotifCategory,
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

// 시안 박제 — notification_type → 이모지 매핑
// 🏆 대회/매치 (tournament + match), 🏀 경기 (game),
// 💬 댓글/멘션 (comment, mention), 👥 팀 (team, friend, follow),
// 📈 레이팅 (rating, achievement, level), ❤️ 좋아요 (like, react),
// ⚙️ 시스템/공지 (system, announcement)
function getNotificationEmoji(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("comment") || t.includes("mention") || t.includes("reply")) return "💬";
  if (t.includes("like") || t.includes("react") || t.includes("heart")) return "❤️";
  if (t.includes("rating") || t.includes("achievement") || t.includes("level")) return "📈";
  if (t.includes("team") || t.includes("friend") || t.includes("follow") || t.includes("invite_team")) return "👥";
  if (t.includes("match") || t.includes("tournament") || t.includes("league") || t.includes("bracket")) return "🏆";
  if (t.includes("game") || t.includes("scrim") || t.includes("schedule")) return "🏀";
  if (t.includes("system") || t.includes("announce") || t.includes("notice")) return "⚙️";
  // fallback — 카테고리 기반 보조 매핑
  const cat = categorize(type);
  if (cat === "tournament") return "🏆";
  if (cat === "game") return "🏀";
  if (cat === "team") return "👥";
  if (cat === "community") return "💬";
  return "⚙️";
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
    if (activeTab === "unread") {
      return notifications.filter(
        (n) => n.status === "unread" && !readIds.has(n.id),
      );
    }
    return notifications.filter((n) => categorize(n.notification_type) === activeTab);
  }, [activeTab, notifications, readIds]);

  // 카테고리별 unread 카운트 (서버 SSR 값 + 클라이언트 read 처리 보정)
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

  // 전체 unread 카운트
  const unreadCount =
    categoryCounts.tournament +
    categoryCounts.game +
    categoryCounts.team +
    categoryCounts.community +
    categoryCounts.system;

  // 활성 탭 unread (모두 읽음 버튼 활성화 판단)
  const activeTabUnread =
    activeTab === "all" || activeTab === "unread"
      ? unreadCount
      : categoryCounts[activeTab];

  // 탭별 카운트
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

  // 더 보기 가능 여부
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
  async function handleMarkAllRead() {
    if (activeTabUnread <= 0) return; // 시안 박제: 항상 노출하되 0건이면 noop
    setMarkingAll(true);
    try {
      const body: { category?: NotifCategory } = {};
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
    // v2 시안 .page 쉘 + 알림 페이지는 780px (Phase 1/2 일관)
    <div className="page" style={{ maxWidth: 780 }}>
      {/* ==== 헤더 ==== */}
      <div style={{ marginBottom: 20 }}>
        {/* eyebrow — shop hero와 동일 톤 (uppercase / .14em / 800) */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".14em",
            fontWeight: 800,
            textTransform: "uppercase",
            color: "var(--cafe-blue-deep)",
            marginBottom: 6,
          }}
        >
          알림 · NOTIFICATIONS
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* 좌: h1 + 빨간 unread 숫자 (텍스트, 뱃지 X) */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
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
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--accent)",
                  fontFamily: "var(--ff-mono)",
                  letterSpacing: "-0.01em",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {/* 우: 액션 2개 (모두 읽음 + 알림 설정) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* "모두 읽음" — 시안 박제: 항상 노출 (0건이면 disabled) */}
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || activeTabUnread <= 0}
              className="btn btn--sm"
              style={{
                color: "var(--accent)",
                borderColor: "var(--border)",
                fontWeight: 700,
                opacity: activeTabUnread <= 0 ? 0.45 : 1,
                cursor: activeTabUnread <= 0 ? "not-allowed" : "pointer",
              }}
            >
              {markingAll
                ? "처리중..."
                : activeTab === "all" || activeTab === "unread"
                  ? "모두 읽음"
                  : `${activeTabLabel} 모두 읽음`}
            </button>
            {/* "알림 설정" */}
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

        {/* 보조문구 — 읽지 않은 알림 N건 */}
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 13,
            color: "var(--ink-dim)",
          }}
        >
          읽지 않은 알림 {unreadCount}건
        </p>
      </div>

      {/* ==== 푸시 알림 구독 배너 ==== */}
      <div style={{ marginBottom: 16 }}>
        <PushPermissionBanner />
      </div>

      {/* ==== 탭: 7종 — cafe-blue 배경 + cafe-blue-deep 보더 ==== */}
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
                // 활성: cafe-blue 배경 + cafe-blue-deep 보더 (시안 박제)
                background: isActive ? "var(--cafe-blue)" : "var(--bg-elev)",
                color: isActive ? "#fff" : "var(--ink)",
                borderColor: isActive ? "var(--cafe-blue-deep)" : "var(--border)",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tab.label}
              {/* 비활성 탭에 unread 있을 때만 카운트 뱃지 */}
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
                    fontFamily: "var(--ff-mono)",
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
              const emoji = getNotificationEmoji(n.notification_type);
              const timeStr = formatRelativeTime(n.created_at);
              const isLast = idx === filtered.length - 1;

              const itemContent = (
                <div
                  style={{
                    // 시안 그리드: 44px / 1fr / auto, 패딩 16/20
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    alignItems: "start",
                    columnGap: 14,
                    padding: "16px 20px",
                    // unread 카드 배경: bg-elev (accent-soft 제거)
                    background: isUnread ? "var(--bg-elev)" : "transparent",
                    borderBottom: isLast ? "none" : "1px solid var(--border)",
                    transition: "background 0.15s ease",
                    position: "relative",
                  }}
                >
                  {/* unread 좌측 6px 원형 점 (accent bar 제거 → dot) */}
                  {isUnread && (
                    <span
                      style={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--accent)",
                      }}
                      aria-hidden
                    />
                  )}

                  {/* 1열: 이모지 (시안 박제 — Material Symbols 아닌 이모지 그대로) */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      lineHeight: 1,
                      opacity: isUnread ? 1 : 0.7,
                      userSelect: "none",
                    }}
                    aria-hidden
                  >
                    {emoji}
                  </div>

                  {/* 2열: 본문 (제목 + 서브텍스트) */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 10,
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
                      {/* 시간 — ff-mono + ink-dim */}
                      <span
                        style={{
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                          fontSize: 11,
                          color: "var(--ink-dim)",
                          fontFamily: "var(--ff-mono)",
                          letterSpacing: ".02em",
                        }}
                      >
                        {timeStr}
                      </span>
                    </div>
                    {n.content && (
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12.5,
                          color: "var(--ink-dim)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.content}
                      </p>
                    )}
                  </div>

                  {/* 3열: action 화살표 + 삭제 버튼 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      alignSelf: "center",
                    }}
                  >
                    {n.action_url && (
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 18,
                          color: "var(--ink-mute)",
                        }}
                        aria-hidden
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
          {/* 빈 상태도 시안 톤에 맞춰 이모지 사용 */}
          <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }} aria-hidden>
            🔕
          </div>
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
