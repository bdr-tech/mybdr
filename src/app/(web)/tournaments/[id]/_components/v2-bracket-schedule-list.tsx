"use client";

/**
 * 대진표 v2 — 좌하단 "경기 일정" 카드
 *
 * 시안: Bracket.jsx L181~201
 *  - 카드 제목: "경기 일정"
 *  - 행: [날짜] [상태배지] [팀A vs 팀B + 코트] [점수]
 *  - 상태: LIVE(red), 완료(ok), 예정(soft), TBD
 *
 * 데이터: BracketView가 받는 RoundGroup[]에서 모든 매치를 평탄화하여 시간순 정렬
 *  (대진표 탭의 모든 매치를 한 번 더 리스트로 보여주는 영역 — 시안 그대로)
 */

import type { RoundGroup, BracketMatch } from "@/lib/tournaments/bracket-builder";

interface V2BracketScheduleListProps {
  rounds: RoundGroup[];
}

// 매치 상태 → 배지 색상/텍스트
function getStatusBadge(m: BracketMatch): { text: string; color: string; bg: string } {
  if (m.status === "in_progress") {
    return { text: "LIVE", color: "#ffffff", bg: "var(--color-error)" };
  }
  if (m.status === "completed") {
    return { text: "완료", color: "#ffffff", bg: "var(--color-success)" };
  }
  // 팀 둘 다 미정 → TBD
  if (!m.homeTeam && !m.awayTeam) {
    return { text: "TBD", color: "var(--color-text-muted)", bg: "var(--color-surface)" };
  }
  return { text: "예정", color: "var(--color-text-secondary)", bg: "var(--color-surface)" };
}

// 날짜/시간 포맷 (예: "05.09 14:00")
function formatScheduledAt(iso: string | null): string {
  if (!iso) return "일정 미정";
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}.${dd} ${hh}:${mi}`;
  } catch {
    return "일정 미정";
  }
}

// 팀 이름 포맷: TBD인 경우 "승자 vs 승자" 표시
function formatTeamName(slot: BracketMatch["homeTeam"], slotLabel: string | null): string {
  if (slot) return slot.team.name;
  if (slotLabel) return slotLabel;
  return "TBD";
}

export function V2BracketScheduleList({ rounds }: V2BracketScheduleListProps) {
  // 모든 매치 평탄화 + 시간순 정렬 (미정은 뒤로)
  const allMatches: BracketMatch[] = rounds.flatMap((r) => r.matches);
  const sorted = [...allMatches].sort((a, b) => {
    if (!a.scheduledAt && !b.scheduledAt) return 0;
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  return (
    <div
      // 시안 .card
      className="rounded-md border p-5"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      <h3 className="mb-3 text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
        경기 일정
      </h3>

      {sorted.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          예정된 경기가 없습니다.
        </p>
      ) : (
        <div className="flex flex-col">
          {sorted.map((m, idx) => {
            const badge = getStatusBadge(m);
            const homeName = formatTeamName(m.homeTeam, m.homeSlotLabel);
            const awayName = formatTeamName(m.awayTeam, m.awaySlotLabel);
            // 점수 표시: 완료/진행 중 점수, 그 외 "—"
            const scoreText =
              m.status === "completed" || m.status === "in_progress"
                ? `${m.homeScore} : ${m.awayScore}`
                : "—";
            const isDone = m.status === "completed";
            const isLive = m.status === "in_progress";

            return (
              <div
                key={m.id}
                // 시안: 110px / 60px / 1fr / auto 4-col grid
                className="grid items-center gap-3 py-3"
                style={{
                  gridTemplateColumns: "minmax(80px,110px) 56px minmax(0,1fr) auto",
                  borderBottom:
                    idx < sorted.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                {/* 날짜 */}
                <div
                  className="text-[11px] font-mono"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {formatScheduledAt(m.scheduledAt)}
                </div>

                {/* 상태 배지 */}
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border:
                      badge.bg === "var(--color-surface)"
                        ? "1px solid var(--color-border)"
                        : undefined,
                  }}
                >
                  {badge.text}
                </span>

                {/* 팀 매치업 + 코트 */}
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {homeName}
                  <span className="mx-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    vs
                  </span>
                  {awayName}
                  {/* 코트 정보 — RoundGroup → BracketMatch에는 court 필드 없음. 추후 매치 데이터 확장 시 추가 */}
                </div>

                {/* 점수 */}
                <div
                  className="text-base font-extrabold tabular-nums"
                  style={{
                    fontFamily: "var(--font-heading, var(--font-display))",
                    color: isDone
                      ? "var(--color-success)"
                      : isLive
                      ? "var(--color-error)"
                      : "var(--color-text-primary)",
                  }}
                >
                  {scoreText}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
