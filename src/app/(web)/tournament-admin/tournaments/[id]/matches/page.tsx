"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TeamInfo = {
  id: string;
  team: { name: string; primaryColor: string | null };
};

type Match = {
  id: string;
  roundName: string | null;
  round_number: number | null;
  bracket_position: number | null;
  match_number: number | null;
  scheduledAt: string | null;
  venue_name: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  status: string;
  winner_team_id: string | null;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
};

type TournamentTeam = {
  id: string;
  team: { name: string };
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-[#9CA3AF]",
  scheduled: "text-[#2563EB]",
  in_progress: "text-[#D97706]",
  completed: "text-[#16A34A]",
  cancelled: "text-[#DC2626]",
  bye: "text-[#6B7280]",
};

function ScoreModal({
  match,
  teams,
  onClose,
  onSaved,
}: {
  match: Match;
  teams: TournamentTeam[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore);
  const [awayScore, setAwayScore] = useState(match.awayScore);
  const [status, setStatus] = useState(match.status);
  const [winnerId, setWinnerId] = useState(match.winner_team_id ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    match.scheduledAt ? new Date(match.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [venueName, setVenueName] = useState(match.venue_name ?? "");
  const [homeTeamId, setHomeTeamId] = useState(match.homeTeamId ?? "");
  const [awayTeamId, setAwayTeamId] = useState(match.awayTeamId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { id } = useParams<{ id: string }>();

  const approvedTeams = teams.filter((t) => t.status === "approved");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore,
          awayScore,
          status,
          winner_team_id: winnerId || null,
          scheduledAt: scheduledAt || null,
          venue_name: venueName || null,
          homeTeamId: homeTeamId || null,
          awayTeamId: awayTeamId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "저장 실패");
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm("이 경기를 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/web/tournaments/${id}/matches/${match.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold">
          {match.roundName ?? "경기"} – {match.match_number ? `#${match.match_number}` : ""}
        </h3>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {/* 팀 배정 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-[#6B7280]">홈팀</label>
            <select
              className="w-full rounded-[12px] border-none bg-[#EDF0F8] px-3 py-2 text-sm text-[#111827]"
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
            >
              <option value="">미정</option>
              {approvedTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B7280]">원정팀</label>
            <select
              className="w-full rounded-[12px] border-none bg-[#EDF0F8] px-3 py-2 text-sm text-[#111827]"
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
            >
              <option value="">미정</option>
              {approvedTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.team.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 점수 */}
        <div className="mb-4 grid grid-cols-3 items-center gap-3">
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(Number(e.target.value))}
            className="w-full rounded-[12px] border-none bg-[#EDF0F8] px-3 py-3 text-center text-xl sm:text-2xl font-bold text-[#111827]"
          />
          <div className="text-center text-sm text-[#9CA3AF]">:</div>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            className="w-full rounded-[12px] border-none bg-[#EDF0F8] px-3 py-3 text-center text-xl sm:text-2xl font-bold text-[#111827]"
          />
        </div>

        {/* 상태 */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-[#6B7280]">상태</label>
          <select
            className="w-full rounded-[12px] border-none bg-[#EDF0F8] px-3 py-2 text-sm text-[#111827]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="scheduled">예정</option>
            <option value="in_progress">진행 중</option>
            <option value="completed">종료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>

        {/* 승자 */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-[#6B7280]">승자 팀</label>
          <select
            className="w-full rounded-[12px] border-none bg-[#EDF0F8] px-3 py-2 text-sm text-[#111827]"
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
          >
            <option value="">미결정</option>
            {homeTeamId && (
              <option value={homeTeamId}>
                {approvedTeams.find((t) => t.id === homeTeamId)?.team.name ?? "홈팀"}
              </option>
            )}
            {awayTeamId && awayTeamId !== homeTeamId && (
              <option value={awayTeamId}>
                {approvedTeams.find((t) => t.id === awayTeamId)?.team.name ?? "원정팀"}
              </option>
            )}
          </select>
        </div>

        {/* 일정 */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-[#6B7280]">경기 일시</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-[12px] border-none bg-[#EDF0F8] px-3 py-2 text-sm text-[#111827]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B7280]">경기장</label>
            <input
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="경기장명"
              className="w-full rounded-[12px] border-none bg-[#EDF0F8] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">취소</Button>
          <button
            onClick={del}
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
          >
            삭제
          </button>
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TournamentMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        fetch(`/api/web/tournaments/${id}/matches`),
        fetch(`/api/web/tournaments/${id}/teams`),
      ]);
      if (mRes.ok) setMatches(await mRes.json());
      if (tRes.ok) setTeams(await tRes.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generateBracket = async (clear = false) => {
    if (clear && !confirm("기존 경기를 모두 삭제하고 다시 생성하시겠습니까?")) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setGenerating(false);
    }
  };

  // 라운드별 그룹핑
  const rounds = Array.from(new Set(matches.map((m) => m.round_number))).sort(
    (a, b) => (a ?? 0) - (b ?? 0)
  );

  if (loading)
    return <div className="flex h-40 items-center justify-center text-[#6B7280]">불러오는 중...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[#6B7280] hover:text-[#111827]">
            ← 대회 관리
          </Link>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold">경기 관리</h1>
        </div>
        <div className="flex gap-2">
          {matches.length > 0 ? (
            <Button
              variant="secondary"
              onClick={() => generateBracket(true)}
              disabled={generating}
              className="text-xs"
            >
              {generating ? "생성 중..." : "대진표 재생성"}
            </Button>
          ) : (
            <Button onClick={() => generateBracket(false)} disabled={generating}>
              {generating ? "생성 중..." : "대진표 생성"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {matches.length === 0 ? (
        <Card className="py-16 text-center text-[#6B7280]">
          <div className="mb-3 text-4xl">📋</div>
          <p className="mb-1 font-medium">경기가 없습니다</p>
          <p className="text-sm">
            승인된 팀이{" "}
            <span className="text-[#E31B23]">
              {teams.filter((t) => t.status === "approved").length}팀
            </span>
            {" "}있습니다. 대진표를 생성하세요.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {rounds.map((roundNum) => {
            const roundMatches = matches.filter((m) => m.round_number === roundNum);
            const roundLabel = roundMatches[0]?.roundName ?? `라운드 ${roundNum}`;

            return (
              <div key={roundNum ?? "none"}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
                  {roundLabel}
                </h2>
                <div className="space-y-2">
                  {roundMatches.map((match) => (
                    <div
                      key={match.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedMatch(match)}
                    >
                    <Card className="transition-colors hover:bg-[#EDF0F8]">
                      <div className="flex items-center gap-4">
                        {/* 경기 번호 */}
                        <span className="w-8 text-center text-xs text-[#9CA3AF]">
                          #{match.match_number ?? "-"}
                        </span>

                        {/* 홈팀 */}
                        <div className="flex-1 text-right">
                          <p className={`font-semibold ${match.winner_team_id === match.homeTeamId && match.homeTeamId ? "text-[#E31B23]" : ""}`}>
                            {match.homeTeam?.team.name ?? "미정"}
                          </p>
                        </div>

                        {/* 점수 */}
                        <div className="flex items-center gap-2 text-center">
                          <span className="min-w-[2rem] text-xl font-bold">{match.homeScore}</span>
                          <span className="text-[#9CA3AF]">:</span>
                          <span className="min-w-[2rem] text-xl font-bold">{match.awayScore}</span>
                        </div>

                        {/* 원정팀 */}
                        <div className="flex-1">
                          <p className={`font-semibold ${match.winner_team_id === match.awayTeamId && match.awayTeamId ? "text-[#E31B23]" : ""}`}>
                            {match.awayTeam?.team.name ?? "미정"}
                          </p>
                        </div>

                        {/* 상태 */}
                        <div className="w-20 text-right">
                          <span className={`text-xs ${STATUS_COLOR[match.status] ?? "text-[#6B7280]"}`}>
                            {STATUS_LABEL[match.status] ?? match.status}
                          </span>
                          {match.scheduledAt && (
                            <p className="mt-0.5 text-[10px] text-[#9CA3AF]">
                              {new Date(match.scheduledAt).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMatch && (
        <ScoreModal
          match={selectedMatch}
          teams={teams}
          onClose={() => setSelectedMatch(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
