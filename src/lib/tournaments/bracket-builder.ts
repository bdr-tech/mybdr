// 대진표 시각화용 데이터 변환
// DB TournamentMatch → RoundGroup[] (라운드별 그룹 구조)

// ── 타입 정의 ─────────────────────────────────────────

export type MatchStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "bye"
  | "cancelled";

export type TeamSlot = {
  id: string;
  teamId: string;
  // 시드 번호: 리그 최종 순위(1=1위, 2=2위, ...). 시드 미배정 팀은 null
  // MatchCard에서 "#1", "#4" 뱃지로 표시
  seedNumber: number | null;
  team: { name: string; primaryColor: string | null };
} | null;

export type BracketMatch = {
  id: string;
  uuid: string;
  roundName: string;
  roundNumber: number;
  bracketLevel: number;
  bracketPosition: number;
  matchNumber: number | null;
  status: MatchStatus;
  homeTeam: TeamSlot;
  awayTeam: TeamSlot;
  homeScore: number;
  awayScore: number;
  winnerTeamId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: "home" | "away" | null;
  scheduledAt: string | null;
  // ✨ Phase 2C: 팀이 아직 확정되지 않은 빈 슬롯용 라벨
  // 예: "1위", "4위", "준결승 1 패자" — settings JSON에서 읽어옴
  // team이 null일 때만 MatchCard에서 이 라벨을 표시한다
  homeSlotLabel: string | null;
  awaySlotLabel: string | null;
};

export type RoundGroup = {
  roundNumber: number;
  roundName: string;
  matches: BracketMatch[];
  hasLive: boolean;
  hasCompleted: boolean;
};

// ── DB 매치 → BracketMatch 변환 ──────────────────────

type DbMatch = {
  id: bigint;
  uuid: string;
  roundName: string | null;
  round_number: number | null;
  bracket_level: number | null;
  bracket_position: number | null;
  match_number: number | null;
  status: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winner_team_id: bigint | null;
  next_match_id: bigint | null;
  next_match_slot: string | null;
  scheduledAt: Date | null;
  // Phase 2C: JSON 컬럼에 슬롯 라벨 저장 (homeSlotLabel/awaySlotLabel)
  // 쿼리에서 settings를 포함하지 않아도 옵셔널이라 안전
  settings?: unknown;
  homeTeam: {
    id: bigint;
    teamId: bigint;
    seedNumber: number | null; // DB TournamentTeam.seed_number
    team: { name: string; primaryColor: string | null };
  } | null;
  awayTeam: {
    id: bigint;
    teamId: bigint;
    seedNumber: number | null;
    team: { name: string; primaryColor: string | null };
  } | null;
};

function toTeamSlot(
  t: DbMatch["homeTeam"] | DbMatch["awayTeam"],
): TeamSlot {
  if (!t) return null;
  return {
    id: t.id.toString(),
    teamId: t.teamId.toString(),
    // seedNumber가 undefined일 수 있으므로 ?? null로 안전 처리
    seedNumber: t.seedNumber ?? null,
    team: {
      name: t.team.name,
      primaryColor: t.team.primaryColor,
    },
  };
}

function toBracketMatch(m: DbMatch): BracketMatch {
  // settings JSON에서 슬롯 라벨 추출 (없으면 null)
  // 타입: Prisma Json 이라 Record로 안전 변환
  const settings = (m.settings ?? null) as Record<string, unknown> | null;
  const homeSlotLabel = typeof settings?.homeSlotLabel === "string" ? settings.homeSlotLabel : null;
  const awaySlotLabel = typeof settings?.awaySlotLabel === "string" ? settings.awaySlotLabel : null;

  return {
    id: m.id.toString(),
    uuid: m.uuid,
    roundName: m.roundName ?? `라운드 ${m.round_number ?? 0}`,
    roundNumber: m.round_number ?? 0,
    bracketLevel: m.bracket_level ?? 0,
    bracketPosition: m.bracket_position ?? 0,
    matchNumber: m.match_number,
    status: (m.status as MatchStatus) ?? "scheduled",
    homeTeam: toTeamSlot(m.homeTeam),
    awayTeam: toTeamSlot(m.awayTeam),
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
    winnerTeamId: m.winner_team_id?.toString() ?? null,
    nextMatchId: m.next_match_id?.toString() ?? null,
    nextMatchSlot: (m.next_match_slot as "home" | "away") ?? null,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    homeSlotLabel,
    awaySlotLabel,
  };
}

// ── 라운드 그룹 빌드 ─────────────────────────────────

export function buildRoundGroups(dbMatches: DbMatch[]): RoundGroup[] {
  const matches = dbMatches.map(toBracketMatch);

  // round_number 기준으로 그룹핑
  const grouped = new Map<number, BracketMatch[]>();
  for (const m of matches) {
    if (!grouped.has(m.roundNumber)) grouped.set(m.roundNumber, []);
    grouped.get(m.roundNumber)!.push(m);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([roundNumber, roundMatches]) => {
      const sorted = roundMatches.sort(
        (a, b) => a.bracketPosition - b.bracketPosition,
      );
      return {
        roundNumber,
        roundName: sorted[0].roundName,
        matches: sorted,
        hasLive: sorted.some((m) => m.status === "in_progress"),
        hasCompleted: sorted.some((m) => m.status === "completed"),
      };
    });
}

// ── SVG 연결선 좌표 계산 ────────────────────────────

export type ConnectorPath = {
  id: string;
  d: string;
  isActive: boolean;
};

export type BracketConfig = {
  cardWidth: number;
  cardHeight: number;
  columnGap: number;   // 연결선 영역 포함 라운드 간 간격
};

export type MatchPosition = {
  matchId: string;
  x: number;
  y: number;
};

/**
 * 각 매치 카드의 절대 위치(좌상단 기준) 계산
 *
 * 첫 라운드: 등간격 배치
 * 이후 라운드: 이전 라운드에서 페어를 이루는 두 매치의 중간값
 */
export function computeMatchPositions(
  rounds: RoundGroup[],
  config: BracketConfig,
): MatchPosition[] {
  const { cardWidth, cardHeight, columnGap } = config;
  const positions: MatchPosition[] = [];
  const posMap = new Map<string, { x: number; y: number }>();

  if (rounds.length === 0) return positions;

  const minGap = cardHeight + 16;

  // 첫 라운드
  for (let i = 0; i < rounds[0].matches.length; i++) {
    const match = rounds[0].matches[i];
    const pos = { x: 0, y: i * minGap };
    posMap.set(match.id, pos);
    positions.push({ matchId: match.id, ...pos });
  }

  // 이후 라운드
  for (let r = 1; r < rounds.length; r++) {
    const prevRound = rounds[r - 1];
    const currentRound = rounds[r];
    const xOffset = r * (cardWidth + columnGap);

    for (let i = 0; i < currentRound.matches.length; i++) {
      const match = currentRound.matches[i];
      const prevIdx1 = i * 2;
      const prevIdx2 = i * 2 + 1;

      let y = 0;
      if (prevIdx1 < prevRound.matches.length && prevIdx2 < prevRound.matches.length) {
        const pos1 = posMap.get(prevRound.matches[prevIdx1].id);
        const pos2 = posMap.get(prevRound.matches[prevIdx2].id);
        if (pos1 && pos2) {
          y = (pos1.y + pos2.y) / 2;
        }
      } else if (prevIdx1 < prevRound.matches.length) {
        const pos1 = posMap.get(prevRound.matches[prevIdx1].id);
        if (pos1) y = pos1.y;
      }

      const pos = { x: xOffset, y };
      posMap.set(match.id, pos);
      positions.push({ matchId: match.id, ...pos });
    }
  }

  return positions;
}

/**
 * SVG 연결선 경로 계산
 *
 * 계단형(step) 경로: 카드 우측 → 수평 → 수직 → 수평 → 다음 카드 좌측
 */
export function computeConnectorPaths(
  rounds: RoundGroup[],
  config: BracketConfig,
): ConnectorPath[] {
  const { cardWidth, cardHeight, columnGap } = config;
  const paths: ConnectorPath[] = [];

  // 위치 맵 재사용
  const posMap = new Map<string, { x: number; y: number }>();
  const allPositions = computeMatchPositions(rounds, config);
  for (const p of allPositions) {
    posMap.set(p.matchId, { x: p.x, y: p.y });
  }

  for (let r = 0; r < rounds.length - 1; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];

    for (let i = 0; i < currentRound.matches.length; i++) {
      const match = currentRound.matches[i];
      const nextMatchIdx = Math.floor(i / 2);

      if (nextMatchIdx >= nextRound.matches.length) continue;

      const nextMatch = nextRound.matches[nextMatchIdx];
      const fromPos = posMap.get(match.id);
      const toPos = posMap.get(nextMatch.id);

      if (!fromPos || !toPos) continue;

      const x1 = fromPos.x + cardWidth;
      const y1 = fromPos.y + cardHeight / 2;
      const x2 = toPos.x;
      const y2 = toPos.y + cardHeight / 2;
      const midX = x1 + (x2 - x1) / 2;

      const d = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;

      // 이유: NBA 스타일 "승자 경로 강조" — 승자가 확정된 매치(winnerTeamId 존재)만 active로 간주.
      // 진행중(in_progress)은 아직 승자 미확정이지만 시각적 연속성을 위해 포함.
      const isActive =
        match.winnerTeamId != null ||
        match.status === "in_progress" ||
        nextMatch.status === "in_progress";

      paths.push({
        id: `${match.id}-${nextMatch.id}`,
        d,
        isActive,
      });
    }
  }

  return paths;
}

/**
 * 전체 대진표 영역 크기 계산
 */
export function computeBracketDimensions(
  rounds: RoundGroup[],
  config: BracketConfig,
): { width: number; height: number } {
  if (rounds.length === 0) return { width: 0, height: 0 };

  const { cardWidth, cardHeight, columnGap } = config;
  const firstMatchCount = rounds[0].matches.length;
  const minGap = cardHeight + 16;

  const width =
    rounds.length * cardWidth +
    (rounds.length - 1) * columnGap;

  const height = firstMatchCount * minGap;

  return { width, height };
}
