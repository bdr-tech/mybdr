"use client";

import type { BracketMatch, TeamSlot } from "@/lib/tournaments/bracket-builder";

type MatchCardProps = {
  match: BracketMatch;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;  // 기본 false (데스크톱 트리 뷰에서 높이 고정)
  className?: string;
};

const SIZE_MAP = {
  sm: "w-[120px] min-h-[60px]",
  md: "w-[140px] min-h-[66px]",
  lg: "w-[160px] min-h-[72px]",
} as const;

function isWinner(match: BracketMatch, team: TeamSlot): boolean {
  if (!team || !match.winnerTeamId) return false;
  return team.teamId === match.winnerTeamId;
}

function isLoser(match: BracketMatch, team: TeamSlot): boolean {
  if (!team || !match.winnerTeamId || match.status !== "completed") return false;
  return team.teamId !== match.winnerTeamId;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(244,162,97,0.15)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
        </span>
        LIVE
      </span>
    );
  }

  const config: Record<string, { label: string; bg: string; color: string }> = {
    scheduled: { label: "예정", bg: "rgba(255,255,255,0.08)", color: "#6B7280" },
    pending: { label: "대기", bg: "rgba(255,255,255,0.08)", color: "#6B7280" },
    completed: { label: "종료", bg: "rgba(74,222,128,0.1)", color: "#22C55E" },
    bye: { label: "부전승", bg: "rgba(255,255,255,0.08)", color: "#6B7280" },
    cancelled: { label: "취소", bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
  };

  const c = config[status] ?? config.scheduled;

  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

function TeamRow({
  match,
  team,
  score,
  position,
}: {
  match: BracketMatch;
  team: TeamSlot;
  score: number;
  position: "home" | "away";
}) {
  const winner = isWinner(match, team);
  const loser = isLoser(match, team);
  const isBye = match.status === "bye" && !team;
  const isLive = match.status === "in_progress";
  const showScore = match.status === "completed" || match.status === "in_progress";

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs ${
        winner ? "bg-[rgba(244,162,97,0.08)]" : ""
      }`}
    >
      {/* 승자 표시 바 */}
      <div
        className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${
          winner ? "bg-[var(--color-primary)]" : "bg-transparent"
        }`}
      />

      {/* 팀명 */}
      <span
        className={`flex-1 truncate font-medium leading-tight ${
          loser ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
        }`}
>
        {isBye && position === "away"
          ? "부전승"
          : team !== null
            ? team.team.name
            : "TBD"}
      </span>

      {/* 점수 */}
      <span
        className={`flex-shrink-0 font-bold tabular-nums ${
          winner
            ? "text-[var(--color-primary)]"
            : isLive
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-text-secondary)]"
        }`}
      >
        {showScore ? score : "-"}
      </span>
    </div>
  );
}

export function MatchCard({ match, size = "lg", showBadge = false, className = "" }: MatchCardProps) {
  const isBye = match.status === "bye";
  const isLive = match.status === "in_progress";

  const cardClasses = [
    "rounded-[12px] border overflow-hidden transition-all duration-150",
    SIZE_MAP[size],
    // 상태별 스타일
    isBye
      ? "border-dashed border-[var(--color-border)] bg-[var(--color-surface)] opacity-70"
      : isLive
        ? "border-2 border-[var(--color-primary)] bg-[var(--color-card)] shadow-[0_0_12px_rgba(244,162,97,0.15)]"
        : "border-[var(--color-border)] bg-[var(--color-card)]",
    // 호버 (bye 제외)
    !isBye && "hover:border-[rgba(244,162,97,0.3)] hover:bg-[var(--color-surface)] cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${cardClasses} relative`}>
      {/* LIVE NOW 배지 - 진행중 경기에 카드 상단 표시 (시안 bdr_3 참조) */}
      {isLive && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] font-bold uppercase rounded z-10 text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          LIVE NOW
        </div>
      )}

      {/* 홈팀 */}
      <TeamRow match={match} team={match.homeTeam} score={match.homeScore} position="home" />

      {/* 구분선 */}
      <div className={`border-t ${isBye ? "border-[var(--color-border)]" : "border-[var(--color-border)]"}`} />

      {/* 어웨이팀 */}
      <TeamRow match={match} team={match.awayTeam} score={match.awayScore} position="away" />

      {/* 상태 뱃지 - showBadge=true일 때만 (모바일에서 사용) */}
      {showBadge && (isLive || match.status === "completed" || isBye) && (
        <>
          <div className={`border-t ${isBye ? "border-[var(--color-border)]" : "border-[var(--color-border)]"}`} />
          <div className="flex justify-center py-0.5">
            <StatusBadge status={match.status} />
          </div>
        </>
      )}
    </div>
  );
}

// ── 모바일 풀와이드 카드 ──────────────────────────────

export function MobileMatchCard({
  match,
  tournamentId,
}: {
  match: BracketMatch;
  tournamentId: string;
}) {
  const isBye = match.status === "bye";
  const isLive = match.status === "in_progress";
  const showScore = match.status === "completed" || match.status === "in_progress";

  const homeWinner = isWinner(match, match.homeTeam);
  const awayWinner = isWinner(match, match.awayTeam);
  const homeLoser = isLoser(match, match.homeTeam);
  const awayLoser = isLoser(match, match.awayTeam);

  return (
    <div
      className={`rounded-[16px] border overflow-hidden ${
        isBye
          ? "border-dashed border-[var(--color-border)] bg-[var(--color-surface)] opacity-70"
          : isLive
            ? "border-2 border-[var(--color-primary)] bg-[var(--color-card)] shadow-[0_0_12px_rgba(244,162,97,0.15)]"
            : "border-[var(--color-border)] bg-[var(--color-card)]"
      }`}
    >
      {/* 매치 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-surface)]">
        <span className="text-xs text-[var(--color-text-muted)]">
          {match.matchNumber ? `경기 ${match.matchNumber}` : ""}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* 홈팀 행 */}
      <div
        className={`flex items-center px-4 py-3 ${
          homeWinner ? "bg-[rgba(244,162,97,0.06)]" : ""
        }`}
      >
        <div
          className={`w-1 self-stretch rounded-full mr-3 flex-shrink-0 ${
            homeWinner ? "bg-[var(--color-primary)]" : "bg-transparent"
          }`}
        />
        <span
          className={`flex-1 font-medium ${
            homeLoser ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
          }`}
        >
          {match.homeTeam?.team.name ?? "TBD"}
        </span>
        <span
          className={`text-lg font-bold tabular-nums ${
            homeWinner
              ? "text-[var(--color-primary)]"
              : isLive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)]"
          }`}
        >
          {showScore ? match.homeScore : "-"}
        </span>
      </div>

      {/* 구분선 */}
      <div className="border-t border-[var(--color-border)] mx-4" />

      {/* 어웨이팀 행 */}
      <div
        className={`flex items-center px-4 py-3 ${
          awayWinner ? "bg-[rgba(244,162,97,0.06)]" : ""
        }`}
      >
        <div
          className={`w-1 self-stretch rounded-full mr-3 flex-shrink-0 ${
            awayWinner ? "bg-[var(--color-primary)]" : "bg-transparent"
          }`}
        />
        <span
          className={`flex-1 font-medium ${
            awayLoser ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
          }`}
        >
          {isBye && !match.awayTeam
            ? "부전승"
            : (match.awayTeam?.team.name ?? "TBD")}
        </span>
        <span
          className={`text-lg font-bold tabular-nums ${
            awayWinner
              ? "text-[var(--color-primary)]"
              : isLive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)]"
          }`}
        >
          {showScore ? match.awayScore : "-"}
        </span>
      </div>

      {/* 일정 정보 */}
      {match.scheduledAt && (
        <>
          <div className="border-t border-[var(--color-border)]" />
          <div className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
            {new Date(match.scheduledAt).toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
              timeZone: "Asia/Seoul",
            })}{" "}
            {new Date(match.scheduledAt).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Seoul",
            })}
          </div>
        </>
      )}
    </div>
  );
}
