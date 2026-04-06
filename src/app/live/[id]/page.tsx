"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface PlayerRow {
  id: number;
  jersey_number: number | null;
  name: string;
  team_id: number;
  min: number;
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

const POLL_INTERVAL = 10_000; // 10초

export default function LiveBoxScorePage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setError("경기 정보를 찾을 수 없습니다");
        return;
      }
      const data = await res.json();
      setMatch(data.match);
      setLastUpdated(new Date());
      setIsLive(data.match.status === "live" || data.match.status === "in_progress");
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
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">🏀</div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const qs = match.quarter_scores;
  const quarters = [
    { label: "Q1", home: qs?.home.q1 ?? 0, away: qs?.away.q1 ?? 0 },
    { label: "Q2", home: qs?.home.q2 ?? 0, away: qs?.away.q2 ?? 0 },
    { label: "Q3", home: qs?.home.q3 ?? 0, away: qs?.away.q3 ?? 0 },
    { label: "Q4", home: qs?.home.q4 ?? 0, away: qs?.away.q4 ?? 0 },
    ...(qs?.home.ot ?? []).map((v, i) => ({
      label: `OT${i + 1}`,
      home: v,
      away: qs?.away.ot[i] ?? 0,
    })),
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-white">
      {/* 헤더 */}
      <div className="bg-[var(--color-surface)] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => window.history.back()} className="shrink-0 text-gray-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="text-sm text-gray-400 truncate">{match.tournament_name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          <span className="text-xs text-gray-500">
            {STATUS_LABEL[match.status] ?? match.status}
          </span>
          <button onClick={fetchMatch} className="text-gray-500 hover:text-white transition-colors ml-1" title="새로고침">
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
            <p className="text-sm text-gray-300 font-medium truncate">
              {match.home_team.name}
            </p>
            <p
              className="text-6xl font-black mt-1"
              style={{ color: match.home_team.color }}
            >
              {match.home_score}
            </p>
          </div>

          {/* 가운데 */}
          <div className="text-center px-2">
            <p className="text-gray-600 text-xl font-light">:</p>
            {match.round_name && (
              <p className="text-xs text-gray-500 mt-1">{match.round_name}</p>
            )}
          </div>

          {/* 원정팀 */}
          <div className="flex-1 text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: match.away_team.color }}
            />
            <p className="text-sm text-gray-300 font-medium truncate">
              {match.away_team.name}
            </p>
            <p
              className="text-6xl font-black mt-1"
              style={{ color: match.away_team.color }}
            >
              {match.away_score}
            </p>
          </div>
        </div>

        {/* 쿼터별 점수 */}
        {quarters.some((q) => q.home > 0 || q.away > 0) && (
          <div className="mt-4 bg-[var(--color-surface)] rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 px-3 text-left text-gray-500 font-normal">팀</th>
                  {quarters.map((q) => (
                    <th key={q.label} className="py-2 px-2 text-center text-gray-500 font-normal">
                      {q.label}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-center text-gray-400 font-semibold">합계</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3 text-gray-300 text-xs truncate max-w-[60px]">
                    {match.home_team.name}
                  </td>
                  {quarters.map((q) => (
                    <td key={q.label} className="py-2 px-2 text-center text-gray-300">
                      {q.home}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-center font-bold" style={{ color: match.home_team.color }}>
                    {match.home_score}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-300 text-xs truncate max-w-[60px]">
                    {match.away_team.name}
                  </td>
                  {quarters.map((q) => (
                    <td key={q.label} className="py-2 px-2 text-center text-gray-300">
                      {q.away}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-center font-bold" style={{ color: match.away_team.color }}>
                    {match.away_score}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 박스스코어 */}
      <div className="px-4 pb-8 space-y-6">
        <BoxScoreTable
          teamName={match.home_team.name}
          color={match.home_team.color}
          players={match.home_players}
        />
        <BoxScoreTable
          teamName={match.away_team.name}
          color={match.away_team.color}
          players={match.away_players}
        />
      </div>

      {/* PBP 로그 */}
      {match.play_by_plays && match.play_by_plays.length > 0 && (
        <div className="px-4 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-200">Play-by-Play</span>
            <span className="text-xs text-gray-500">({match.play_by_plays.length})</span>
          </div>
          <div className="bg-[#111118] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500">
                    <th className="py-2 px-2 text-left font-normal w-[60px]">시간</th>
                    <th className="py-2 px-2 text-center font-normal w-[32px]">팀</th>
                    <th className="py-2 px-2 text-center font-normal w-[32px]">#</th>
                    <th className="py-2 px-2 text-left font-normal">행동</th>
                    <th className="py-2 px-2 text-center font-normal w-[60px]">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {match.play_by_plays.map((pbp, i) => {
                    const isHome = pbp.team_id === match.home_team.id;
                    const teamColor = isHome ? match.home_team.color : match.away_team.color;
                    const actionLabel = ACTION_LABEL[pbp.action_type] ?? pbp.action_type;

                    return (
                      <tr
                        key={pbp.id}
                        className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                      >
                        <td className="py-1.5 px-2 text-gray-500 whitespace-nowrap">
                          <span className="text-gray-600">{getQuarterLabel(pbp.quarter)}</span>{" "}
                          {formatGameClock(pbp.game_clock_seconds)}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <div
                            className="w-2.5 h-2.5 rounded-full mx-auto"
                            style={{ backgroundColor: teamColor }}
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center text-gray-400">
                          {pbp.jersey_number ?? "-"}
                        </td>
                        <td className="py-1.5 px-2 text-gray-300">
                          {actionLabel}
                        </td>
                        <td className="py-1.5 px-2 text-center text-gray-400 whitespace-nowrap">
                          <span style={{ color: match.home_team.color }}>{pbp.home_score_at_time}</span>
                          <span className="text-gray-600 mx-0.5">:</span>
                          <span style={{ color: match.away_team.color }}>{pbp.away_score_at_time}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 하단 갱신 정보 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-background)]/90 backdrop-blur border-t border-white/10 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-600">
          🏀 BDR Live Score
        </span>
        <span className="text-xs text-gray-600">
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

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold text-gray-200">{teamName}</span>
      </div>
      <div className="bg-[var(--color-surface)] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="py-2 px-3 text-left font-normal sticky left-0 bg-[var(--color-surface)]">#</th>
                <th className="py-2 px-1 text-left font-normal sticky left-8 bg-[var(--color-surface)] min-w-[70px]">이름</th>
                <th className="py-2 px-1 text-center font-normal">MIN</th>
                <th className="py-2 px-1 text-center font-semibold text-gray-300">PTS</th>
                <th className="py-2 px-1 text-center font-normal">FG</th>
                <th className="py-2 px-1 text-center font-normal">3P</th>
                <th className="py-2 px-1 text-center font-normal">FT</th>
                <th className="py-2 px-1 text-center font-normal">OR</th>
                <th className="py-2 px-1 text-center font-normal">DR</th>
                <th className="py-2 px-1 text-center font-normal">REB</th>
                <th className="py-2 px-1 text-center font-normal">AST</th>
                <th className="py-2 px-1 text-center font-normal">STL</th>
                <th className="py-2 px-1 text-center font-normal">BLK</th>
                <th className="py-2 px-1 text-center font-normal">TO</th>
                <th className="py-2 px-1 text-center font-normal">PF</th>
                <th className="py-2 px-1 text-center font-normal">+/-</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                >
                  <td className="py-2 px-3 text-gray-500 sticky left-0 bg-inherit">
                    {p.jersey_number ?? "-"}
                  </td>
                  <td className="py-2 px-1 text-gray-200 sticky left-8 bg-inherit min-w-[70px] truncate max-w-[70px]">
                    {p.name}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-500">{p.min}</td>
                  <td className="py-2 px-1 text-center font-bold" style={{ color }}>
                    {p.pts}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-400">
                    {p.fgm}/{p.fga}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-400">
                    {p.tpm}/{p.tpa}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-400">
                    {p.ftm}/{p.fta}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-300">{p.oreb}</td>
                  <td className="py-2 px-1 text-center text-gray-300">{p.dreb}</td>
                  <td className="py-2 px-1 text-center text-gray-300 font-semibold">{p.reb}</td>
                  <td className="py-2 px-1 text-center text-gray-300">{p.ast}</td>
                  <td className="py-2 px-1 text-center text-gray-300">{p.stl}</td>
                  <td className="py-2 px-1 text-center text-gray-300">{p.blk}</td>
                  <td className="py-2 px-1 text-center text-gray-300">{p.to}</td>
                  <td className="py-2 px-1 text-center text-gray-300">{p.fouls}</td>
                  <td className="py-2 px-1 text-center text-gray-300">
                    {p.plus_minus != null ? (p.plus_minus > 0 ? `+${p.plus_minus}` : p.plus_minus) : "-"}
                  </td>
                </tr>
              ))}
              {/* TOTAL 합산 행 */}
              {(() => {
                const total = players.reduce(
                  (acc, p) => ({
                    min: acc.min + p.min,
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
                  { min: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0 }
                );
                return (
                  <tr className="border-t border-white/20 bg-white/[0.04] font-semibold">
                    <td className="py-2 px-3 text-gray-400 sticky left-0 bg-[#111118]" />
                    <td className="py-2 px-1 text-gray-200 sticky left-8 bg-[#111118]">TOTAL</td>
                    <td className="py-2 px-1 text-center text-gray-400">{total.min}</td>
                    <td className="py-2 px-1 text-center" style={{ color }}>{total.pts}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.fgm}/{total.fga}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.tpm}/{total.tpa}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.ftm}/{total.fta}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.oreb}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.dreb}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.reb}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.ast}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.stl}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.blk}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.to}</td>
                    <td className="py-2 px-1 text-center text-gray-300">{total.fouls}</td>
                    <td className="py-2 px-1 text-center text-gray-400">-</td>
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
