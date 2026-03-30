"use client";

/* ============================================================
 * MySummaryHero - 로그인 사용자 맞춤 요약 카드 슬라이드
 *
 * 로그인 상태에서 홈 상단에 표시되는 4장의 가로 스크롤 카드:
 * [내 팀] [다가오는 경기] [내 기록] [다음 대회]
 *
 * 각 카드는 데이터가 없을 때 CTA 버튼으로 전환된다.
 * /api/web/profile과 /api/web/profile/stats에서 데이터를 가져온다.
 * useSWR을 사용하여 프로필 페이지와 캐시를 공유한다.
 * ============================================================ */

import useSWR from "swr";
import Link from "next/link";

// 프로필 API 응답 타입
interface ProfileData {
  user: {
    name: string;
    nickname?: string;
  };
  teams: { id: string; name: string; role: string }[];
  recentGames: {
    id: string;
    title: string | null;
    scheduled_at: string | null;
    status: number;
  }[];
  tournaments: {
    id: string;
    name: string;
    status: string | null;
  }[];
}

// 스탯 API 응답 타입
interface StatsData {
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number;
  ppg: number;
  rpg: number;
  apg: number;
}

// 각 카드에서 사용하는 공통 아이콘+숫자 표시용 헬퍼 컴포넌트
function StatLine({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="material-symbols-outlined text-base"
        style={{ color: "var(--color-text-muted)" }}
      >
        {icon}
      </span>
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span
        className="ml-auto text-sm font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

// 데이터가 없을 때 보여주는 CTA 카드
function EmptyCard({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div
      className="flex min-w-[240px] snap-start flex-col justify-between rounded-2xl border p-5"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* 상단: 아이콘 + 제목 */}
      <div>
        <span
          className="material-symbols-outlined mb-3 block text-3xl"
          style={{ color: "var(--color-text-muted)" }}
        >
          {icon}
        </span>
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {description}
        </p>
      </div>

      {/* 하단: CTA 버튼 */}
      <Link
        href={ctaHref}
        className="mt-4 block rounded-lg py-2.5 text-center text-sm font-bold text-white transition-all active:scale-[0.97]"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export function MySummaryHero() {
  // 프로필 데이터: 팀, 경기, 대회 정보
  const { data: profileData, isLoading: profileLoading } = useSWR<ProfileData>(
    "/api/web/profile",
    { dedupingInterval: 30000 }
  );

  // 스탯 데이터: 총 경기수, 승률, PPG 등
  const { data: statsData, isLoading: statsLoading } = useSWR<StatsData>(
    "/api/web/profile/stats",
    { dedupingInterval: 30000 }
  );

  const isLoading = profileLoading || statsLoading;

  // 로딩 중: 스켈레톤 카드 4장
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[240px] snap-start rounded-2xl border p-5 animate-pulse"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="mb-3 h-8 w-8 rounded-lg"
              style={{ backgroundColor: "var(--color-surface)" }}
            />
            <div
              className="mb-2 h-4 w-24 rounded"
              style={{ backgroundColor: "var(--color-surface)" }}
            />
            <div
              className="h-3 w-32 rounded"
              style={{ backgroundColor: "var(--color-surface)" }}
            />
          </div>
        ))}
      </div>
    );
  }

  // 데이터 추출
  const teams = profileData?.teams ?? [];
  const recentGames = profileData?.recentGames ?? [];
  const tournaments = profileData?.tournaments ?? [];

  // 다가오는 경기: scheduled_at이 미래인 것 중 가장 가까운 것
  const now = new Date();
  const upcomingGame = recentGames
    .filter((g) => g.scheduled_at && new Date(g.scheduled_at) > now)
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
    )[0];

  // 다음 대회: 진행 중이거나 예정인 대회 중 첫 번째
  const nextTournament = tournaments.find(
    (t) => t.status === "upcoming" || t.status === "in_progress" || t.status === "open"
  ) ?? tournaments[0];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">

      {/* 카드 1: 내 팀 */}
      {teams.length > 0 ? (
        <Link
          href={`/teams/${teams[0].id}`}
          className="flex min-w-[240px] snap-start flex-col rounded-2xl border p-5 transition-all hover:shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="material-symbols-outlined mb-3 text-3xl"
            style={{ color: "var(--color-primary)", fontVariationSettings: "'FILL' 1" }}
          >
            groups
          </span>
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            {teams[0].name}
          </p>
          <div className="space-y-2">
            <StatLine icon="badge" label="역할" value={teams[0].role === "leader" ? "리더" : "멤버"} />
            <StatLine icon="group" label="소속 팀" value={`${teams.length}개`} />
          </div>
        </Link>
      ) : (
        <EmptyCard
          icon="groups"
          title="아직 소속 팀이 없어요"
          description="팀에 가입하고 함께 경기해보세요"
          ctaLabel="팀 가입하기"
          ctaHref="/teams"
        />
      )}

      {/* 카드 2: 다가오는 경기 */}
      {upcomingGame ? (
        <Link
          href={`/games/${upcomingGame.id}`}
          className="flex min-w-[240px] snap-start flex-col rounded-2xl border p-5 transition-all hover:shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="material-symbols-outlined mb-3 text-3xl"
            style={{ color: "var(--color-info)", fontVariationSettings: "'FILL' 1" }}
          >
            sports_basketball
          </span>
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            다가오는 경기
          </p>
          <div className="space-y-2">
            <StatLine
              icon="event"
              label="날짜"
              value={new Date(upcomingGame.scheduled_at!).toLocaleDateString("ko-KR", {
                month: "short",
                day: "numeric",
                weekday: "short",
              })}
            />
            <p
              className="text-xs truncate"
              style={{ color: "var(--color-text-muted)" }}
            >
              {upcomingGame.title ?? "경기"}
            </p>
          </div>
        </Link>
      ) : (
        <EmptyCard
          icon="sports_basketball"
          title="예정된 경기가 없어요"
          description="새로운 경기를 찾아보세요"
          ctaLabel="경기 찾기"
          ctaHref="/games"
        />
      )}

      {/* 카드 3: 내 기록 */}
      {statsData && statsData.total_games > 0 ? (
        <Link
          href="/profile"
          className="flex min-w-[240px] snap-start flex-col rounded-2xl border p-5 transition-all hover:shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="material-symbols-outlined mb-3 text-3xl"
            style={{ color: "var(--color-success)", fontVariationSettings: "'FILL' 1" }}
          >
            monitoring
          </span>
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            내 기록
          </p>
          <div className="space-y-2">
            <StatLine icon="sports_score" label="경기" value={`${statsData.total_games}경기`} />
            <StatLine icon="trending_up" label="승률" value={`${Math.round(statsData.win_rate)}%`} />
            <StatLine icon="star" label="PPG" value={statsData.ppg?.toFixed(1) ?? "0.0"} />
          </div>
        </Link>
      ) : (
        <EmptyCard
          icon="monitoring"
          title="아직 기록이 없어요"
          description="첫 경기에 참여해보세요"
          ctaLabel="첫 경기 참여하기"
          ctaHref="/games"
        />
      )}

      {/* 카드 4: 다음 대회 */}
      {nextTournament ? (
        <Link
          href={`/tournaments/${nextTournament.id}`}
          className="flex min-w-[240px] snap-start flex-col rounded-2xl border p-5 transition-all hover:shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="material-symbols-outlined mb-3 text-3xl"
            style={{ color: "var(--color-warning)", fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            참가 대회
          </p>
          <div className="space-y-2">
            <p
              className="text-xs font-medium truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {nextTournament.name}
            </p>
            <StatLine
              icon="info"
              label="상태"
              value={
                nextTournament.status === "in_progress"
                  ? "진행 중"
                  : nextTournament.status === "upcoming" || nextTournament.status === "open"
                  ? "예정"
                  : "완료"
              }
            />
          </div>
        </Link>
      ) : (
        <EmptyCard
          icon="emoji_events"
          title="참가 대회가 없어요"
          description="대회를 찾아 도전해보세요"
          ctaLabel="대회 찾아보기"
          ctaHref="/tournaments"
        />
      )}
    </div>
  );
}
