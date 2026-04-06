"use client";

import Link from "next/link";
import useSWR from "swr";
import { SidebarAd } from "@/components/ads/ad-card";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { TossListItem } from "@/components/toss/toss-list-item";

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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
           <div className="h-4 w-24 mb-4 bg-[var(--color-surface)]" />
           <div className="space-y-2">
              <div className="h-12 w-full bg-[var(--color-surface)]" />
              <div className="h-12 w-full bg-[var(--color-surface)]" />
           </div>
        </div>
      ))}
    </div>
  );
}

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
    <div className="mb-8">
      <TossSectionHeader title={title} actionHref={moreHref} />
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function RightSidebar() {
  const { data, isLoading, error } = useSWR<SidebarData>(
    "/api/web/sidebar",
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: false, shouldRetryOnError: false }
  );

  if (error) return null;
  if (isLoading || !data) return <SidebarSkeleton />;

  return (
    <div className="space-y-6">
      {/* 1. BDR 랭킹 TOP 5 */}
      {data.rankings.length > 0 && (
        <Widget title="BDR 랭킹" moreHref="/rankings">
          {data.rankings.map((user) => (
             <TossListItem
                key={user.id}
                href={`/profile/${user.id}`}
                title={user.nickname}
                subtitle={`Lv.${user.level} · ${user.xp.toLocaleString()} XP`}
                rightText={`#${user.rank}`}
                iconBg={user.rank <= 3 ? "var(--color-primary)" : "var(--color-surface-bright)"}
                icon="person"
             />
          ))}
        </Widget>
      )}

      {/* 2. 주목할 팀 TOP 3 */}
      {data.teams.length > 0 && (
        <Widget title="주목할 팀" moreHref="/teams">
          {data.teams.map((team) => (
            <TossListItem
               key={team.id}
               href={`/teams/${team.id}`}
               title={team.name}
               subtitle={`승률 ${team.winRate}% · ${team.wins}W ${team.losses}L`}
               iconBg="var(--color-primary)"
               icon="groups"
            />
          ))}
        </Widget>
      )}

      <SidebarAd />

      {/* 3. 인기 코트 */}
      <Widget title="인기 코트" moreHref="/courts">
        {data.courts.length === 0 ? (
          <p className="py-4 text-center text-xs font-bold text-[var(--color-text-muted)]">
            아직 데이터가 부족합니다
          </p>
        ) : (
          data.courts.map((court) => (
            <TossListItem
               key={court.id}
               href={`/courts/${court.id}`}
               title={court.name}
               subtitle={`${court.district || court.city || "위치 미상"} · 체크인 ${court.checkinCount}`}
               rightText={`#${court.rank}`}
               iconBg="var(--color-info)"
               icon="location_on"
            />
          ))
        )}
      </Widget>

      {/* 4. 최근 활동 */}
      <Widget title="최근 활동">
        {data.activities.length === 0 ? (
          <p className="py-4 text-center text-xs font-bold text-[var(--color-text-muted)]">
            아직 활동이 없어요!
          </p>
        ) : (
          data.activities.map((act) => (
            <TossListItem
               key={act.id}
               href={`/profile/${act.userId}`}
               title={act.nickname}
               subtitle={`${act.courtName} 체크인`}
               rightText={timeAgo(act.checkedInAt)}
               iconBg="var(--color-text-muted)"
               icon="bolt"
               showArrow={false}
            />
          ))
        )}
      </Widget>
    </div>
  );
}
