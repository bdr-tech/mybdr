"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MAX_FREE_VERSIONS = 3;

type TeamInfo = { id: string; team: { name: string; primaryColor: string | null } };

type Match = {
  id: string;
  roundName: string | null;
  round_number: number | null;
  bracket_position: number | null;
  match_number: number | null;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
};

type ApprovedTeam = { id: string; seedNumber: number | null; team: { name: string } };

type BracketVersion = {
  id: string;
  version_number: number;
  created_at: string;
  is_active: boolean;
};

type BracketData = {
  canCreate: boolean;
  needsApproval: boolean;
  currentVersion: number;
  activeVersion: number | null;
  versions: BracketVersion[];
  matches: Match[];
  approvedTeams: ApprovedTeam[];
  /** 풀리그/토너먼트 UI 분기용 — API 가 함께 내려줌 */
  format: string | null;
};

// 풀리그 계열 포맷 판별 — UI 분기용
function isLeagueFormat(fmt: string | null | undefined): boolean {
  return fmt === "round_robin" || fmt === "full_league" || fmt === "full_league_knockout";
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

export default function BracketAdminPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generate = async (clear = false) => {
    if (clear && !confirm("기존 경기를 모두 삭제하고 재생성하시겠습니까?")) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "생성 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setGenerating(false);
    }
  };

  const activate = async () => {
    setActivating(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/bracket`, { method: "PATCH" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "확정 실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setActivating(false);
    }
  };

  const updateMatchTeam = async (matchId: string, field: "homeTeamId" | "awayTeamId", value: string | null) => {
    setSavingMatch(matchId);
    try {
      await fetch(`/api/web/tournaments/${id}/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      await load();
    } catch { /* ignore */ } finally {
      setSavingMatch(null);
    }
  };

  if (loading)
    return <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">불러오는 중...</div>;

  // 풀리그는 라운드 개념이 없어 "1라운드 팀 배치 편집"을 숨긴다
  const isLeague = isLeagueFormat(data?.format);
  const round1Matches = isLeague ? [] : (data?.matches.filter((m) => m.round_number === 1) ?? []);
  const hasMatches = (data?.matches.length ?? 0) > 0;
  const versionUsed = data?.currentVersion ?? 0;
  const versionLimit = MAX_FREE_VERSIONS;
  const canGenerate = versionUsed < versionLimit;
  const isActivated = data?.activeVersion != null;
  // 풀리그 예상 경기 수 = n*(n-1)/2
  const approvedCount = data?.approvedTeams?.length ?? 0;
  const expectedLeagueMatches = approvedCount >= 2 ? (approvedCount * (approvedCount - 1)) / 2 : 0;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/tournament-admin/tournaments/${id}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          {isLeague ? "풀리그 경기 생성" : "대진표 생성"}
        </h1>
        {isLeague && approvedCount >= 2 && !hasMatches && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            승인된 {approvedCount}팀 기준 총 {expectedLeagueMatches}경기가 생성됩니다.
            {/* Phase 2C: full_league_knockout이면 토너먼트 뼈대도 함께 생성됨을 안내 */}
            {data?.format === "full_league_knockout" && (
              <>
                {" "}
                <span className="text-[var(--color-text-secondary)]">
                  풀리그 경기와 토너먼트 뼈대가 함께 생성됩니다. (토너먼트 슬롯은 리그 완료 후 자동 채워집니다)
                </span>
              </>
            )}
          </p>
        )}
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-[12px] px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* 버전 현황 */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">생성 횟수</p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: versionLimit }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-8 rounded-full ${
                    i < versionUsed ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                {versionUsed}/{versionLimit} 사용
              </span>
            </div>
            {!canGenerate && (
              <p className="mt-1 text-xs text-[var(--color-error)]">
                슈퍼관리자 승인 후 추가 생성 가능합니다.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isActivated && (
              <span className="rounded-full bg-[rgba(74,222,128,0.1)] px-3 py-1 text-xs font-medium text-[var(--color-success)]">
                ✓ 확정됨 (v{data?.activeVersion})
              </span>
            )}
            {hasMatches && (
              <button
                onClick={activate}
                disabled={activating || isActivated}
                className="rounded-full bg-[rgba(27,60,135,0.08)] px-4 py-2 text-sm font-medium text-[var(--color-accent)] hover:bg-[rgba(0,102,255,0.15)] disabled:opacity-50"
              >
                {activating ? "처리 중..." : "최신 버전 확정"}
              </button>
            )}
            {hasMatches ? (
              <Button
                variant="secondary"
                onClick={() => generate(true)}
                disabled={generating || !canGenerate}
                className="text-sm"
              >
                {generating ? "생성 중..." : "재생성"}
              </Button>
            ) : (
              <Button
                onClick={() => generate(false)}
                disabled={generating || !canGenerate}
              >
                {generating ? "생성 중..." : isLeague ? "경기 자동 생성" : "대진표 생성"}
              </Button>
            )}
          </div>
        </div>

        {/* 버전 히스토리 */}
        {(data?.versions.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
            <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">버전 히스토리</p>
            <div className="flex flex-wrap gap-2">
              {data?.versions.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                    v.is_active
                      ? "bg-[rgba(74,222,128,0.1)] text-[var(--color-success)]"
                      : "bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="font-medium">v{v.version_number}</span>
                  <span>{new Date(v.created_at).toLocaleDateString("ko-KR")}</span>
                  {v.is_active && <span>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 1라운드 팀 배치 편집 */}
      {round1Matches.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            1라운드 팀 배치 편집
          </h2>
          <div className="space-y-3">
            {round1Matches.map((match) => (
              <Card key={match.id} className={match.status === "bye" ? "opacity-60" : ""}>
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-center text-xs text-[var(--color-text-muted)]">
                    #{match.match_number ?? "-"}
                  </span>

                  {/* 홈팀 */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[var(--color-text-muted)]">홈팀</label>
                    <select
                      disabled={match.status === "bye" || savingMatch === match.id}
                      value={match.homeTeamId ?? ""}
                      onChange={(e) => updateMatchTeam(match.id, "homeTeamId", e.target.value || null)}
                      className="w-full rounded-[10px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
                    >
                      <option value="">미정</option>
                      {data?.approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.team.name}</option>
                      ))}
                    </select>
                  </div>

                  <span className="mt-4 text-[var(--color-text-muted)]">vs</span>

                  {/* 원정팀 */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[var(--color-text-muted)]">원정팀</label>
                    <select
                      disabled={match.status === "bye" || savingMatch === match.id}
                      value={match.awayTeamId ?? ""}
                      onChange={(e) => updateMatchTeam(match.id, "awayTeamId", e.target.value || null)}
                      className="w-full rounded-[10px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
                    >
                      <option value="">미정</option>
                      {data?.approvedTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.team.name}</option>
                      ))}
                    </select>
                  </div>

                  {match.status === "bye" && (
                    <span className="mt-4 rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                      부전승
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 전체 경기 목록 */}
      {hasMatches && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              전체 경기 ({data?.matches.length}경기)
            </h2>
            <Link
              href={`/tournament-admin/tournaments/${id}/matches`}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              경기 관리로 이동 →
            </Link>
          </div>
          <div className="space-y-1.5">
            {Array.from(new Set(data?.matches.map((m) => m.round_number))).sort((a, b) => (a ?? 0) - (b ?? 0)).map((rn) => {
              const rMatches = data?.matches.filter((m) => m.round_number === rn) ?? [];
              return (
                <div key={rn ?? "x"}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    {rMatches[0]?.roundName ?? `라운드 ${rn}`}
                  </p>
                  {rMatches.map((m) => (
                    <div key={m.id} className="mb-1 flex items-center gap-2 rounded-[10px] bg-[var(--color-surface)] px-3 py-2 text-sm">
                      <span className="w-5 text-center text-xs text-[var(--color-text-muted)]">#{m.match_number ?? "-"}</span>
                      <span className={`flex-1 text-right font-medium ${m.homeTeamId == null ? "text-[var(--color-text-muted)]" : ""}`}>
                        {m.homeTeam?.team.name ?? "미정"}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">vs</span>
                      <span className={`flex-1 font-medium ${m.awayTeamId == null ? "text-[var(--color-text-muted)]" : ""}`}>
                        {m.awayTeam?.team.name ?? "미정"}
                      </span>
                      <span className={`text-xs ${STATUS_LABEL[m.status] ? "text-[var(--color-text-muted)]" : ""}`}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasMatches && (
        <Card className="py-16 text-center text-[var(--color-text-muted)]">
          <div className="mb-3 text-4xl">🏆</div>
          <p className="font-medium">
            {isLeague ? "생성된 경기가 없습니다" : "대진표가 없습니다"}
          </p>
          <p className="mt-1 text-sm">
            승인된 팀 {approvedCount}팀이 있습니다.
            {isLeague && approvedCount >= 2 && (
              <> · 생성 시 {expectedLeagueMatches}경기가 만들어집니다.</>
            )}
          </p>
        </Card>
      )}
    </div>
  );
}
