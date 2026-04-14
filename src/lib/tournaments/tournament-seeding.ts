import { prisma } from "@/lib/db/prisma";

// 팀별 순위 결과 타입
// rank는 1부터 시작 (1위, 2위, ...)
type RankedTeam = {
  tournamentTeamId: bigint;
  rank: number;
};

/**
 * 리그 결과로부터 팀 순위 계산
 * 정렬 우선순위: 승률 → 득실차 → 다득점
 * - 리그 경기만 집계 (round_number === null)
 * - completed/live 경기 모두 득실점은 합산 (승패는 completed만)
 */
export async function calculateLeagueRanking(tournamentId: string): Promise<RankedTeam[]> {
  // 팀 목록과 리그 경기를 동시에 조회 (병렬 처리로 속도 개선)
  const [teams, matches] = await Promise.all([
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      select: { id: true },
    }),
    prisma.tournamentMatch.findMany({
      where: {
        tournamentId,
        round_number: null, // 리그 경기만 (토너먼트 경기는 round_number 부여됨)
        status: { in: ["completed", "live"] },
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        status: true,
      },
    }),
  ]);

  // 팀별 전적 집계 버킷 초기화
  // key는 tournamentTeamId를 string으로 변환 (BigInt는 Map 키로 동작하지만 Record에서 안전하게 쓰려고)
  const stats: Record<string, { wins: number; losses: number; pointsFor: number; pointsAgainst: number }> = {};
  for (const t of teams) {
    stats[t.id.toString()] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
  }

  // 경기 순회하며 점수/승패 합산
  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    const hid = m.homeTeamId.toString();
    const aid = m.awayTeamId.toString();
    const hs = m.homeScore ?? 0;
    const as_ = m.awayScore ?? 0;

    // 득실점은 live/completed 모두 누적
    if (stats[hid]) {
      stats[hid].pointsFor += hs;
      stats[hid].pointsAgainst += as_;
    }
    if (stats[aid]) {
      stats[aid].pointsFor += as_;
      stats[aid].pointsAgainst += hs;
    }

    // 승패 카운트는 completed 경기만 (live는 진행 중이라 최종 아님)
    if (m.status === "completed") {
      if (hs > as_) {
        if (stats[hid]) stats[hid].wins++;
        if (stats[aid]) stats[aid].losses++;
      } else if (as_ > hs) {
        if (stats[aid]) stats[aid].wins++;
        if (stats[hid]) stats[hid].losses++;
      }
      // 동점은 농구 규칙상 연장으로 결정되므로 여기선 무시 (데이터상 발생 어려움)
    }
  }

  // 정렬: 승률 → 득실차 → 다득점
  const ranked = teams
    .map((t) => {
      const s = stats[t.id.toString()];
      const gp = s.wins + s.losses;
      return {
        tournamentTeamId: t.id,
        wins: s.wins,
        losses: s.losses,
        winRate: gp > 0 ? s.wins / gp : 0,
        pointDiff: s.pointsFor - s.pointsAgainst,
        pointsFor: s.pointsFor,
      };
    })
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      return b.pointsFor - a.pointsFor;
    });

  // rank 부여 (1부터 시작)
  return ranked.map((t, i) => ({ tournamentTeamId: t.tournamentTeamId, rank: i + 1 }));
}

// 1라운드 경기 타입 (rank 기반 — 실제 팀 매핑은 이후 단계에서)
type BracketMatchSeed = {
  homeRank: number | null;
  awayRank: number | null;
  bracketPosition: number;
};

/**
 * 토너먼트 대진 생성 (BYE 부전승 처리 포함)
 *
 * 알고리즘:
 * 1. knockoutSize와 참가 가능 팀 수 중 작은 값으로 실제 size 결정
 * 2. bracketSize = size 이상의 가장 작은 2의 제곱 (4,8,16,32...)
 * 3. byeCount = bracketSize - size  → 상위 시드가 부전승으로 2라운드 직행
 * 4. 1라운드: bracketSize/2개 슬롯 중 양쪽 seed 모두 실팀인 경우만 실제 경기 생성
 *
 * 예시:
 * - 4강: size=4, bracketSize=4, byeCount=0 → 1-4, 2-3 (2경기)
 * - 6강: size=6, bracketSize=8, byeCount=2 → 1,2 부전승 / 3-6, 4-5 (2경기)
 * - 8강: size=8, bracketSize=8, byeCount=0 → 1-8, 2-7, 3-6, 4-5 (4경기)
 * - 12강: size=12, bracketSize=16, byeCount=4 → 1~4 부전승 / 5-12, 6-11, 7-10, 8-9 (4경기)
 */
export function buildKnockoutBracket(
  ranking: RankedTeam[],
  knockoutSize: number,
): {
  rounds: Array<{
    roundNumber: number;
    matches: BracketMatchSeed[];
  }>;
  totalRounds: number;
  bracketSize: number;
} {
  // 참가 팀 수보다 knockoutSize가 크면 참가 팀 수로 제한
  const size = Math.min(knockoutSize, ranking.length);
  // 다음 2의 제곱 (예: 6→8, 12→16)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(size, 2))));
  // 전체 라운드 수 (log2 기준)
  const totalRounds = Math.log2(bracketSize);

  const rounds: Array<{ roundNumber: number; matches: BracketMatchSeed[] }> = [];

  // 1라운드 대진 구성 — 표준 시드 매칭: 1 vs bracketSize, 2 vs bracketSize-1, ...
  const firstRoundMatches: BracketMatchSeed[] = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const homeSeed = i + 1;
    const awaySeed = bracketSize - i;

    // size 초과 시드는 실제 팀이 없으므로 null (BYE)
    const homeRank = homeSeed <= size ? homeSeed : null;
    const awayRank = awaySeed <= size ? awaySeed : null;

    // 양쪽 다 실팀이면 1라운드 경기 생성, 한쪽만 있으면 부전승(1라운드 경기 없음 = 2라운드 직행)
    if (homeRank && awayRank) {
      firstRoundMatches.push({ homeRank, awayRank, bracketPosition: i });
    }
    // homeRank만 또는 awayRank만 있는 경우 → 1라운드에는 경기를 만들지 않음
    // (해당 팀은 부전승으로 다음 라운드에 자동 배치되어야 하지만,
    //  Phase 2A에서는 2라운드 이후 경기를 빈 슬롯으로 생성하므로 admin이 수동 배정 예정)
  }

  if (firstRoundMatches.length > 0) {
    rounds.push({ roundNumber: 1, matches: firstRoundMatches });
  }

  // 2라운드 이후: 승자가 채워질 빈 경기 틀 생성
  // 라운드 r의 경기 수 = bracketSize / 2^r
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r);
    const matches: BracketMatchSeed[] = [];
    for (let i = 0; i < matchCount; i++) {
      matches.push({ homeRank: null, awayRank: null, bracketPosition: i });
    }
    rounds.push({ roundNumber: r, matches });
  }

  return { rounds, totalRounds, bracketSize };
}

/**
 * 라운드 번호 → 한국어 라운드 이름 변환
 * 남은 경기 수 기준 ("결승", "준결승", "8강", "16강" ...)
 */
function getRoundName(roundNumber: number, totalRounds: number): string {
  // 해당 라운드에서 동시에 진행되는 팀 수 = 2^(totalRounds - roundNumber + 1)
  const remaining = Math.pow(2, totalRounds - roundNumber + 1);
  if (remaining === 2) return "결승";
  if (remaining === 4) return "준결승";
  if (remaining === 8) return "8강";
  if (remaining === 16) return "16강";
  if (remaining === 32) return "32강";
  return `${remaining}강`;
}

/**
 * 토너먼트 경기 DB insert
 *
 * 흐름:
 * 1) 기존 토너먼트 경기 존재 여부 확인 (중복 생성 방지)
 * 2) 리그 순위 계산
 * 3) 대진 빌드 (BYE 처리)
 * 4) rank → tournamentTeamId 매핑
 * 5) TournamentMatch 데이터 생성 (+ 옵션 3/4위전)
 * 6) createMany insert
 *
 * @returns 생성된 경기 수
 * @throws 이미 토너먼트 경기가 있거나 팀이 부족하면 Error
 */
export async function generateKnockoutMatches(
  tournamentId: string,
  knockoutSize: number,
  bronzeMatch: boolean = false,
): Promise<number> {
  // 1) 중복 생성 방지 — 이미 토너먼트 경기(round_number != null)가 있으면 중단
  const existing = await prisma.tournamentMatch.count({
    where: { tournamentId, round_number: { not: null } },
  });
  if (existing > 0) {
    throw new Error(`이미 ${existing}건의 토너먼트 경기가 존재합니다.`);
  }

  // 2) 리그 순위 계산
  const ranking = await calculateLeagueRanking(tournamentId);
  if (ranking.length < 2) {
    throw new Error("토너먼트 생성에 필요한 팀이 부족합니다.");
  }

  // 2-1) 리그 순위를 TournamentTeam.seedNumber에 저장
  // 이유: 토너먼트 경기 카드에서 "#1 제이크루 vs #4 몽키즈" 형태의 시드 뱃지 표시용
  // 별도 계산 없이 DB 조회만으로 시드 번호를 읽을 수 있어 API 단순화
  for (const r of ranking) {
    await prisma.tournamentTeam.update({
      where: { id: r.tournamentTeamId },
      data: { seedNumber: r.rank },
    });
  }

  // 3) 대진 빌드
  const { rounds, totalRounds } = buildKnockoutBracket(ranking, knockoutSize);

  // 4) rank → tournamentTeamId 매핑 (Map으로 O(1) 조회)
  const rankMap = new Map<number, bigint>(ranking.map((r) => [r.rank, r.tournamentTeamId]));

  // 5) match_number는 리그 경기와 이어지도록 기존 최댓값 + 1부터 시작
  const lastMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId },
    orderBy: { match_number: "desc" },
    select: { match_number: true },
  });
  let nextMatchNumber = (lastMatch?.match_number ?? 0) + 1;

  // createMany용 데이터 배열 생성
  const matchData: Array<{
    tournamentId: string;
    homeTeamId: bigint | null;
    awayTeamId: bigint | null;
    status: string;
    homeScore: number;
    awayScore: number;
    round_number: number;
    bracket_position: number;
    roundName: string;
    match_number: number;
  }> = [];

  for (const round of rounds) {
    for (const m of round.matches) {
      matchData.push({
        tournamentId,
        // rank가 있으면 매핑된 팀 ID, 없으면 null (2라운드 이후 빈 슬롯)
        homeTeamId: m.homeRank ? rankMap.get(m.homeRank) ?? null : null,
        awayTeamId: m.awayRank ? rankMap.get(m.awayRank) ?? null : null,
        status: "scheduled",
        homeScore: 0,
        awayScore: 0,
        round_number: round.roundNumber,
        bracket_position: m.bracketPosition,
        roundName: getRoundName(round.roundNumber, totalRounds),
        match_number: nextMatchNumber++,
      });
    }
  }

  // 6) 3/4위전 (옵션) — 결승과 같은 라운드에 특수 bracket_position=99로 생성
  if (bronzeMatch) {
    matchData.push({
      tournamentId,
      homeTeamId: null,
      awayTeamId: null,
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      round_number: totalRounds,
      bracket_position: 99, // 특수 위치 (결승과 구분)
      roundName: "3/4위전",
      match_number: nextMatchNumber++,
    });
  }

  // 7) 일괄 insert — createMany는 트랜잭션 내부에서 원자적으로 처리
  await prisma.tournamentMatch.createMany({ data: matchData });

  return matchData.length;
}

/**
 * 리그 경기가 모두 완료되었는지 확인
 * - 리그 경기(round_number === null) 중 completed/cancelled 아닌 게 하나라도 있으면 false
 */
export async function isLeagueComplete(tournamentId: string): Promise<boolean> {
  const incomplete = await prisma.tournamentMatch.count({
    where: {
      tournamentId,
      round_number: null, // 리그 경기
      status: { notIn: ["completed", "cancelled"] },
    },
  });
  return incomplete === 0;
}
