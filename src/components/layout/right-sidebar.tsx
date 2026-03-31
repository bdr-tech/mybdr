"use client";

import Link from "next/link";
import useSWR from "swr";
import { SidebarAd } from "@/components/ads/ad-card";

/* ============================================================
 * RightSidebar — PC 우측 사이드바 (xl 이상에서만 표시)
 * 4개 위젯: BDR 랭킹, 주목할 팀, 인기 코트, 최근 활동
 * useSWR로 /api/web/sidebar 호출, 5분 리프레시
 * ============================================================ */

// API 응답 타입 정의
interface SidebarData {
  rankings: {
    rank: number;
    id: string;
    nickname: string;
    xp: number;
    level: number;
  }[];
  teams: {
    id: string;
    name: string;
    logoUrl: string | null;
    city: string | null;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    membersCount: number;
  }[];
  courts: {
    rank: number;
    id: string;
    name: string;
    city: string;
    district: string;
    checkinCount: number;
  }[];
  activities: {
    id: string;
    userId: string;
    nickname: string;
    courtId: string;
    courtName: string;
    checkedInAt: string;
  }[];
}

// SWR fetcher — JSON 파싱
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 상대 시간 표시 — "방금 전", "N분 전", "N시간 전", "N일 전"
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// 스켈레톤 로딩 UI — 위젯 3개 표시
function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          {/* 제목 스켈레톤 */}
          <div
            className="mb-3 h-4 w-24 animate-pulse rounded"
            style={{ backgroundColor: "var(--color-surface)" }}
          />
          {/* 아이템 스켈레톤 3줄 */}
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex items-center gap-3 py-2">
              <div
                className="h-8 w-8 animate-pulse rounded-full"
                style={{ backgroundColor: "var(--color-surface)" }}
              />
              <div className="flex-1 space-y-1">
                <div
                  className="h-3 w-20 animate-pulse rounded"
                  style={{ backgroundColor: "var(--color-surface)" }}
                />
                <div
                  className="h-2.5 w-14 animate-pulse rounded"
                  style={{ backgroundColor: "var(--color-surface)" }}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// 위젯 공통 래퍼 — 카드 스타일 + 제목 + "더보기" 링크
function Widget({
  title,
  moreHref,
  children,
}: {
  title: string;
  moreHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* 위젯 헤더: 제목 + 더보기 링크 */}
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-sm font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h3>
        {moreHref && (
          <Link
            href={moreHref}
            className="text-xs transition-colors hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            더보기 &gt;
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

export function RightSidebar() {
  // 5분(300초) 간격으로 리프레시, 에러 시 재시도 안 함
  const { data, isLoading, error } = useSWR<SidebarData>(
    "/api/web/sidebar",
    fetcher,
    {
      refreshInterval: 300_000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // 에러 시 조용히 숨김 — 사이드바는 보조 콘텐츠
  if (error) return null;

  // 로딩 중 스켈레톤 표시
  if (isLoading || !data) return <SidebarSkeleton />;

  return (
    <div
      className="space-y-4"
    >
      {/* ======== 1. BDR 랭킹 TOP 5 ======== */}
      {data.rankings.length > 0 && (
        <Widget title="BDR 랭킹" moreHref="/rankings">
          <ul>
            {data.rankings.map((user, i) => (
              <li
                key={user.id}
                className={i < data.rankings.length - 1 ? "border-b" : ""}
                style={{ borderColor: "var(--color-border)" }}
              >
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-3 py-2 transition-colors hover:bg-[var(--color-surface)]"
                >
                  {/* 순위 번호: 1~3위 강조 */}
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor:
                        user.rank <= 3
                          ? "var(--color-primary)"
                          : "var(--color-surface)",
                      color:
                        user.rank <= 3
                          ? "white"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {user.rank}
                  </span>
                  {/* 닉네임 + 레벨/XP */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {user.nickname}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Lv.{user.level} &middot; {user.xp.toLocaleString()} XP
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>
      )}

      {/* ======== 2. 주목할 팀 TOP 3 ======== */}
      {data.teams.length > 0 && (
        <Widget title="주목할 팀" moreHref="/teams">
          <ul>
            {data.teams.map((team, i) => (
              <li
                key={team.id}
                className={i < data.teams.length - 1 ? "border-b" : ""}
                style={{ borderColor: "var(--color-border)" }}
              >
                <Link
                  href={`/teams/${team.id}`}
                  className="flex items-center gap-3 py-2 transition-colors hover:bg-[var(--color-surface)]"
                >
                  {/* 팀 이니셜 원형 아바타 (로고 없으면 이니셜) */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {team.name.slice(0, 2)}
                  </div>
                  {/* 팀명 + 승률/전적 */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {team.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      승률 {team.winRate}% &middot; {team.wins}승{" "}
                      {team.losses}패
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>
      )}

      {/* ======== 사이드바 광고 — 주목할 팀과 인기 코트 사이에 배치, 광고 없으면 숨김 ======== */}
      <SidebarAd />

      {/* ======== 3. 인기 코트 TOP 5 ======== */}
      <Widget title="인기 코트" moreHref="/courts">
        {data.courts.length === 0 ? (
          <p className="py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="material-symbols-outlined text-2xl block mb-1" style={{ color: "var(--color-text-disabled)" }}>location_on</span>
            체크인 데이터가 쌓이면 인기 코트가 표시돼요
          </p>
        ) : (
          <ul>
            {data.courts.map((court, i) => (
              <li
                key={court.id}
                className={i < data.courts.length - 1 ? "border-b" : ""}
                style={{ borderColor: "var(--color-border)" }}
              >
                <Link
                  href={`/courts/${court.id}`}
                  className="flex items-center gap-3 py-2 transition-colors hover:bg-[var(--color-surface)]"
                >
                  {/* 순위 번호 */}
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor:
                        court.rank <= 3
                          ? "var(--color-info)"
                          : "var(--color-surface)",
                      color:
                        court.rank <= 3
                          ? "white"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {court.rank}
                  </span>
                  {/* 코트명 + 지역 + 체크인 횟수 */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {court.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {court.district || court.city || "위치 미상"} &middot;
                      체크인 {court.checkinCount}회
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Widget>

      {/* ======== 4. 최근 활동 ======== */}
      <Widget title="최근 활동">
        {data.activities.length === 0 ? (
          <p className="py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="material-symbols-outlined text-2xl block mb-1" style={{ color: "var(--color-text-disabled)" }}>bolt</span>
            아직 활동이 없어요. 코트에서 체크인해보세요!
          </p>
        ) : (
          <ul>
            {data.activities.map((act, i) => (
              <li
                key={act.id}
                className={i < data.activities.length - 1 ? "border-b" : ""}
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start gap-3 py-2">
                  {/* 유저 이니셜 아바타 */}
                  <Link href={`/profile/${act.userId}`}>
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: "var(--color-text-muted)" }}
                    >
                      {act.nickname.slice(0, 1)}
                    </div>
                  </Link>
                  {/* 활동 내용: "닉네임이 코트명에 체크인" + 시간 */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <Link
                        href={`/profile/${act.userId}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {act.nickname}
                      </Link>
                      님이{" "}
                      <Link
                        href={`/courts/${act.courtId}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {act.courtName}
                      </Link>
                      에 체크인
                    </p>
                    <p
                      className="mt-0.5 text-[10px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {timeAgo(act.checkedInAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Widget>
    </div>
  );
}
