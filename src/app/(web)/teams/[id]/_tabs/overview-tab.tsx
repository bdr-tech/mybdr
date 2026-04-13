import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

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
  // 먼저 멤버 ID 목록 조회 (recentGames의 선행 조건)
  const memberIds = await prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    select: { userId: true },
  });
  const userIds = memberIds.map((m) => m.userId);

  // recentGames와 topMembers는 서로 독립적이므로 Promise.all로 병렬 실행
  // (기존: recentGames 완료 후 topMembers 순차 실행 → 불필요한 대기 제거)
  const fetchRecentGames = () => prisma.games.findMany({
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
  const fetchTopMembers = () => prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    include: { user: { select: { id: true, nickname: true, name: true, position: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    take: 6,
  });
  type RecentGames = Awaited<ReturnType<typeof fetchRecentGames>>;
  type TopMembers = Awaited<ReturnType<typeof fetchTopMembers>>;

  const [recentGames, topMembers] = await Promise.all([
    fetchRecentGames().catch(() => [] as RecentGames),
    fetchTopMembers().catch(() => [] as TopMembers),
  ]);

  // 경기 결과 라벨/스타일
  const STATUS_LABEL: Record<number, string> = { 0: "임시", 1: "모집중", 2: "확정", 3: "완료", 4: "취소" };
  const GAME_TYPE_LABEL: Record<number, string> = { 0: "픽업", 1: "게스트", 2: "팀대결" };

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

          {recentGames.length > 0 ? (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {recentGames.map((g) => {
                const href = `/games/${g.uuid?.slice(0, 8) ?? g.id}`;
                const statusNum = g.status;
                // 완료된 경기는 초록, 취소는 빨강, 나머지는 기본색
                const statusColor =
                  statusNum === 3 ? "text-green-500 bg-green-500/10" :
                  statusNum === 4 ? "text-red-500 bg-red-500/10" :
                  "text-[var(--color-text-muted)] bg-[var(--color-surface-high)]";

                return (
                  <Link
                    key={g.id.toString()}
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
