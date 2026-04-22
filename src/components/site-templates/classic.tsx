import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { TOURNAMENT_STATUS_LABEL, TOURNAMENT_FORMAT_LABEL } from "@/lib/constants/tournament-status";

// ─── 타입 ───────────────────────────────────────────────────────────────────

type Tournament = {
  id: string;
  name: string;
  format: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string | null;
  maxTeams: number | null;
  entry_fee: Prisma.Decimal | null;
  venue_name: string | null;
};

type TeamEntry = {
  id: bigint;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  points_for: number | null;
  points_against: number | null;
  status: string | null;
  team: { name: string; logoUrl: string | null; city: string | null };
};

type MatchEntry = {
  id: bigint;
  roundName: string | null;
  scheduledAt: Date | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
  venue_name: string | null;
  homeTeam: { team: { name: string; logoUrl: string | null } } | null;
  awayTeam: { team: { name: string; logoUrl: string | null } } | null;
};

type SitePage = { id: bigint; title: string; content: string | null; slug: string };

type SiteData = {
  site_name: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  subdomain: string;
  siteTemplate: { slug: string; name: string } | null;
  site_pages: SitePage[];
  tournament: Tournament;
};

export type ClassicTemplateProps = {
  site: SiteData;
  teams: TeamEntry[];
  matches: MatchEntry[];
  currentPage: string;
  templateType: "classic" | "dark" | "minimal";
};

// ─── 헬퍼 ───────────────────────────────────────────────────────────────────

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

function fmtDateFull(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

function fmtTime(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

// 대회 상태/형식 라벨 → 공통 상수에서 가져옴
function statusLabel(s: string | null): string {
  return TOURNAMENT_STATUS_LABEL[s ?? ""] ?? "대회";
}

function formatLabel(f: string | null): string {
  return TOURNAMENT_FORMAT_LABEL[f ?? ""] ?? f ?? "";
}

function TeamAvatar({ name, logoUrl, size = 8 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={size * 4}
        height={size * 4}
        className={`h-${size} w-${size} rounded-full object-cover`}
        unoptimized /* 외부 도메인이 다양하므로 최적화 생략 */
      />
    );
  }
  return (
    <div
      className={`flex h-${size} w-${size} items-center justify-center rounded-full bg-(--color-border) text-xs font-bold text-(--color-text-muted)`}
    >
      {name[0]}
    </div>
  );
}

// ─── 페이지 컴포넌트 ──────────────────────────────────────────────────────────

function StatCard({ label, value, primary }: { label: string; value: number; primary: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-center shadow-sm">
      <p className="text-3xl font-bold" style={{ color: primary }}>
        {value}
      </p>
      <p className="mt-1 text-sm text-(--color-text-muted)">{label}</p>
    </div>
  );
}

function MatchCard({
  match,
  primary,
  showScore = false,
}: {
  match: MatchEntry;
  primary: string;
  showScore?: boolean;
}) {
  const home = match.homeTeam?.team;
  const away = match.awayTeam?.team;
  const isCompleted = match.status === "completed";

  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-card)] shadow-md">
      {/* Round label */}
      {match.roundName && (
        <div className="border-b border-(--color-border) px-4 py-2">
          <span className="text-xs font-medium text-(--color-text-muted)">{match.roundName}</span>
          {match.scheduledAt && (
            <span className="ml-2 text-xs text-(--color-text-secondary)">
              {fmtDate(match.scheduledAt)} {fmtTime(match.scheduledAt)}
            </span>
          )}
        </div>
      )}
      {/* Teams */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Home team */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamAvatar name={home?.name ?? "TBD"} logoUrl={home?.logoUrl ?? null} size={10} />
          <span className="text-sm font-medium text-(--color-text-primary)">{home?.name ?? "TBD"}</span>
        </div>
        {/* Score or VS */}
        <div className="flex flex-col items-center px-4">
          {(showScore || isCompleted) && home && away ? (
            <div className="flex items-center gap-3">
              <span
                className="text-3xl font-black"
                style={{
                  color:
                    (match.homeScore ?? 0) > (match.awayScore ?? 0) ? primary : "var(--color-text-secondary)",
                }}
              >
                {match.homeScore ?? 0}
              </span>
              <span className="text-sm text-(--color-text-secondary)">:</span>
              <span
                className="text-3xl font-black"
                style={{
                  color:
                    (match.awayScore ?? 0) > (match.homeScore ?? 0) ? primary : "var(--color-text-secondary)",
                }}
              >
                {match.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold sm:text-2xl text-(--color-border)">VS</span>
          )}
          {match.scheduledAt && !showScore && !isCompleted && (
            <span className="mt-1 text-xs text-(--color-text-secondary)">
              {fmtDate(match.scheduledAt)} {fmtTime(match.scheduledAt)}
            </span>
          )}
        </div>
        {/* Away team */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamAvatar name={away?.name ?? "TBD"} logoUrl={away?.logoUrl ?? null} size={10} />
          <span className="text-sm font-medium text-(--color-text-primary)">{away?.name ?? "TBD"}</span>
        </div>
      </div>
      {match.venue_name && (
        <div className="border-t border-(--color-border) px-4 py-2 text-center text-xs text-(--color-text-secondary)">
          📍 {match.venue_name}
        </div>
      )}
    </div>
  );
}

// ─── 홈 페이지 ─────────────────────────────────────────────────────────────

function HomePage({
  teams,
  matches,
  primary,
}: {
  teams: TeamEntry[];
  matches: MatchEntry[];
  primary: string;
}) {
  const upcoming = matches.filter((m) => m.status === "scheduled" || m.status === "in_progress");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-10">
      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="참가팀" value={teams.length} primary={primary} />
        <StatCard label="예정 경기" value={upcoming.length} primary={primary} />
        <StatCard label="완료 경기" value={completed.length} primary={primary} />
      </div>

      {/* 팀 순위 */}
      {teams.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-(--color-text-primary)">팀 순위</h2>
            <Link href="/teams" className="text-sm font-medium hover:opacity-80" style={{ color: primary }}>
              전체 보기 →
            </Link>
          </div>
          <div className="overflow-hidden rounded-md border border-[var(--color-border)] shadow-md">
            <table className="w-full">
              <thead>
                <tr className="border-b border-(--color-border) bg-(--color-surface) text-xs font-medium text-(--color-text-muted)">
                  <th className="px-4 py-3 text-left">순위</th>
                  <th className="px-4 py-3 text-left">팀</th>
                  <th className="px-4 py-3 text-center">승</th>
                  <th className="px-4 py-3 text-center">패</th>
                  <th className="hidden px-4 py-3 text-center md:table-cell">득실</th>
                </tr>
              </thead>
              <tbody>
                {teams.slice(0, 5).map((t, i) => (
                  <tr
                    key={t.id.toString()}
                    className="border-b border-(--color-border) last:border-0 hover:bg-(--color-surface)"
                  >
                    <td className="px-4 py-3">
                      {/* 순위 색상: 1위(금)/3위(동)은 warning 토큰으로 통일 — 하드코딩 제거 */}
                      <span
                        className={`text-sm font-bold ${
                          i === 0
                            ? "text-(--color-warning)"
                            : i === 1
                            ? "text-(--color-text-secondary)"
                            : i === 2
                            ? "text-(--color-warning)"
                            : "text-[var(--color-text-disabled)]"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TeamAvatar name={t.team.name} logoUrl={t.team.logoUrl} size={7} />
                        <span className="text-sm font-medium text-(--color-text-primary)">{t.team.name}</span>
                        {t.team.city && (
                          <span className="hidden text-xs text-(--color-text-secondary) md:inline">
                            {t.team.city}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-(--color-text-primary)">
                      {t.wins ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-(--color-text-muted)">
                      {t.losses ?? 0}
                    </td>
                    <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) md:table-cell">
                      {(t.points_for ?? 0) - (t.points_against ?? 0) >= 0 ? "+" : ""}
                      {(t.points_for ?? 0) - (t.points_against ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 다음 경기 */}
      {upcoming.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-(--color-text-primary)">다음 경기</h2>
            <Link href="/schedule" className="text-sm font-medium hover:opacity-80" style={{ color: primary }}>
              전체 일정 →
            </Link>
          </div>
          <MatchCard match={upcoming[0]} primary={primary} />
        </section>
      )}

      {/* 최근 결과 */}
      {completed.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-(--color-text-primary)">최근 결과</h2>
            <Link href="/results" className="text-sm font-medium hover:opacity-80" style={{ color: primary }}>
              전체 결과 →
            </Link>
          </div>
          <div className="space-y-3">
            {[...completed].reverse().slice(0, 3).map((m) => (
              <MatchCard key={m.id.toString()} match={m} primary={primary} showScore />
            ))}
          </div>
        </section>
      )}

      {/* 데이터 없음 */}
      {teams.length === 0 && matches.length === 0 && (
        <div className="py-16 text-center text-(--color-text-secondary)">
          <p className="text-5xl mb-4">🏀</p>
          <p className="text-lg font-medium text-(--color-text-muted)">대회가 준비 중입니다</p>
          <p className="mt-1 text-sm">곧 정보가 업데이트될 예정입니다</p>
        </div>
      )}
    </div>
  );
}

// ─── 팀 페이지 ─────────────────────────────────────────────────────────────

function TeamsPage({ teams, primary }: { teams: TeamEntry[]; primary: string }) {
  if (teams.length === 0) {
    return (
      <div className="py-20 text-center text-(--color-text-secondary)">
        <p className="text-5xl mb-4">👥</p>
        <p className="text-lg font-medium text-(--color-text-muted)">참가 팀이 아직 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-(--color-text-primary)">참가팀 ({teams.length})</h2>
      <div className="overflow-hidden rounded-md border border-[var(--color-border)] shadow-md">
        <table className="w-full">
          <thead>
            <tr className="border-b border-(--color-border) bg-(--color-surface) text-xs font-medium text-(--color-text-muted)">
              <th className="px-4 py-3 text-left">순위</th>
              <th className="px-4 py-3 text-left">팀명</th>
              <th className="px-4 py-3 text-center">승</th>
              <th className="px-4 py-3 text-center">패</th>
              <th className="hidden px-4 py-3 text-center md:table-cell">무</th>
              <th className="hidden px-4 py-3 text-center md:table-cell">득점</th>
              <th className="hidden px-4 py-3 text-center md:table-cell">실점</th>
              <th className="hidden px-4 py-3 text-center md:table-cell">득실차</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr
                key={t.id.toString()}
                className="border-b border-(--color-border) last:border-0 hover:bg-(--color-surface)"
              >
                <td className="px-4 py-3 text-center">
                  {/* 순위 색상: 1위(금)/3위(동)은 warning 토큰으로 통일 — 하드코딩 제거 */}
                  <span
                    className={`text-sm font-bold ${
                      i === 0
                        ? "text-(--color-warning)"
                        : i === 1
                        ? "text-(--color-text-secondary)"
                        : i === 2
                        ? "text-(--color-warning)"
                        : "text-[var(--color-text-disabled)]"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <TeamAvatar name={t.team.name} logoUrl={t.team.logoUrl} size={9} />
                    <div>
                      <p className="text-sm font-semibold text-(--color-text-primary)">{t.team.name}</p>
                      {t.team.city && (
                        <p className="text-xs text-(--color-text-secondary)">{t.team.city}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td
                  className="px-4 py-3 text-center text-sm font-semibold"
                  style={{ color: primary }}
                >
                  {t.wins ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-sm text-(--color-text-muted)">
                  {t.losses ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) md:table-cell">
                  {t.draws ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) md:table-cell">
                  {t.points_for ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) md:table-cell">
                  {t.points_against ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-sm md:table-cell" style={{ color: primary }}>
                  {(t.points_for ?? 0) - (t.points_against ?? 0) >= 0 ? "+" : ""}
                  {(t.points_for ?? 0) - (t.points_against ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 일정 페이지 ────────────────────────────────────────────────────────────

function SchedulePage({
  matches,
  primary,
}: {
  matches: MatchEntry[];
  primary: string;
}) {
  const upcoming = matches.filter((m) => m.status !== "completed");

  if (upcoming.length === 0) {
    return (
      <div className="py-20 text-center text-(--color-text-secondary)">
        <p className="text-5xl mb-4">📅</p>
        <p className="text-lg font-medium text-(--color-text-muted)">예정된 경기가 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-(--color-text-primary)">경기 일정 ({upcoming.length})</h2>
      <div className="space-y-3">
        {upcoming.map((m) => (
          <MatchCard key={m.id.toString()} match={m} primary={primary} />
        ))}
      </div>
    </div>
  );
}

// ─── 결과 페이지 ────────────────────────────────────────────────────────────

function ResultsPage({
  matches,
  primary,
}: {
  matches: MatchEntry[];
  primary: string;
}) {
  const completed = matches.filter((m) => m.status === "completed");

  if (completed.length === 0) {
    return (
      <div className="py-20 text-center text-(--color-text-secondary)">
        <p className="text-5xl mb-4">🏆</p>
        <p className="text-lg font-medium text-(--color-text-muted)">완료된 경기가 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-(--color-text-primary)">경기 결과 ({completed.length})</h2>
      <div className="space-y-3">
        {[...completed].reverse().map((m) => (
          <MatchCard key={m.id.toString()} match={m} primary={primary} showScore />
        ))}
      </div>
    </div>
  );
}

// ─── 참가신청 페이지 ─────────────────────────────────────────────────────────

function RegistrationPage({
  tournament,
  primary,
}: {
  tournament: Tournament;
  primary: string;
}) {
  // 상태별 색상 - 의미적 고정 색상이므로 하드코딩 유지 (시맨틱 컬러)
  const statusColors: Record<string, string> = {
    registration_open: "#22C55E",
    registration_closed: "#EF4444",
    ongoing: "#E31B23",
    completed: "#9CA3AF",
  };
  const statusColor = statusColors[tournament.status ?? ""] ?? "#6B7280";

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-6 text-xl font-bold text-(--color-text-primary)">참가 신청</h2>

      <div className="space-y-4">
        {/* 신청 상태 */}
        <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <span className="text-sm font-medium text-(--color-text-muted)">신청 현황</span>
          <span className="text-sm font-bold" style={{ color: statusColor }}>
            ● {statusLabel(tournament.status)}
          </span>
        </div>

        {/* 정보 카드 */}
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-(--color-text-primary)">대회 정보</h3>
          <dl className="space-y-3 text-sm">
            {tournament.format && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">방식</dt>
                <dd className="font-medium text-(--color-text-primary)">{formatLabel(tournament.format)}</dd>
              </div>
            )}
            {tournament.maxTeams && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">최대 참가팀</dt>
                <dd className="font-medium text-(--color-text-primary)">{tournament.maxTeams}팀</dd>
              </div>
            )}
            {tournament.startDate && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">대회 기간</dt>
                <dd className="font-medium text-(--color-text-primary)">
                  {fmtDateFull(tournament.startDate)}
                  {tournament.endDate && ` ~ ${fmtDateFull(tournament.endDate)}`}
                </dd>
              </div>
            )}
            {tournament.venue_name && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">장소</dt>
                <dd className="font-medium text-(--color-text-primary)">{tournament.venue_name}</dd>
              </div>
            )}
            {tournament.entry_fee !== null && tournament.entry_fee !== undefined && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">참가비</dt>
                <dd className="font-medium text-(--color-text-primary)">
                  {Number(tournament.entry_fee) === 0
                    ? "무료"
                    : `₩${Number(tournament.entry_fee).toLocaleString()}`}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* CTA */}
        {tournament.status === "registration_open" ? (
          <a
            href={`https://mybdr.kr/tournaments/${tournament.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-sm py-4 text-center text-[13px] font-black uppercase tracking-widest text-white transition-opacity hover:opacity-90 shadow-glow-primary"
            style={{ backgroundColor: primary }}
          >
            신청하기 →
          </a>
        ) : (
          <div className="rounded-sm bg-[var(--color-surface)] p-4 text-center text-[11px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
            {tournament.status === "completed"
              ? "대회가 종료되었습니다"
              : "현재 참가 신청을 받지 않습니다"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 템플릿 ─────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/", label: "홈", page: "home" },
  { href: "/teams", label: "팀", page: "teams" },
  { href: "/schedule", label: "일정", page: "schedule" },
  { href: "/results", label: "결과", page: "results" },
  { href: "/registration", label: "참가신청", page: "registration" },
];

export function ClassicTemplate({
  site,
  teams,
  matches,
  currentPage,
  templateType,
}: ClassicTemplateProps) {
  const primary = site.primaryColor ?? "#1B3C87";
  const secondary = site.secondaryColor ?? "#E76F51";
  const siteName = site.site_name ?? site.tournament.name;

  // dark 템플릿은 어두운 배경으로 변형 - CSS 변수가 자동으로 다크/라이트 대응
  const isDark = templateType === "dark";
  const bgBase = isDark ? "#0F172A" : "var(--color-card)";
  const bgHero = isDark
    ? `linear-gradient(160deg, ${primary}30 0%, #0F172A 60%)`
    : `linear-gradient(160deg, ${primary}12 0%, ${secondary}08 100%)`;
  const textPrimary = isDark ? "#F1F5F9" : "var(--color-text-primary)";
  const textSecondary = isDark ? "#94A3B8" : "var(--color-text-muted)";
  const borderColor = isDark ? "#1E293B" : "var(--color-border)";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgBase }}>
      {/* 네비게이션 */}
      <header style={{ backgroundColor: primary }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {site.logoUrl ? (
              <Image src={site.logoUrl} alt={`${siteName} 로고`} width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                {siteName[0]}
              </div>
            )}
            <span className="text-lg font-bold text-white">{siteName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.page}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  currentPage === link.page
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile nav */}
          <nav className="flex gap-4 md:hidden">
            {NAV_LINKS.slice(0, 4).map((link) => (
              <Link
                key={link.page}
                href={link.href}
                className={`text-xs font-medium ${
                  currentPage === link.page ? "text-white" : "text-white/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* 히어로 */}
      <div
        className="border-b py-12 text-center"
        style={{
          background: bgHero,
          borderColor: isDark ? "#1E293B" : "var(--color-border)",
        }}
      >
        <span
          className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: primary }}
        >
          {statusLabel(site.tournament.status)}
        </span>
        <h1
          className="mb-3 text-3xl font-black md:text-4xl"
          style={{ color: textPrimary }}
        >
          {site.tournament.name}
        </h1>
        <div
          className="flex flex-wrap items-center justify-center gap-3 text-sm"
          style={{ color: textSecondary }}
        >
          {site.tournament.format && (
            <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor }}>
              {formatLabel(site.tournament.format)}
            </span>
          )}
          {site.tournament.startDate && (
            <span>
              {fmtDateFull(site.tournament.startDate)}
              {site.tournament.endDate ? ` ~ ${fmtDateFull(site.tournament.endDate)}` : ""}
            </span>
          )}
          {site.tournament.venue_name && (
            <span>📍 {site.tournament.venue_name}</span>
          )}
        </div>
      </div>

      {/* 콘텐츠 */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        {currentPage === "teams" ? (
          <TeamsPage teams={teams} primary={primary} />
        ) : currentPage === "schedule" ? (
          <SchedulePage matches={matches} primary={primary} />
        ) : currentPage === "results" ? (
          <ResultsPage matches={matches} primary={primary} />
        ) : currentPage === "registration" ? (
          <RegistrationPage tournament={site.tournament} primary={primary} />
        ) : (
          <HomePage teams={teams} matches={matches} primary={primary} />
        )}
      </main>

      {/* 푸터 */}
      <footer
        className="mt-16 border-t py-8 text-center text-sm"
        style={{ borderColor, color: textSecondary }}
      >
        <p>
          Powered by{" "}
          <a
            href="https://mybdr.kr"
            className="font-semibold hover:opacity-80"
            style={{ color: primary }}
          >
            MyBDR
          </a>
        </p>
      </footer>
    </div>
  );
}
