"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
// 헤더 우측에 테마 토글 버튼을 배치하기 위해 공통 컴포넌트 재사용
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface PlayerRow {
  id: number;
  jersey_number: number | null;
  name: string;
  team_id: number;
  min: number;
  min_seconds?: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fouls: number;
  plus_minus?: number;
  // 0414: DNP(Did Not Play) — NBA 미출전 표시
  dnp?: boolean;
}

interface PlayByPlayRow {
  id: number;
  quarter: number;
  game_clock_seconds: number;
  team_id: number;
  jersey_number: number | null;
  player_name: string;
  action_type: string;
  action_subtype: string | null;
  is_made: boolean | null;
  points_scored: number;
  home_score_at_time: number;
  away_score_at_time: number;
}

interface MatchData {
  id: number;
  status: string;
  home_score: number;
  away_score: number;
  round_name: string | null;
  tournament_name: string;
  quarter_scores: {
    home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
    away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  } | null;
  home_team: { id: number; name: string; color: string };
  away_team: { id: number; name: string; color: string };
  home_players: PlayerRow[];
  away_players: PlayerRow[];
  play_by_plays: PlayByPlayRow[];
  updated_at: string;
  // 2026-04-15: 4/11~12 게임 클럭 부정확 시기 안내 분기에 사용 — API가 optional로 내려줌
  scheduled_at?: string | null;
  started_at?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "예정",
  warmup: "워밍업",
  live: "LIVE",
  halftime: "하프타임",
  finished: "종료",
  completed: "종료",
  in_progress: "진행중",
};

const ACTION_LABEL: Record<string, string> = {
  made_shot: "득점",
  missed_shot: "슛 실패",
  free_throw: "자유투",
  rebound: "리바운드",
  rebound_off: "공격 리바운드",
  rebound_def: "수비 리바운드",
  assist: "어시스트",
  steal: "스틸",
  block: "블락",
  turnover: "턴오버",
  foul: "파울",
  foul_personal: "파울",
  foul_technical: "테크니컬 파울",
  substitution: "교체",
  timeout: "타임아웃",
  "2pt": "2점 성공",
  "2pt_miss": "2점 실패",
  "3pt": "3점 성공",
  "3pt_miss": "3점 실패",
  "1pt": "자유투 성공",
  "1pt_miss": "자유투 실패",
};

function formatGameClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getQuarterLabel(q: number): string {
  if (q <= 4) return `Q${q}`;
  return `OT${q - 4}`;
}

const POLL_INTERVAL = 3_000; // 3초

// 얼룩무늬(zebra stripe) 배경색 — 중립 회색 알파를 쓰면 다크/라이트 모두에서 은은하게 보임.
// 라이트 배경(흰색)에서는 살짝 어둡게, 다크 배경(#0A)에서는 살짝 밝게 동시에 보이도록 중간 회색 사용.
const ZEBRA_BG = "rgba(127, 127, 127, 0.06)";
// TOTAL 합산 행 전용 — 조금 더 진하게 구분
const TOTAL_ROW_BG = "rgba(127, 127, 127, 0.10)";

export default function LiveBoxScorePage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [homeFlash, setHomeFlash] = useState(false);
  const [awayFlash, setAwayFlash] = useState(false);
  const prevScoreRef = useRef<{ home: number; away: number } | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setError("경기 정보를 찾을 수 없습니다");
        return;
      }
      const data = await res.json();
      const m = data.match as MatchData;

      // 점수 변경 감지 → 플래시 효과
      if (prevScoreRef.current) {
        if (m.home_score !== prevScoreRef.current.home) {
          setHomeFlash(true);
          setTimeout(() => setHomeFlash(false), 800);
        }
        if (m.away_score !== prevScoreRef.current.away) {
          setAwayFlash(true);
          setTimeout(() => setAwayFlash(false), 800);
        }
      }
      prevScoreRef.current = { home: m.home_score, away: m.away_score };

      setMatch(m);
      setLastUpdated(new Date());
      setIsLive(m.status === "live" || m.status === "in_progress");
      setError(null);
    } catch {
      setError("데이터를 불러오는 중 오류가 발생했습니다");
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
    const timer = setInterval(fetchMatch, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchMatch]);

  if (error) {
    // 에러 화면도 테마 반응형이 되도록 CSS 변수로 배경/텍스트 지정
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">🏀</div>
          <p style={{ color: "var(--color-text-secondary)" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!match) {
    // 로딩 스피너: 주황 → BDR 기본 primary 사용 (테마 중립)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // 2026-04-15: 4/11~12 게임 클럭 부정확 시기 판정
  // 이 기간에 치러진 경기는 box score의 MIN 값이 정확하지 않아 테이블 하단에 안내 문구를 노출한다.
  // 우선순위: scheduled_at(예정일) → started_at(실제 시작) → updated_at(최종 갱신). 하나라도 2026-04-11/12 이면 true.
  const matchDateStr = match.scheduled_at || match.started_at || match.updated_at;
  const matchDate = matchDateStr ? new Date(matchDateStr) : null;
  const isLegacyClockIssue = matchDate
    ? matchDate.getFullYear() === 2026 &&
      matchDate.getMonth() === 3 /* 0-indexed: 3 === 4월 */ &&
      (matchDate.getDate() === 11 || matchDate.getDate() === 12)
    : false;

  const qs = match.quarter_scores;
  const qh = qs?.home;
  const qa = qs?.away;
  const quarters = [
    { label: "Q1", home: qh?.q1 ?? 0, away: qa?.q1 ?? 0 },
    { label: "Q2", home: qh?.q2 ?? 0, away: qa?.q2 ?? 0 },
    { label: "Q3", home: qh?.q3 ?? 0, away: qa?.q3 ?? 0 },
    { label: "Q4", home: qh?.q4 ?? 0, away: qa?.q4 ?? 0 },
    ...(qh?.ot ?? []).map((v, i) => ({
      label: `OT${i + 1}`,
      home: v,
      away: qa?.ot?.[i] ?? 0,
    })),
  ];

  return (
    // 페이지 최상단 컨테이너 — 배경/글자 기본색은 모두 CSS 변수 사용 (테마 전환 대응)
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
    >
      {/* 헤더 — border와 배경을 모두 CSS 변수로 */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => window.history.back()}
            className="shrink-0 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          {/* 토너먼트명: text-sm → text-base (두 단계 확대의 헤더 버전) */}
          <span className="text-base truncate" style={{ color: "var(--color-text-secondary)" }}>
            {match.tournament_name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            // LIVE 인디케이터: 상태 시맨틱 변수 사용 (text-xs → text-sm)
            <span
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: "var(--color-status-live)" }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--color-status-live)" }}
              />
              LIVE
            </span>
          )}
          {/* 상태 라벨: text-xs → text-sm */}
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {STATUS_LABEL[match.status] ?? match.status}
          </span>
          {/* 헤더 우측: 테마 토글(왼쪽) → 새로고침(오른쪽) 순서로 배치 */}
          <ThemeToggle />
          <button
            onClick={fetchMatch}
            className="transition-colors ml-1"
            title="새로고침"
            style={{ color: "var(--color-text-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
          </button>
        </div>
      </div>

      {/* 스코어 카드 */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          {/* 홈팀 */}
          <div className="flex-1 text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: match.home_team.color }}
            />
            {/* 팀명 헤더: text-lg → text-2xl (추가 확대) */}
            <p
              className="text-2xl font-medium truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {match.home_team.name}
            </p>
            {/* 메인 점수: 팀색 유지 + text-shadow outline으로 라이트/다크 양쪽 경계 보장
                (안쪽 1px은 text-primary, 바깥 3px은 background 색으로 2겹 보강) */}
            <p
              className={`text-6xl font-black mt-1 transition-all duration-300 ${homeFlash ? "scale-125 brightness-150" : "scale-100"}`}
              style={{
                color: match.home_team.color,
                textShadow: "0 0 1px var(--color-text-primary), 0 0 3px var(--color-background)",
              }}
            >
              {match.home_score}
            </p>
          </div>

          {/* 가운데 — 콜론 크기는 의미상 유지. 색상은 muted 변수로 (라이트에서 어둡게, 다크에서 밝게) */}
          <div className="text-center px-2">
            <p className="text-xl font-light" style={{ color: "var(--color-text-muted)" }}>:</p>
            {match.round_name && (
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                {match.round_name}
              </p>
            )}
          </div>

          {/* 원정팀 */}
          <div className="flex-1 text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: match.away_team.color }}
            />
            <p
              className="text-2xl font-medium truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {match.away_team.name}
            </p>
            {/* 원정팀 메인 점수: 홈과 동일한 text-shadow 방식 */}
            <p
              className={`text-6xl font-black mt-1 transition-all duration-300 ${awayFlash ? "scale-125 brightness-150" : "scale-100"}`}
              style={{
                color: match.away_team.color,
                textShadow: "0 0 1px var(--color-text-primary), 0 0 3px var(--color-background)",
              }}
            >
              {match.away_score}
            </p>
          </div>
        </div>

        {/* 쿼터별 점수 */}
        {quarters.some((q) => q.home > 0 || q.away > 0) && (
          <div
            className="mt-4 rounded-md overflow-hidden"
            style={{ backgroundColor: "var(--color-card)" }}
          >
            {/* 쿼터 테이블: text-sm → text-lg (18px)로 상속. 좌우 끝 셀 px-3→px-2, 쿼터 셀 px-2→px-1로 축소 */}
            <table className="w-full text-lg">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  <th className="py-2 px-2 text-left font-normal" style={{ color: "var(--color-text-muted)" }}>팀</th>
                  {quarters.map((q) => (
                    <th key={q.label} className="py-2 px-1 text-center font-normal" style={{ color: "var(--color-text-muted)" }}>
                      {q.label}
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center font-semibold" style={{ color: "var(--color-text-secondary)" }}>합계</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  {/* 팀명 셀: 명시 text-base 제거 → 부모 text-lg 상속 */}
                  <td className="py-2 px-2 truncate max-w-[60px]" style={{ color: "var(--color-text-primary)" }}>
                    {match.home_team.name}
                  </td>
                  {quarters.map((q) => (
                    <td key={q.label} className="py-2 px-1 text-center" style={{ color: "var(--color-text-primary)" }}>
                      {q.home}
                    </td>
                  ))}
                  {/* 합계: 메인 점수와 동일한 text-shadow 방식(크기 작으니 바깥 반경 2px로 약하게) */}
                  <td
                    className="py-2 px-2 text-center font-bold"
                    style={{
                      color: match.home_team.color,
                      textShadow: "0 0 1px var(--color-text-primary), 0 0 2px var(--color-background)",
                    }}
                  >
                    {match.home_score}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 truncate max-w-[60px]" style={{ color: "var(--color-text-primary)" }}>
                    {match.away_team.name}
                  </td>
                  {quarters.map((q) => (
                    <td key={q.label} className="py-2 px-1 text-center" style={{ color: "var(--color-text-primary)" }}>
                      {q.away}
                    </td>
                  ))}
                  <td
                    className="py-2 px-2 text-center font-bold"
                    style={{
                      color: match.away_team.color,
                      textShadow: "0 0 1px var(--color-text-primary), 0 0 2px var(--color-background)",
                    }}
                  >
                    {match.away_score}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 박스스코어 (프린트 영역) — 프린트 CSS에서 검정 잉크로 강제 변환되므로 인라인 색상은 유지 */}
      <div id="box-score-print-area" className="px-4 pb-4 space-y-4">
        {/* 프린트 전용: 팀별 독립 페이지 */}
        {[
          { team: match.home_team, players: match.home_players, score: match.home_score, opponentName: match.away_team.name, opponentScore: match.away_score },
          { team: match.away_team, players: match.away_players, score: match.away_score, opponentName: match.home_team.name, opponentScore: match.home_score },
        ].map(({ team, players, score, opponentName, opponentScore }) => (
          <div key={team.id} className="print-team-page">
            {/* 프린트 전용 헤더 — 인라인 색상(#000/#666/#999)은 프린트 잉크용이라 그대로 유지 */}
            <div data-print-show className="hidden">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 800 }}>{team.name}</span>
                  <span style={{ fontSize: "11px", marginLeft: "8px", color: "#666" }}>vs {opponentName}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "#666" }}>{match.tournament_name}</span>
                  {match.round_name && <span style={{ fontSize: "10px", color: "#999", marginLeft: "6px" }}>{match.round_name}</span>}
                </div>
              </div>
              {/* 쿼터별 점수 인라인 — 프린트 전용 */}
              <div style={{ display: "flex", gap: "12px", fontSize: "9px", color: "#666", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "2px" }}>
                <span style={{ fontWeight: 700, color: "#000", fontSize: "12px" }}>{score} : {opponentScore}</span>
                {quarters.map((q) => {
                  const myScore = team.id === match.home_team.id ? q.home : q.away;
                  const oppScore = team.id === match.home_team.id ? q.away : q.home;
                  return <span key={q.label}>{q.label} {myScore}-{oppScore}</span>;
                })}
              </div>
            </div>

            {/* 박스스코어 테이블 */}
            <BoxScoreTable
              teamName={team.name}
              color={team.color}
              players={players}
            />
          </div>
        ))}
      </div>

      {/* 2026-04-15: 4/11~12 경기 클럭 부정확 안내 — 두 팀 박스스코어 모두 아래 한 번만 표시
          프린트 시에는 숨김(data-print-hide). 좌측 정렬 + 아이콘 + muted 색상 */}
      {isLegacyClockIssue && (
        <div
          data-print-hide
          className="px-4 pb-2 flex items-start gap-2 text-sm italic"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="material-symbols-outlined text-base leading-tight">info</span>
          <span>경기시간 집계 시스템 오류로 경기시간이 정확하지 않은 부분 양해바랍니다.</span>
        </div>
      )}

      {/* 프린트 버튼 — 기본 text-sm → text-base 확대, 배경/텍스트는 CSS 변수로 */}
      <div data-print-hide className="px-4 pb-8">
        <button
          onClick={() => window.print()}
          className="w-full py-3 rounded-xl text-base font-semibold border transition-colors flex items-center justify-center gap-2"
          style={{
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span className="material-symbols-outlined text-lg">print</span>
          박스스코어 프린트
        </button>
      </div>

      {/* PBP 로그 */}
      {match.play_by_plays && match.play_by_plays.length > 0 && (
        <PbpSection match={match} />
      )}

      {/* 하단 갱신 정보 — fixed bar. backdrop-blur 유지, 배경은 CSS 변수 + rgba로 직접 합성 */}
      <div
        className="fixed bottom-0 left-0 right-0 backdrop-blur px-4 py-2 flex items-center justify-between border-t"
        style={{
          // backgroundColor만으로 테마별 투명도를 표현하기 어려우므로 --color-card를 그대로 + 블러에 맡김
          backgroundColor: "color-mix(in srgb, var(--color-background) 90%, transparent)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* 하단 정보 text-xs → text-sm */}
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          🏀 BDR Live Score
        </span>
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {lastUpdated
            ? `${lastUpdated.getHours().toString().padStart(2, "0")}:${lastUpdated.getMinutes().toString().padStart(2, "0")} 기준`
            : "로딩중..."}
        </span>
      </div>
    </div>
  );
}

function BoxScoreTable({
  teamName,
  color,
  players,
}: {
  teamName: string;
  color: string;
  players: PlayerRow[];
}) {
  if (!players || players.length === 0) return null;

  // 0414: DNP(NBA: Did Not Play) 분리 — 테이블 본체는 출전 선수만, 하단에 DNP 리스트
  const activePlayers = players.filter((p) => !p.dnp);
  const dnpPlayers = players.filter((p) => p.dnp);
  // dev: 득점 내림차순 정렬 + FG/3P/FT 퍼센트 헬퍼
  const sorted = [...activePlayers].sort((a, b) => b.pts - a.pts);
  const pct = (made: number, attempted: number) =>
    attempted > 0 ? Math.round((made / attempted) * 100) : 0;

  // 2026-04-15: PTS 셀 — 팀색은 좌측 띠(3px)로만 표기하고 숫자는 텍스트 기본색을 사용
  // 라이트 모드에서 흰색에 가까운 팀 컬러가 안 보이는 문제(NBA.com 스타일로 해결)
  // 셀 높이의 60%만 차지하도록 상하 20% 여백, 반올림 2px로 살짝 부드럽게
  const PtsTeamBar = () => (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        top: "20%",
        bottom: "20%",
        width: "3px",
        backgroundColor: color,
        borderRadius: "2px",
      }}
    />
  );

  return (
    <div className="print-team-table-wrap">
      <div className="flex items-center gap-2 mb-2 print:hidden">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        {/* 팀명 헤더: text-sm → text-lg (두 단계 확대) */}
        <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {teamName}
        </span>
      </div>
      <div
        className="rounded-md overflow-hidden"
        style={{ backgroundColor: "var(--color-card)" }}
      >
        <div className="overflow-x-auto">
          {/* 박스스코어 전체 text-xs → text-base (두 단계 확대) */}
          <table className="w-full text-base">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                {/* sticky 셀: 라이트/다크 모두 card 색으로 배경 칠해줘야 투명해지지 않음 */}
                <th
                  className="py-2 px-3 text-left font-normal sticky left-0 print:static print:bg-transparent"
                  style={{ backgroundColor: "var(--color-card)" }}
                >#</th>
                <th
                  className="py-2 px-1 text-left font-normal sticky left-8 min-w-[70px] print:static print:bg-transparent"
                  style={{ backgroundColor: "var(--color-card)" }}
                >이름</th>
                {/* 2026-04-15: MIN 복원 — 이름 바로 다음, PTS 앞 */}
                <th className="py-2 px-0.5 text-center font-normal">MIN</th>
                <th className="py-2 px-0.5 text-center font-semibold" style={{ color: "var(--color-text-primary)" }}>PTS</th>
                <th className="py-2 px-0.5 text-center font-normal">FG</th>
                <th className="py-2 px-0.5 text-center font-normal">FG%</th>
                <th className="py-2 px-0.5 text-center font-normal">3P</th>
                <th className="py-2 px-0.5 text-center font-normal">3P%</th>
                <th className="py-2 px-0.5 text-center font-normal">FT</th>
                <th className="py-2 px-0.5 text-center font-normal">FT%</th>
                <th className="py-2 px-0.5 text-center font-normal">OR</th>
                <th className="py-2 px-0.5 text-center font-normal">DR</th>
                <th className="py-2 px-0.5 text-center font-normal">REB</th>
                <th className="py-2 px-0.5 text-center font-normal">AST</th>
                <th className="py-2 px-0.5 text-center font-normal">STL</th>
                <th className="py-2 px-0.5 text-center font-normal">BLK</th>
                <th className="py-2 px-0.5 text-center font-normal">TO</th>
                <th className="py-2 px-0.5 text-center font-normal">PF</th>
                <th className="py-2 px-0.5 text-center font-normal">+/-</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b"
                  style={{
                    borderColor: "var(--color-border)",
                    // 얼룩무늬: 짝수 행은 투명, 홀수 행은 중립 회색 알파
                    backgroundColor: i % 2 === 0 ? "transparent" : ZEBRA_BG,
                  }}
                >
                  {/* sticky 셀은 zebra 배경을 bg-inherit로 따라가게 함 */}
                  <td
                    className="py-2 px-3 sticky left-0 bg-inherit print:static print:bg-transparent"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.jersey_number ?? "-"}
                  </td>
                  <td
                    className="py-2 px-1 sticky left-8 bg-inherit min-w-[70px] truncate max-w-[70px] print:static print:bg-transparent print:max-w-none"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {p.name}
                  </td>
                  {/* MIN — muted 색으로 살짝 약하게 (스탯만큼 강조 X) */}
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>
                    {formatGameClock(p.min_seconds ?? p.min * 60)}
                  </td>
                  {/* PTS — 팀색 좌측 띠 + 텍스트 기본색. 부모 td에 relative 필수 */}
                  <td
                    className="py-2 px-0.5 text-center font-bold relative"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    <PtsTeamBar />
                    {p.pts}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {p.fgm}/{p.fga}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {pct(p.fgm, p.fga)}%
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {p.tpm}/{p.tpa}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {pct(p.tpm, p.tpa)}%
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {p.ftm}/{p.fta}
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {pct(p.ftm, p.fta)}%
                  </td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{p.oreb}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{p.dreb}</td>
                  <td className="py-2 px-0.5 text-center font-semibold" style={{ color: "var(--color-text-primary)" }}>{p.reb}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{p.ast}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{p.stl}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{p.blk}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{p.to}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{p.fouls}</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {p.plus_minus != null ? (p.plus_minus > 0 ? `+${p.plus_minus}` : p.plus_minus) : "-"}
                  </td>
                </tr>
              ))}
              {/* 2026-04-15: DNP 행 재구조화 — colSpan 제거, NBA 스타일로 셀마다 채움.
                  MIN 셀에 "DNP" 표시, 나머지 스탯 16개는 모두 "-" */}
              {dnpPlayers.map((p, i) => (
                <tr
                  key={`dnp-${p.id}`}
                  className="border-b"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: (sorted.length + i) % 2 === 0 ? "transparent" : ZEBRA_BG,
                  }}
                >
                  <td
                    className="py-2 px-3 sticky left-0 bg-inherit print:static print:bg-transparent"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.jersey_number ?? "-"}
                  </td>
                  <td
                    className="py-2 px-1 sticky left-8 bg-inherit min-w-[70px] truncate max-w-[70px] print:static print:bg-transparent print:max-w-none"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {p.name}
                  </td>
                  {/* MIN 셀에 "DNP" — text-xs + semibold + muted 색으로 시각적 구분 */}
                  <td
                    className="py-2 px-0.5 text-center text-xs font-semibold tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    DNP
                  </td>
                  {/* 나머지 16개 스탯 셀은 모두 "-" */}
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                  <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-muted)" }}>-</td>
                </tr>
              ))}
              {/* TOTAL 합산 행 — 출전 선수만 집계 (DNP 제외) */}
              {(() => {
                const total = activePlayers.reduce(
                  (acc, p) => ({
                    min: acc.min + p.min,
                    min_seconds: acc.min_seconds + (p.min_seconds ?? p.min * 60),
                    pts: acc.pts + p.pts,
                    fgm: acc.fgm + p.fgm,
                    fga: acc.fga + p.fga,
                    tpm: acc.tpm + p.tpm,
                    tpa: acc.tpa + p.tpa,
                    ftm: acc.ftm + p.ftm,
                    fta: acc.fta + p.fta,
                    oreb: acc.oreb + p.oreb,
                    dreb: acc.dreb + p.dreb,
                    reb: acc.reb + p.reb,
                    ast: acc.ast + p.ast,
                    stl: acc.stl + p.stl,
                    blk: acc.blk + p.blk,
                    to: acc.to + p.to,
                    fouls: acc.fouls + p.fouls,
                  }),
                  { min: 0, min_seconds: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0 }
                );
                // TOTAL 행: sticky 셀에 elevated 배경을 지정해 라이트/다크 모두 투명해지지 않음
                const totalStickyBg = "var(--color-elevated)";
                return (
                  <tr
                    className="border-t font-semibold print-total-row"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: TOTAL_ROW_BG,
                    }}
                  >
                    <td
                      className="py-2 px-3 sticky left-0 print:static print:bg-transparent"
                      style={{ color: "var(--color-text-secondary)", backgroundColor: totalStickyBg }}
                    />
                    <td
                      className="py-2 px-1 sticky left-8 print:static print:bg-transparent"
                      style={{ color: "var(--color-text-primary)", backgroundColor: totalStickyBg }}
                    >TOTAL</td>
                    {/* MIN — TOTAL 행은 secondary 색으로 강조 */}
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>
                      {formatGameClock(total.min_seconds)}
                    </td>
                    {/* PTS — TOTAL 행도 동일하게 팀색 좌측 띠 + 텍스트 기본색 */}
                    <td
                      className="py-2 px-0.5 text-center relative"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      <PtsTeamBar />
                      {total.pts}
                    </td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.fgm}/{total.fga}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{pct(total.fgm, total.fga)}%</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.tpm}/{total.tpa}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{pct(total.tpm, total.tpa)}%</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.ftm}/{total.fta}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{pct(total.ftm, total.fta)}%</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.oreb}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.dreb}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.reb}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.ast}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.stl}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.blk}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.to}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-primary)" }}>{total.fouls}</td>
                    <td className="py-2 px-0.5 text-center" style={{ color: "var(--color-text-secondary)" }}>-</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const PBP_COLLAPSED_COUNT = 10;

function PbpSection({ match }: { match: MatchData }) {
  const [expanded, setExpanded] = useState(false);
  const pbps = match.play_by_plays;
  const visiblePbps = expanded ? pbps : pbps.slice(0, PBP_COLLAPSED_COUNT);
  const hasMore = pbps.length > PBP_COLLAPSED_COUNT;

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center gap-2 mb-3">
        {/* PBP 섹션 헤더: text-sm → text-lg (두 단계 확대) */}
        <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Play-by-Play</span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>({pbps.length})</span>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--color-elevated)" }}
      >
        <div className="overflow-x-auto">
          {/* PBP 테이블 전체 text-xs → text-base (두 단계 확대) */}
          <table className="w-full text-base">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                <th className="py-2 px-2 text-left font-normal w-[60px]">시간</th>
                <th className="py-2 px-2 text-center font-normal w-[32px]">팀</th>
                <th className="py-2 px-2 text-center font-normal w-[32px]">#</th>
                <th className="py-2 px-2 text-left font-normal">행동</th>
                <th className="py-2 px-2 text-center font-normal w-[60px]">점수</th>
              </tr>
            </thead>
            <tbody>
              {visiblePbps.map((pbp, i) => {
                const isHome = pbp.team_id === match.home_team.id;
                const teamColor = isHome ? match.home_team.color : match.away_team.color;
                const actionLabel = ACTION_LABEL[pbp.action_type] ?? pbp.action_type;

                return (
                  <tr
                    key={pbp.id}
                    className="border-b"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: i % 2 === 0 ? "transparent" : ZEBRA_BG,
                    }}
                  >
                    <td className="py-1.5 px-2 whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{getQuarterLabel(pbp.quarter)}</span>{" "}
                      {formatGameClock(pbp.game_clock_seconds)}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <div
                        className="w-2.5 h-2.5 rounded-full mx-auto"
                        style={{ backgroundColor: teamColor }}
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center" style={{ color: "var(--color-text-secondary)" }}>
                      {pbp.jersey_number ?? "-"}
                    </td>
                    <td className="py-1.5 px-2" style={{ color: "var(--color-text-primary)" }}>
                      {actionLabel}
                    </td>
                    <td className="py-1.5 px-2 text-center whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>
                      <span style={{ color: match.home_team.color }}>{pbp.home_score_at_time}</span>
                      <span className="mx-0.5" style={{ color: "var(--color-text-muted)" }}>:</span>
                      <span style={{ color: match.away_team.color }}>{pbp.away_score_at_time}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2.5 text-xs transition-colors border-t"
            style={{
              color: "var(--color-text-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            {expanded ? "접기" : `더보기 (${pbps.length - PBP_COLLAPSED_COUNT}건)`}
          </button>
        )}
      </div>
    </div>
  );
}
