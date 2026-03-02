// 싱글 일리미네이션 대진표 자동 생성
// 스키마: TournamentMatch (next_match_id, bracket_level, bracket_position 이미 존재)

export interface BracketTeam {
  id: bigint;
  seedNumber: number | null;
}

export interface MatchToCreate {
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  status: string;
  bracketPosition: number;
  bracketLevel: number;
  roundName: string;
  roundNumber: number;
  matchNumber: number;
  tournamentId: string;
}

function getRoundName(round: number, totalRounds: number): string {
  const depth = totalRounds - round + 1;
  if (depth === 1) return "결승";
  if (depth === 2) return "4강";
  if (depth === 3) return "8강";
  if (depth === 4) return "16강";
  return `${Math.pow(2, depth)}강`;
}

export function generateSingleEliminationBracket(
  teams: BracketTeam[],
  tournamentId: string,
): MatchToCreate[] {
  const n = teams.length;
  if (n < 2) throw new Error("팀이 2개 이상 필요합니다.");

  const totalSlots = Math.pow(2, Math.ceil(Math.log2(n)));
  const rounds = Math.ceil(Math.log2(totalSlots));
  const byeCount = totalSlots - n;

  // 시드 정렬 (null 시드는 마지막)
  const sorted = [...teams].sort((a, b) => {
    if (a.seedNumber === null) return 1;
    if (b.seedNumber === null) return -1;
    return a.seedNumber - b.seedNumber;
  });

  // 상위 byeCount팀에 Bye 부여
  const byeTeamIds = new Set(sorted.slice(0, byeCount).map((t) => t.id));

  // 대진 쌍: (1 vs totalSlots), (2 vs totalSlots-1), ...
  const pairs: [number, number][] = [];
  for (let i = 0; i < totalSlots / 2; i++) {
    pairs.push([i + 1, totalSlots - i]);
  }

  const matchesToCreate: MatchToCreate[] = [];

  // 1라운드
  for (let i = 0; i < pairs.length; i++) {
    const [seedA, seedB] = pairs[i];
    const teamA = sorted[seedA - 1] ?? null;
    const teamB = sorted[seedB - 1] ?? null;
    const isBye = teamA !== null && byeTeamIds.has(teamA.id);

    matchesToCreate.push({
      homeTeamId: teamA?.id ?? null,
      awayTeamId: isBye ? null : (teamB?.id ?? null),
      status: isBye ? "bye" : "scheduled",
      bracketPosition: i + 1,
      bracketLevel: rounds - 1,
      roundName: `${totalSlots}강`,
      roundNumber: 1,
      matchNumber: i + 1,
      tournamentId,
    });
  }

  // 이후 라운드 (TBD 슬롯)
  for (let round = 2; round <= rounds; round++) {
    const matchCount = totalSlots / Math.pow(2, round);
    for (let i = 0; i < matchCount; i++) {
      matchesToCreate.push({
        homeTeamId: null,
        awayTeamId: null,
        status: "scheduled",
        bracketPosition: i + 1,
        bracketLevel: rounds - round,
        roundName: getRoundName(round, rounds),
        roundNumber: round,
        matchNumber: i + 1,
        tournamentId,
      });
    }
  }

  return matchesToCreate;
}

/**
 * 각 1라운드 경기 → 다음 라운드 경기의 next_match_id 연결 인덱스 계산
 * i번째 경기(0-indexed) → Math.floor(i/2) 번째 다음라운드 경기
 */
export function computeNextMatchLinks(
  matchesToCreate: MatchToCreate[],
): Map<number, number> {
  // roundNumber별로 그룹
  const byRound = new Map<number, MatchToCreate[]>();
  for (const m of matchesToCreate) {
    const r = m.roundNumber;
    if (!byRound.has(r)) byRound.set(r, []);
    byRound.get(r)!.push(m);
  }

  const maxRound = Math.max(...byRound.keys());
  // key: matchesToCreate 인덱스, value: 다음 라운드 matchesToCreate 인덱스
  const links = new Map<number, number>();

  for (let round = 1; round < maxRound; round++) {
    const current = byRound.get(round) ?? [];
    const next = byRound.get(round + 1) ?? [];
    for (let i = 0; i < current.length; i++) {
      const currentIdx = matchesToCreate.indexOf(current[i]);
      const nextIdx = matchesToCreate.indexOf(next[Math.floor(i / 2)]);
      if (currentIdx !== -1 && nextIdx !== -1) {
        links.set(currentIdx, nextIdx);
      }
    }
  }

  return links;
}
