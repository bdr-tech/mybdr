import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

interface GamesTabProps {
  teamId: bigint;
  accent: string;
}

// 이유: 이 팀의 경기 기록은 두 종류다.
// (1) 픽업 경기 (prisma.games) — 팀원이 주최한 픽업/게스트/팀대결 경기
// (2) 토너먼트 경기 (prisma.tournamentMatch) — 대회에서 실제로 뛴 공식 경기
// 기존 구현은 (1)만 보여줘서, 대회 기록만 있는 팀은 "0건"으로 보였다.
// 여기서는 두 소스를 병행 조회해 날짜순으로 통합 표시한다.
export async function GamesTab({ teamId, accent }: GamesTabProps) {
  // ───── (1) 픽업 경기 조회 — 기존 로직 그대로 유지 ─────
  const memberIds = await prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    select: { userId: true },
  });
  const userIds = memberIds.map((m) => m.userId);

  const pickupGames = await prisma.games
    .findMany({
      where: { organizer_id: { in: userIds } },
      orderBy: { scheduled_at: "desc" },
      take: 30,
      select: {
        id: true,
        uuid: true,
        title: true,
        scheduled_at: true,
        status: true,
        game_type: true,
      },
    })
    .catch(() => []);

  // ───── (2) 토너먼트 경기 조회 ─────
  // 이유: TournamentMatch.homeTeamId/awayTeamId는 Team.id가 아니라
  // TournamentTeam.id(팀의 대회 참가 인스턴스)를 가리킨다.
  // 따라서 먼저 이 팀의 모든 TournamentTeam.id 목록을 얻어야 한다.
  const tournamentTeams = await prisma.tournamentTeam
    .findMany({
      where: { teamId },
      select: { id: true },
    })
    .catch(() => []);
  const ttIds = tournamentTeams.map((tt) => tt.id);

  // 이 팀이 참가한 대회 경기 중 "이미 치러진 공식 기록"만
  // - scheduledAt <= NOW: 미래 예정 경기 제외 (Flutter 테스트 데이터 방어)
  // - scheduledAt IS NOT NULL: 날짜 없는 더미/초안 제외
  // - status IN ('completed','live'): 예정(scheduled) 제외, 진행 중도 현재 스코어로 표시
  const tournamentMatches =
    ttIds.length > 0
      ? await prisma.tournamentMatch
          .findMany({
            where: {
              OR: [
                { homeTeamId: { in: ttIds } },
                { awayTeamId: { in: ttIds } },
              ],
              status: { in: ["completed", "live"] },
              scheduledAt: { lte: new Date(), not: null },
            },
            include: {
              homeTeam: { include: { team: { select: { id: true, name: true } } } },
              awayTeam: { include: { team: { select: { id: true, name: true } } } },
              tournament: { select: { id: true, name: true } },
            },
            orderBy: { scheduledAt: "desc" },
            take: 30,
          })
          .catch(() => [])
      : [];

  // ───── 두 소스 병합 → 날짜 DESC 정렬 → 최대 30건 ─────
  // 이유: 통합 타임라인 느낌으로 보여주기 위해 병합 후 일괄 정렬
  type PickupItem = {
    kind: "pickup";
    key: string;
    sortDate: number; // 정렬용 epoch ms
    data: (typeof pickupGames)[number];
  };
  type TournamentItem = {
    kind: "tournament";
    key: string;
    sortDate: number;
    data: (typeof tournamentMatches)[number];
  };
  type Item = PickupItem | TournamentItem;

  const items: Item[] = [
    ...pickupGames.map<PickupItem>((g) => ({
      kind: "pickup",
      key: `pickup-${g.id.toString()}`,
      sortDate: g.scheduled_at ? g.scheduled_at.getTime() : 0,
      data: g,
    })),
    ...tournamentMatches.map<TournamentItem>((m) => ({
      kind: "tournament",
      key: `tm-${m.id.toString()}`,
      // scheduledAt은 위 쿼리에서 not: null로 필터링되어 반드시 존재
      sortDate: m.scheduledAt ? m.scheduledAt.getTime() : 0,
      data: m,
    })),
  ]
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 30);

  // ───── 픽업 경기 표기 상수 (기존 그대로) ─────
  const GAME_TYPE_LABEL: Record<number, string> = { 0: "픽업", 1: "게스트", 2: "팀대결" };
  const STATUS_LABEL: Record<number, string> = { 0: "임시", 1: "모집중", 2: "확정", 3: "완료", 4: "취소" };

  // ───── 토너먼트 경기 상태 라벨 ─────
  const TM_STATUS_LABEL: Record<string, string> = { completed: "종료", live: "진행중" };

  if (items.length === 0) {
    return (
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-10 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)] mb-2">sports_basketball</span>
        <p className="text-sm text-[var(--color-text-muted)]">경기 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {items.map((item) => {
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
            } else {
              // 0-0 동점이어도 공식 기록이면 표시 (라벨만 "-")
              outcomeLabel = "-";
            }

            const homeName = m.homeTeam?.team?.name ?? "미정";
            const awayName = m.awayTeam?.team?.name ?? "미정";
            const tournamentName = m.tournament?.name ?? "대회";

            // 날짜 (KST)
            const dateLabel = m.scheduledAt
              ? m.scheduledAt.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "Asia/Seoul",
                })
              : "-";

            const href = `/tournaments/${m.tournament?.id}`;

            return (
              <Link
                key={item.key}
                href={href}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--color-surface-bright)]"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* 경기 타입 아이콘 — 토너먼트 표시용 T 배지 */}
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-sm font-bold text-white"
                    style={{ backgroundColor: accent }}
                    title="토너먼트 경기"
                  >
                    T
                  </span>
                  <div className="min-w-0">
                    {/* 1줄: 홈 vs 원정 + 스코어 */}
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      <span className={isHome ? "font-bold" : ""}>{homeName}</span>
                      <span className="mx-2 text-[var(--color-text-muted)]">
                        {m.homeScore ?? 0} : {m.awayScore ?? 0}
                      </span>
                      <span className={!isHome ? "font-bold" : ""}>{awayName}</span>
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
          const statusColor =
            statusNum === 3
              ? "text-green-500 bg-green-500/10"
              : statusNum === 4
                ? "text-red-500 bg-red-500/10"
                : statusNum === 1
                  ? `bg-[${accent}22]`
                  : "text-[var(--color-text-muted)] bg-[var(--color-surface-high)]";

          return (
            <Link
              key={item.key}
              href={href}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--color-surface-bright)]"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* 경기 타입 아이콘 */}
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[var(--color-surface-high)] text-sm font-bold text-[var(--color-text-secondary)]">
                  {GAME_TYPE_LABEL[g.game_type ?? 0]?.charAt(0) ?? "-"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{g.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {g.scheduled_at?.toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "Asia/Seoul",
                    }) ?? "-"}
                    {" · "}
                    {GAME_TYPE_LABEL[g.game_type ?? 0] ?? "-"}
                  </p>
                </div>
              </div>
              <span
                className={`ml-3 flex-shrink-0 rounded px-2 py-0.5 text-xs font-bold ${statusColor}`}
                style={statusNum === 1 ? { backgroundColor: `${accent}22`, color: accent } : undefined}
              >
                {STATUS_LABEL[g.status] ?? String(g.status)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
