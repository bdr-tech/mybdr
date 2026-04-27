"use client";

/**
 * 대진표 v2 — 우측 "시드 순위" 카드
 *
 * 시안: Bracket.jsx L204~216
 *  - 행: [#시드] [팀로고] [팀명] [레이팅(시안 1684 등)]
 *
 * 데이터 매핑 (사용자 원칙: DB 미지원도 자리는 유지):
 *  - 시드: 1부터 정렬 순서대로 부여 (DB seedNumber 없는 경우 인덱스+1)
 *  - 레이팅: teams.rating 미존재 → 'wins' 값으로 대체 표시 (시안 충실도 유지 + 의미는 "승수")
 *
 * 정렬 우선순위:
 *  - leagueTeams가 있으면 그것 사용 (이미 winRate순 정렬됨)
 *  - 아니면 groupTeams 사용 (조별)
 *  - 둘 다 없으면 카드 자체를 렌더하지 않음 (상위에서 분기)
 */

interface SeedTeam {
  // 표시용 ID (key)
  id: string;
  // 팀 페이지 라우팅용 실제 team id
  teamId: string;
  // 팀명 (한국어)
  teamName: string;
  // 표시용 wins (시안 레이팅 자리에 들어감)
  wins: number;
}

interface V2BracketSeedRankingProps {
  teams: SeedTeam[];
}

// 팀명에서 약어 추출 (이니셜 3자) — 시안의 Avatar 자리 대체용
function getTeamInitials(name: string): string {
  if (!name) return "?";
  // 한글이면 첫 글자, 영문이면 대문자만 모아서 최대 3자
  const onlyAscii = name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  if (onlyAscii) {
    const parts = onlyAscii.split(/\s+/);
    if (parts.length >= 2) {
      return parts.map((p) => p[0]).join("").slice(0, 3).toUpperCase();
    }
    return onlyAscii.slice(0, 3).toUpperCase();
  }
  // 한글: 처음 2글자
  return name.slice(0, 2);
}

export function V2BracketSeedRanking({ teams }: V2BracketSeedRankingProps) {
  if (!teams || teams.length === 0) {
    return null;
  }

  return (
    <div
      // 시안 .card
      className="rounded-md border p-5"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
        시드 순위
      </h3>

      <div className="flex flex-col gap-1.5">
        {teams.map((t, idx) => {
          const seed = idx + 1;
          const initials = getTeamInitials(t.teamName);
          return (
            <div
              key={t.id}
              // 시안: 24px / 28px / 1fr / auto 4-col grid
              className="grid items-center gap-2 rounded px-2 py-1.5"
              style={{
                gridTemplateColumns: "24px 28px minmax(0,1fr) auto",
                backgroundColor: "var(--color-surface)",
              }}
            >
              {/* 시드 번호 */}
              <span
                className="text-[11px] font-mono font-bold"
                style={{ color: "var(--color-text-muted)" }}
              >
                #{seed}
              </span>

              {/* 팀 로고 자리 — 이니셜 박스로 대체 (이미지 없으면 fallback) */}
              <div
                className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {initials}
              </div>

              {/* 팀명 */}
              <span
                className="truncate text-xs font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {t.teamName}
              </span>

              {/* 레이팅 자리: DB rating 미존재 → wins 값으로 대체 (시안 충실도 유지) */}
              <span
                className="text-[11px] font-mono"
                style={{ color: "var(--color-text-muted)" }}
                title="현재 승수 (레이팅 시스템 준비 중)"
              >
                {t.wins}승
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { SeedTeam };
