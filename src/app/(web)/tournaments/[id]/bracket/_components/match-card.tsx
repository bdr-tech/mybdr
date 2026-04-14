"use client";

import Link from "next/link";
import type { BracketMatch, TeamSlot } from "@/lib/tournaments/bracket-builder";

type MatchCardProps = {
  match: BracketMatch;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;  // 기본 false (데스크톱 트리 뷰에서 높이 고정)
  className?: string;
};

// 이유: 모바일 375px 한 화면에 4강 트리(3컬럼)가 들어가려면 카드를 더 작게.
// 기존 120/140/160 → 100/120/140로 20px씩 축소. 높이도 비율 맞춰 축소.
const SIZE_MAP = {
  sm: "w-[120px] min-h-[62px]",
  md: "w-[144px] min-h-[70px]",
  lg: "w-[168px] min-h-[80px]",
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
    scheduled: { label: "예정", bg: "rgba(255,255,255,0.08)", color: "var(--color-badge-gray)" },
    pending: { label: "대기", bg: "rgba(255,255,255,0.08)", color: "var(--color-badge-gray)" },
    completed: { label: "종료", bg: "rgba(74,222,128,0.1)", color: "var(--color-success)" },
    bye: { label: "부전승", bg: "rgba(255,255,255,0.08)", color: "var(--color-badge-gray)" },
    cancelled: { label: "취소", bg: "rgba(239,68,68,0.1)", color: "var(--color-error)" },
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
  // Phase 2C: 팀이 없을 때 "1위", "4위" 같은 슬롯 라벨을 표시 (리그 진행 중)
  const slotLabel = position === "home" ? match.homeSlotLabel : match.awaySlotLabel;

  // 좌측 세로 띠 색상 결정
  // - 팀 확정 + primaryColor가 흰색 아님 → 유니폼 색상
  // - 팀 확정 + 흰색 → BDR 브랜드 컬러 fallback (home=Red, away=Navy)
  // - 팀 미확정 → home=Red, away=Navy
  const BDR_RED = "#E31B23";
  const BDR_NAVY = "#1B3C87";
  const isWhiteColor = (c: string | null | undefined) =>
    !c || c.toLowerCase() === "#ffffff" || c.toLowerCase() === "#fff";
  const stripeColor = (() => {
    if (team && !isWhiteColor(team.team.primaryColor)) {
      return team.team.primaryColor!;
    }
    return position === "home" ? BDR_RED : BDR_NAVY;
  })();

  return (
    // 이유: NBA.com 스타일 — 승자 row는 굵게+primary 하이라이트, 패자 row는 opacity로 명암 구분.
    // px-2 py-1 유지, 승자 배경 0.08 → 0.1로 살짝 강화.
    <div
      className={`flex items-center gap-1 px-2 py-1 text-[11px] transition-opacity ${
        winner ? "bg-[rgba(244,162,97,0.1)]" : ""
      } ${loser ? "opacity-50" : ""}`}
    >
      {/* 좌측 세로 띠: 팀 유니폼 색상 (미확정 시 home=red, away=navy) */}
      <div
        className="w-1 self-stretch rounded-sm flex-shrink-0"
        style={{ backgroundColor: stripeColor }}
      />

      {/* 팀명: teamId가 있으면 팀 페이지 링크 */}
      {/* 시드 뱃지(#1, #4)는 팀명 바로 앞에 작게 inline 표시 — 승자면 primary 배경으로 강조 */}
      {team !== null && !isBye ? (
        <Link
          href={`/teams/${team.teamId}`}
          className={`flex-1 min-w-0 flex items-center gap-1 leading-tight hover:underline ${
            // 이유: NBA 스타일은 승자를 font-bold로, 패자는 font-normal로 확실히 구분
            winner ? "font-bold" : "font-medium"
          } ${
            loser ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 시드 뱃지: 승자는 primary 배경(흰 글씨), 일반은 surface(muted) */}
          {team.seedNumber != null && (
            <span
              className="inline-flex items-center justify-center rounded px-1 text-[9px] font-bold flex-shrink-0 tabular-nums"
              style={{
                backgroundColor: winner ? "var(--color-primary)" : "var(--color-surface)",
                color: winner ? "#ffffff" : "var(--color-text-muted)",
              }}
            >
              {team.seedNumber}
            </span>
          )}
          <span className="truncate">{team.team.name}</span>
        </Link>
      ) : (
        <span
          className={`flex-1 truncate font-medium leading-tight ${
            // 슬롯 라벨은 대기 중 의미 — 이탤릭 + 진한 secondary로 시인성 향상
            slotLabel ? "italic text-[var(--color-text-secondary)]" : loser ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
          }`}
        >
          {/* 우선순위: bye(부전승) > slotLabel("1위"/"4위") > TBD */}
          {isBye && position === "away" ? "부전승" : slotLabel ?? "TBD"}
        </span>
      )}

      {/* 점수 — 승자는 더 크게(text-[12px]) + 강한 색상. 명암으로 승부 가시성 높임 */}
      <span
        className={`flex-shrink-0 tabular-nums ${
          winner
            ? "text-[12px] font-black text-[var(--color-primary)]"
            : isLive
              ? "font-bold text-[var(--color-primary)]"
              : "font-bold text-[var(--color-text-secondary)]"
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

  // 카드 컨테이너: 외곽선만 살짝, 내부 row 2개를 공간 gap으로 분리
  const wrapperClasses = [
    "relative flex flex-col gap-0.5",  // home/away row 사이 2px 간격
    SIZE_MAP[size],
    className,
  ].filter(Boolean).join(" ");

  // 각 row의 공통 스타일 (팀당 개별 카드 느낌)
  const rowBase = [
    "rounded-[3px] border overflow-hidden transition-all duration-150",  // 라운드 최소화 (12→3)
    isBye
      ? "border-dashed border-[var(--color-text-muted)] bg-[var(--color-surface)] opacity-70"
      : isLive
        ? "border-[var(--color-primary)] bg-[var(--color-card)]"
        : "border-[var(--color-text-muted)] bg-[var(--color-card)]",  // 테두리 진하게 border→text-muted
    !isBye && "hover:bg-[var(--color-surface)] cursor-pointer",
  ].filter(Boolean).join(" ");

  return (
    <div className={wrapperClasses}>
      {/* LIVE NOW 배지 */}
      {isLive && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] font-bold uppercase rounded z-10 text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          LIVE NOW
        </div>
      )}

      {/* 홈팀 — 개별 카드 */}
      <div className={rowBase}>
        <TeamRow match={match} team={match.homeTeam} score={match.homeScore} position="home" />
      </div>

      {/* 어웨이팀 — 개별 카드 (gap-0.5로 살짝 분리) */}
      <div className={rowBase}>
        <TeamRow match={match} team={match.awayTeam} score={match.awayScore} position="away" />
      </div>

      {/* 상태 뱃지 (모바일에서 사용) */}
      {showBadge && (isLive || match.status === "completed" || isBye) && (
        <div className="flex justify-center py-0.5">
          <StatusBadge status={match.status} />
        </div>
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

  // 좌측 세로 띠 색상 (유니폼 / 미확정 시 home=red, away=navy)
  const isWhiteColor = (c: string | null | undefined) =>
    !c || c.toLowerCase() === "#ffffff" || c.toLowerCase() === "#fff";
  const homeStripeColor = match.homeTeam && !isWhiteColor(match.homeTeam.team.primaryColor)
    ? match.homeTeam.team.primaryColor!
    : "var(--color-primary)";
  const awayStripeColor = match.awayTeam && !isWhiteColor(match.awayTeam.team.primaryColor)
    ? match.awayTeam.team.primaryColor!
    : "var(--color-secondary)";

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
          className="w-1 self-stretch rounded-full mr-3 flex-shrink-0"
          style={{ backgroundColor: homeStripeColor }}
        />
        {/* 홈팀명: teamId가 있으면 팀 페이지 링크 */}
        {/* 모바일은 데스크톱보다 공간 여유 있으므로 뱃지 11px로 살짝 크게 */}
        {match.homeTeam ? (
          <Link
            href={`/teams/${match.homeTeam.teamId}`}
            className={`flex-1 min-w-0 flex items-center gap-1.5 font-medium hover:underline ${
              homeLoser ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
            }`}
          >
            {match.homeTeam.seedNumber != null && (
              <span
                className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold flex-shrink-0 tabular-nums"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-muted)",
                }}
              >
                #{match.homeTeam.seedNumber}
              </span>
            )}
            <span className="truncate">{match.homeTeam.team.name}</span>
          </Link>
        ) : (
          // Phase 2C: 홈팀 슬롯 라벨 우선 표시 (예: "1위")
          <span
            className={`flex-1 font-medium ${
              match.homeSlotLabel ? "italic text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]"
            }`}
          >
            {match.homeSlotLabel ?? "TBD"}
          </span>
        )}
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
          className="w-1 self-stretch rounded-full mr-3 flex-shrink-0"
          style={{ backgroundColor: awayStripeColor }}
        />
        {/* 어웨이팀명: teamId가 있으면 팀 페이지 링크 */}
        {match.awayTeam ? (
          <Link
            href={`/teams/${match.awayTeam.teamId}`}
            className={`flex-1 min-w-0 flex items-center gap-1.5 font-medium hover:underline ${
              awayLoser ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
            }`}
          >
            {match.awayTeam.seedNumber != null && (
              <span
                className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold flex-shrink-0 tabular-nums"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-muted)",
                }}
              >
                #{match.awayTeam.seedNumber}
              </span>
            )}
            <span className="truncate">{match.awayTeam.team.name}</span>
          </Link>
        ) : (
          // Phase 2C: 어웨이팀 슬롯 라벨 표시 (bye가 우선)
          <span
            className={`flex-1 font-medium ${
              !isBye && match.awaySlotLabel ? "italic text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]"
            }`}
          >
            {isBye ? "부전승" : match.awaySlotLabel ?? "TBD"}
          </span>
        )}
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
