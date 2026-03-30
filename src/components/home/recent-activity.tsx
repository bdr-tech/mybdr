"use client";

/* ============================================================
 * RecentActivity — 홈 페이지 "최근 활동" 섹션
 *
 * /api/web/feed에서 전체 최근 활동 5건을 조회하여 표시.
 * 경기 참가 / 대회 참가 / 커뮤니티 글 작성 3가지 타입.
 * 팔로우 기능이 아직 없으므로 전체 공개 활동을 표시.
 *
 * TossSectionHeader + TossListItem 패턴으로 통일.
 * ============================================================ */

import useSWR from "swr";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { TossListItem } from "@/components/toss/toss-list-item";

/* 피드 아이템 타입 (API 응답과 동일) */
interface FeedItem {
  type: "game_join" | "tournament_join" | "post";
  timestamp: string;
  actor: string;
  title: string;
  href: string;
  icon: string;
}

/* 타입별 한국어 라벨 — 누가 무엇을 했는지 자연어로 표시 */
const TYPE_LABEL: Record<string, string> = {
  game_join: "경기 참가",
  tournament_join: "대회 참가",
  post: "글 작성",
};

/* 상대 시간 표시: "방금 전", "3분 전", "2시간 전", "어제" 등 */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

/* SWR fetcher: JSON 파싱 */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function RecentActivity() {
  /* /api/web/feed에서 최근 활동 조회 */
  const { data, isLoading } = useSWR<FeedItem[]>(
    "/api/web/feed",
    fetcher,
    { revalidateOnFocus: false }
  );

  /* 데이터가 없거나 빈 배열이면 섹션 자체를 숨김 */
  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section>
      <TossSectionHeader title="최근 활동" />

      {/* 로딩 중: 스켈레톤 3개 표시 */}
      {isLoading && (
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3">
              <div className="h-10 w-10 animate-pulse rounded-full" style={{ backgroundColor: "var(--color-surface)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--color-surface)" }} />
                <div className="h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: "var(--color-surface)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 피드 아이템 목록 */}
      {data && data.length > 0 && (
        <div>
          {data.map((item, i) => (
            <TossListItem
              key={`${item.type}-${item.href}-${i}`}
              href={item.href}
              icon={item.icon}
              title={item.title}
              /* "홍길동 · 경기 참가" 형태의 부제목 */
              subtitle={`${item.actor} · ${TYPE_LABEL[item.type] ?? item.type}`}
              /* 우측에 상대 시간 표시 ("3분 전", "2시간 전" 등) */
              rightText={relativeTime(item.timestamp)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
