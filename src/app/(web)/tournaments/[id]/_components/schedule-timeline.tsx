"use client";

/**
 * 일정 타임라인 뷰 + 팀별 필터
 * - 상단: 팀 필터 버튼 가로 스크롤
 * - 본문: 날짜별 그룹 > 타임라인 (왼쪽 시간, 가운데 점+선, 오른쪽 매치 카드)
 * - 선택 팀 경기 하이라이트 (왼쪽 primary 보더)
 */

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

// -- 타입 정의: 서버에서 넘겨받을 경기 데이터 구조 --
export interface ScheduleMatch {
  id: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
  roundName: string | null;
  scheduledAt: string | null; // ISO 문자열로 직렬화됨
  courtNumber: string | null;
}

export interface ScheduleTeam {
  id: string;
  name: string;
}

interface Props {
  matches: ScheduleMatch[];
  teams: ScheduleTeam[];
}

// -- 날짜별로 경기를 그룹핑하는 유틸 --
function groupByDate(matches: ScheduleMatch[]): Map<string, ScheduleMatch[]> {
  const groups = new Map<string, ScheduleMatch[]>();

  for (const match of matches) {
    // 날짜가 없으면 "미정" 그룹으로
    const dateKey = match.scheduledAt
      ? new Date(match.scheduledAt).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        })
      : "일정 미정";

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(match);
  }

  return groups;
}

// -- 시간 포맷 유틸 (HH:MM) --
function formatTime(isoString: string | null): string {
  if (!isoString) return "--:--";
  const d = new Date(isoString);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// -- 상태 배지 렌더링 --
function StatusBadge({ status }: { status: string | null }) {
  if (status === "completed") {
    return <Badge variant="info">종료</Badge>;
  }
  if (status === "live" || status === "in_progress") {
    return <Badge variant="error">LIVE</Badge>;
  }
  return <Badge variant="default">예정</Badge>;
}

export function ScheduleTimeline({ matches, teams }: Props) {
  // 선택된 팀 ID (null = 전체 보기)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // 선택된 팀으로 필터링된 경기 목록
  const filteredMatches = useMemo(() => {
    if (!selectedTeam) return matches;
    // 팀 이름으로 필터 (선택한 팀이 홈 또는 어웨이인 경기)
    const teamName = teams.find((t) => t.id === selectedTeam)?.name;
    if (!teamName) return matches;
    return matches.filter(
      (m) => m.homeTeamName === teamName || m.awayTeamName === teamName
    );
  }, [matches, selectedTeam, teams]);

  // 날짜별 그룹핑
  const dateGroups = useMemo(() => groupByDate(filteredMatches), [filteredMatches]);

  // 선택된 팀 이름 (하이라이트용)
  const selectedTeamName = selectedTeam
    ? teams.find((t) => t.id === selectedTeam)?.name ?? null
    : null;

  return (
    <div>
      {/* 팀 필터 버튼 그룹: 가로 스크롤 */}
      {teams.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {/* "전체" 버튼 */}
          <button
            onClick={() => setSelectedTeam(null)}
            className="flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: selectedTeam === null ? "var(--color-primary)" : "var(--color-elevated)",
              color: selectedTeam === null ? "white" : "var(--color-text-secondary)",
              border: `1px solid ${selectedTeam === null ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
          >
            전체
          </button>
          {/* 각 팀 버튼 */}
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id === selectedTeam ? null : team.id)}
              className="flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedTeam === team.id ? "var(--color-primary)" : "var(--color-elevated)",
                color: selectedTeam === team.id ? "white" : "var(--color-text-secondary)",
                border: `1px solid ${selectedTeam === team.id ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}

      {/* 날짜별 타임라인 */}
      {dateGroups.size === 0 && (
        <div
          className="rounded-[var(--radius-card)] border p-8 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-muted)" }}
        >
          {selectedTeam ? "선택한 팀의 일정이 없습니다." : "일정이 없습니다."}
        </div>
      )}

      <div className="space-y-8">
        {Array.from(dateGroups.entries()).map(([dateLabel, dayMatches]) => (
          <div key={dateLabel}>
            {/* 날짜 헤더 */}
            <div className="mb-4 flex items-center gap-3">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                calendar_today
              </span>
              <h2
                className="text-base font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {dateLabel}
              </h2>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {dayMatches.length}경기
              </span>
            </div>

            {/* 타임라인 목록 */}
            <div className="relative ml-2">
              {dayMatches.map((match, idx) => {
                // 이 경기에 선택된 팀이 참여하는지 확인 (하이라이트용)
                const isHighlighted =
                  selectedTeamName !== null &&
                  (match.homeTeamName === selectedTeamName || match.awayTeamName === selectedTeamName);

                // 홈/어웨이 중 이긴 쪽 판별 (종료 경기만)
                const isCompleted = match.status === "completed";
                const homeWins = isCompleted && (match.homeScore ?? 0) > (match.awayScore ?? 0);
                const awayWins = isCompleted && (match.awayScore ?? 0) > (match.homeScore ?? 0);

                return (
                  <div key={match.id} className="flex gap-4">
                    {/* 왼쪽: 시간 표시 */}
                    <div
                      className="w-14 flex-shrink-0 pt-4 text-right text-sm font-medium"
                      style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-heading)" }}
                    >
                      {formatTime(match.scheduledAt)}
                    </div>

                    {/* 가운데: 타임라인 점 + 선 */}
                    <div className="relative flex flex-col items-center">
                      {/* 세로 라인 (마지막 항목 제외) */}
                      {idx < dayMatches.length - 1 && (
                        <div
                          className="absolute left-1/2 top-6 h-full w-px -translate-x-1/2"
                          style={{ backgroundColor: "var(--color-border)" }}
                        />
                      )}
                      {/* 점 */}
                      <div
                        className="relative z-10 mt-4 h-3 w-3 flex-shrink-0 rounded-full border-2"
                        style={{
                          borderColor: match.status === "live" || match.status === "in_progress"
                            ? "var(--color-error)"
                            : isHighlighted
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                          backgroundColor: match.status === "live" || match.status === "in_progress"
                            ? "var(--color-error)"
                            : isHighlighted
                            ? "var(--color-primary)"
                            : "var(--color-card)",
                        }}
                      />
                    </div>

                    {/* 오른쪽: 매치 카드 */}
                    <div
                      className="mb-4 flex-1 rounded-[var(--radius-card)] border p-4 transition-all"
                      style={{
                        borderColor: isHighlighted ? "var(--color-primary)" : "var(--color-border)",
                        backgroundColor: "var(--color-card)",
                        // 하이라이트된 경기는 왼쪽 보더 강조
                        borderLeftWidth: isHighlighted ? "3px" : undefined,
                        borderLeftColor: isHighlighted ? "var(--color-primary)" : undefined,
                      }}
                    >
                      {/* 라운드명 + 상태 배지 */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {match.roundName && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {match.roundName}
                            </span>
                          )}
                          {match.courtNumber && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {match.courtNumber}코트
                            </span>
                          )}
                        </div>
                        <StatusBadge status={match.status} />
                      </div>

                      {/* 팀 VS 팀 + 스코어 */}
                      <div className="flex items-center justify-between">
                        {/* 홈팀 */}
                        <div className="flex-1 text-left">
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: homeWins
                                ? "var(--color-text-primary)"
                                : isCompleted
                                ? "var(--color-text-secondary)"
                                : "var(--color-text-primary)",
                            }}
                          >
                            {match.homeTeamName ?? "TBD"}
                          </span>
                        </div>

                        {/* 스코어 or VS */}
                        <div className="mx-3 flex-shrink-0">
                          {isCompleted || match.status === "live" || match.status === "in_progress" ? (
                            <div
                              className="flex items-center gap-1 rounded-full px-3 py-1"
                              style={{ backgroundColor: "var(--color-elevated)" }}
                            >
                              <span
                                className="text-sm font-bold"
                                style={{ fontFamily: "var(--font-heading)", color: homeWins ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                              >
                                {match.homeScore ?? 0}
                              </span>
                              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>:</span>
                              <span
                                className="text-sm font-bold"
                                style={{ fontFamily: "var(--font-heading)", color: awayWins ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                              >
                                {match.awayScore ?? 0}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="rounded-full px-3 py-1 text-xs font-bold"
                              style={{
                                backgroundColor: "var(--color-primary)",
                                color: "white",
                              }}
                            >
                              VS
                            </span>
                          )}
                        </div>

                        {/* 어웨이팀 */}
                        <div className="flex-1 text-right">
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: awayWins
                                ? "var(--color-text-primary)"
                                : isCompleted
                                ? "var(--color-text-secondary)"
                                : "var(--color-text-primary)",
                            }}
                          >
                            {match.awayTeamName ?? "TBD"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
