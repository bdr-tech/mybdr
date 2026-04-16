import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
// Phase 3: 공식 기록 가드 (status + scheduledAt 조건 통합)
import { officialMatchWhere } from "@/lib/tournaments/official-match";

interface OverviewTabProps {
  teamId: bigint;
  accent: string;
  // page.tsx에서 이미 계산된 팀 데이터를 받아서 중복 쿼리 방지
  team: {
    name: string;
    description: string | null;
    wins: number;
    losses: number;
    winRate: number | null;
    memberCount: number;
    location: string;
    city: string | null;
  };
}

export async function OverviewTab({ teamId, accent, team }: OverviewTabProps) {
  // 이유: 최근 경기 위젯도 games-tab과 동일하게 픽업 경기 + 토너먼트 경기를 함께 보여줘야
  // 대회 기록만 있는 팀이 "기록 없음"으로 보이지 않는다.
  // 선행 조회 2건(멤버 ID, 참가 대회 ID)은 서로 독립이라 Promise.all로 병렬 실행한다.
  const [memberIds, tournamentTeams] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId, status: "active" },
      select: { userId: true },
    }),
    // TournamentMatch.homeTeamId/awayTeamId는 Team.id가 아니라 TournamentTeam.id이므로
    // 먼저 이 팀의 모든 TournamentTeam.id 목록을 구한다 (games-tab과 동일 패턴)
    prisma.tournamentTeam
      .findMany({ where: { teamId }, select: { id: true } })
      .catch(() => [] as { id: bigint }[]),
  ]);
  const userIds = memberIds.map((m) => m.userId);
  const ttIds = tournamentTeams.map((tt) => tt.id);

  // 본조회 3건 병렬 실행: 픽업 경기 / 토너먼트 경기 / 주요 스쿼드
  const fetchPickupGames = () => prisma.games.findMany({
    where: { organizer_id: { in: userIds } },
    orderBy: { scheduled_at: "desc" },
    take: 5,
    select: {
      id: true,
      uuid: true,
      title: true,
      scheduled_at: true,
      status: true,
      game_type: true,
    },
  });
  // 이 팀이 참가한 대회 경기 중 "이미 치러진 공식 기록"만 조회
  // Phase 3: officialMatchWhere 공통 유틸로 가드 일원화
  const fetchTournamentMatches = () => prisma.tournamentMatch.findMany({
    where: officialMatchWhere({
      OR: [
        { homeTeamId: { in: ttIds } },
        { awayTeamId: { in: ttIds } },
      ],
    }),
    include: {
      homeTeam: { include: { team: { select: { id: true, name: true } } } },
      awayTeam: { include: { team: { select: { id: true, name: true } } } },
      tournament: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 5,
  });
  const fetchTopMembers = () => prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    include: { user: { select: { id: true, nickname: true, name: true, position: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    take: 6,
  });
  type PickupGames = Awaited<ReturnType<typeof fetchPickupGames>>;
  type TournamentMatches = Awaited<ReturnType<typeof fetchTournamentMatches>>;
  type TopMembers = Awaited<ReturnType<typeof fetchTopMembers>>;

  const [pickupGames, tournamentMatches, topMembers] = await Promise.all([
    fetchPickupGames().catch(() => [] as PickupGames),
    // ttIds가 비어 있으면 OR 조건이 의미 없으므로 쿼리 자체를 스킵
    ttIds.length > 0
      ? fetchTournamentMatches().catch(() => [] as TournamentMatches)
      : Promise.resolve([] as TournamentMatches),
    fetchTopMembers().catch(() => [] as TopMembers),
  ]);

  // ───── 두 소스 병합 → 날짜 DESC 정렬 → 최대 5건 ─────
  // 이유: 통합 타임라인 느낌으로 보여주기 위해 병합 후 일괄 정렬 (games-tab과 동일 패턴)
  type PickupItem = {
    kind: "pickup";
    key: string;
    sortDate: number; // 정렬용 epoch ms
    data: PickupGames[number];
  };
  type TournamentItem = {
    kind: "tournament";
    key: string;
    sortDate: number;
    data: TournamentMatches[number];
  };
  type RecentItem = PickupItem | TournamentItem;

  const recentItems: RecentItem[] = [
    ...pickupGames.map<PickupItem>((g) => ({
      kind: "pickup",
      key: `pickup-${g.id.toString()}`,
      sortDate: g.scheduled_at ? g.scheduled_at.getTime() : 0,
      data: g,
    })),
    ...tournamentMatches.map<TournamentItem>((m) => ({
      kind: "tournament",
      key: `tm-${m.id.toString()}`,
      sortDate: m.scheduledAt ? m.scheduledAt.getTime() : 0,
      data: m,
    })),
  ]
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 5);

  // 경기 결과 라벨/스타일 (픽업 경기용 — 기존 유지)
  const STATUS_LABEL: Record<number, string> = { 0: "임시", 1: "모집중", 2: "확정", 3: "완료", 4: "취소" };
  const GAME_TYPE_LABEL: Record<number, string> = { 0: "픽업", 1: "게스트", 2: "팀대결" };
  // 토너먼트 경기 상태 라벨
  const TM_STATUS_LABEL: Record<string, string> = { completed: "종료", live: "진행중" };

  const total = team.wins + team.losses;

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* ===== 좌측 (lg:col-span-8) ===== */}
      <div className="col-span-12 lg:col-span-8 space-y-6">

        {/* 통계 카드 3칸 (grid-cols-3) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* 시즌 승률 — 큰 숫자 + 전적 텍스트 */}
          <div className="col-span-2 rounded border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
              시즌 승률
            </p>
            <div className="flex items-end justify-between">
              <span
                className="text-2xl sm:text-4xl font-black text-[var(--color-primary)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {team.winRate !== null ? `${team.winRate}%` : "-"}
              </span>
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--color-text-primary)]">
                  {team.wins}승 {team.losses}패
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  총 {total}경기
                </p>
              </div>
            </div>
            {/* 승률 프로그레스 바 */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-high)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${team.winRate ?? 0}%` }}
              />
            </div>
          </div>

          {/* 우측 2칸 — 평균 득점 + 경기 수 */}
          <div className="flex flex-col gap-4">
            {/* 평균 득점 */}
            <div className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                경기 수
              </p>
              <span
                className="text-xl sm:text-3xl font-black text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {total}
              </span>
            </div>
            {/* 멤버 수 */}
            <div className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                멤버
              </p>
              <span
                className="text-xl sm:text-3xl font-black text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {team.memberCount}명
              </span>
            </div>
          </div>
        </div>

        {/* 팀 소개 텍스트 블록 */}
        {team.description && (
          <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              {/* 빨간 세로 바 + 섹션 제목 */}
              <span className="h-6 w-1.5 rounded-full bg-[var(--color-primary)]" />
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">팀 소개</h2>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {team.description}
            </p>
          </div>
        )}

        {/* 최근 5경기 결과 */}
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-6">
            <div className="flex items-center gap-2">
              <span className="h-6 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">최근 경기</h2>
            </div>
            <Link
              href={`/teams/${teamId}?tab=games`}
              className="text-xs font-bold text-[var(--color-accent)] hover:underline"
            >
              전체보기
            </Link>
          </div>

          {recentItems.length > 0 ? (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {recentItems.map((item) => {
                // ───── (A) 토너먼트 경기 카드 ─────
                if (item.kind === "tournament") {
                  const m = item.data;
                  // 이 팀이 홈/원정 중 어느 쪽인지 판별 (승패 표기용)
                  const isHome = m.homeTeamId !== null && ttIds.some((id) => id === m.homeTeamId);
                  const myScore = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0;
                  const oppScore = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0;

                  // 승/패/진행중 판단 — live 상태는 "진행중"으로 표기
                  let outcomeLabel = "-";
                  let outcomeColor = "text-[var(--color-text-muted)] bg-[var(--color-surface-high)]";
                  if (m.status === "live") {
                    outcomeLabel = TM_STATUS_LABEL.live;
                    outcomeColor = "text-yellow-500 bg-yellow-500/10";
                  } else if (myScore > oppScore) {
                    outcomeLabel = "승";
                    outcomeColor = "text-green-500 bg-green-500/10";
                  } else if (myScore < oppScore) {
                    outcomeLabel = "패";
                    outcomeColor = "text-red-500 bg-red-500/10";
                  }

                  const homeName = m.homeTeam?.team?.name ?? "미정";
                  const awayName = m.awayTeam?.team?.name ?? "미정";
                  const tournamentName = m.tournament?.name ?? "대회";
                  const dateLabel = m.scheduledAt
                    ? m.scheduledAt.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "Asia/Seoul",
                      })
                    : "-";

                  // 토너먼트 상세 페이지로 이동 (games-tab과 동일)
                  const href = `/tournaments/${m.tournament?.id}`;

                  return (
                    <Link
                      key={item.key}
                      href={href}
                      className="flex items-center justify-between p-5 transition-colors hover:bg-[var(--color-surface-bright)]"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* T 배지 — accent 색상으로 토너먼트 경기임을 표시 */}
                        <span
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-sm font-bold text-white"
                          style={{ backgroundColor: accent }}
                          title="토너먼트 경기"
                        >
                          T
                        </span>
                        <div className="min-w-0">
                          {/* 1줄: 홈 vs 원정 + 스코어 (내 팀은 굵게) */}
                          <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                            <span className={isHome ? "" : "font-medium"}>{homeName}</span>
                            <span className="mx-2 text-[var(--color-text-muted)]">
                              {m.homeScore ?? 0} : {m.awayScore ?? 0}
                            </span>
                            <span className={!isHome ? "" : "font-medium"}>{awayName}</span>
                          </p>
                          {/* 2줄: 대회명 · 날짜 */}
                          <p className="text-xs text-[var(--color-text-muted)] truncate">
                            {tournamentName} · {dateLabel}
                          </p>
                        </div>
                      </div>
                      {/* 우측: 승/패/진행중 배지 */}
                      <span className={`ml-3 flex-shrink-0 rounded px-2 py-0.5 text-xs font-bold ${outcomeColor}`}>
                        {outcomeLabel}
                      </span>
                    </Link>
                  );
                }

                // ───── (B) 픽업 경기 카드 — 기존 UI 그대로 ─────
                const g = item.data;
                const href = `/games/${g.uuid?.slice(0, 8) ?? g.id}`;
                const statusNum = g.status;
                // 완료된 경기는 초록, 취소는 빨강, 나머지는 기본색
                const statusColor =
                  statusNum === 3 ? "text-green-500 bg-green-500/10" :
                  statusNum === 4 ? "text-red-500 bg-red-500/10" :
                  "text-[var(--color-text-muted)] bg-[var(--color-surface-high)]";

                return (
                  <Link
                    key={item.key}
                    href={href}
                    className="flex items-center justify-between p-5 transition-colors hover:bg-[var(--color-surface-bright)]"
                  >
                    <div className="flex items-center gap-4">
                      {/* 경기 타입 아이콘 */}
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-surface-high)] text-sm font-bold text-[var(--color-text-secondary)]">
                        {GAME_TYPE_LABEL[g.game_type ?? 0]?.charAt(0) ?? "-"}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">{g.title}</p>
                        {g.scheduled_at && (
                          <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold">
                            {g.scheduled_at.toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              timeZone: "Asia/Seoul",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${statusColor}`}>
                      {STATUS_LABEL[statusNum] ?? String(statusNum)}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">경기 기록이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== 우측 (lg:col-span-4) ===== */}
      <div className="col-span-12 lg:col-span-4 space-y-6">

        {/* 주요 스쿼드 카드 */}
        {topMembers.length > 0 && (
          <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                주요 스쿼드
              </h4>
              <span className="material-symbols-outlined text-[var(--color-text-muted)] cursor-pointer text-lg">
                more_horiz
              </span>
            </div>
            <div className="space-y-3">
              {topMembers.slice(0, 3).map((m) => {
                const displayName = m.user?.nickname ?? m.user?.name ?? "멤버";
                const isCaptain = m.role === "captain";
                const position = m.user?.position ?? "-";
                const userId = m.user?.id?.toString();

                const inner = (
                  <div className="flex items-center gap-3">
                    {/* 아바타 원형 */}
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: isCaptain ? accent : "var(--color-surface-high)" }}
                    >
                      <span className={isCaptain ? "" : "text-[var(--color-text-secondary)]"}>
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">
                        {displayName} {isCaptain ? "(C)" : ""}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {position}
                      </p>
                    </div>
                    {/* 역할 배지 */}
                    {isCaptain && (
                      <span className="text-xs font-bold text-[var(--color-primary)]">
                        CAPTAIN
                      </span>
                    )}
                  </div>
                );

                return userId ? (
                  <Link key={m.id.toString()} href={`/users/${userId}`} className="block">
                    {inner}
                  </Link>
                ) : (
                  <div key={m.id.toString()}>{inner}</div>
                );
              })}
            </div>
            {/* 로스터 전체보기 버튼 */}
            <Link
              href={`/teams/${teamId}?tab=roster`}
              className="mt-5 block w-full rounded border border-[var(--color-border)] py-2 text-center text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-bright)]"
            >
              로스터 전체보기
            </Link>
          </div>
        )}

        {/* 주 활동 구장 (지도 placeholder) */}
        {team.location && (
          <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
            {/* 지도 placeholder */}
            <div className="relative h-36 bg-[var(--color-surface-high)]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-[var(--color-primary)] p-2 shadow-lg">
                  <span
                    className="material-symbols-outlined text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    location_on
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-[var(--color-text-primary)]">주 활동 지역</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{team.location}</p>
            </div>
          </div>
        )}

        {/* 팀 정보 요약 카드 */}
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
            팀 정보
          </h4>
          <div className="space-y-3">
            {[
              { icon: "location_on", label: "지역", value: team.location || "-" },
              { icon: "groups", label: "멤버", value: `${team.memberCount}명` },
              { icon: "sports_score", label: "전적", value: `${team.wins}승 ${team.losses}패` },
              { icon: "percent", label: "승률", value: team.winRate !== null ? `${team.winRate}%` : "-" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-[var(--color-text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
