"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";

type TournamentTeam = {
  id: string;
  status: string;
  seedNumber: number | null;
  groupName: string | null;
  createdAt: string;
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  players: { id: string; role: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기 중",
  approved: "승인",
  rejected: "거절",
  withdrawn: "취소",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
  approved: "text-[var(--color-game-team)] bg-[var(--color-game-team)]/10",
  rejected: "text-[var(--color-error)] bg-[rgba(239,68,68,0.1)]",
  withdrawn: "text-[var(--color-text-muted)] bg-[var(--color-elevated)]",
};

export default function TournamentTeamsPage() {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams`);
      if (res.ok) setTeams(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (teamId: string, status: string) => {
    setActionLoading(teamId);
    try {
      await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch { /* ignore */ } finally {
      setActionLoading(null);
    }
  };

  const updateSeed = async (teamId: string, seed: number | null) => {
    try {
      await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedNumber: seed }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const filtered = filter === "all" ? teams : teams.filter((t) => t.status === filter);

  const counts = {
    all: teams.length,
    pending: teams.filter((t) => t.status === "pending").length,
    approved: teams.filter((t) => t.status === "approved").length,
    rejected: teams.filter((t) => t.status === "rejected").length,
  };

  if (loading)
    return <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">불러오는 중...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">← 대회 관리</Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">참가팀 관리</h1>
        </div>
      </div>

      {/* 통계 탭 */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              filter === s ? "bg-[var(--color-accent)] font-semibold text-[var(--color-on-accent)]" : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {s === "all" ? "전체" : STATUS_LABEL[s]}
            <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-xs">{counts[s]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-3xl">🏀</div>
          {filter === "all" ? "참가 신청한 팀이 없습니다." : `${STATUS_LABEL[filter]} 상태의 팀이 없습니다.`}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((tt) => (
            <Card key={tt.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* 팀 색상 아이콘 */}
                  <div
                    className="h-10 w-10 rounded-full"
                    style={{ backgroundColor: tt.team.primaryColor ?? "var(--color-primary)" }}
                  />
                  <div>
                    <p className="font-semibold">{tt.team.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      선수 {tt.players.length}명 ·{" "}
                      {new Date(tt.createdAt).toLocaleDateString("ko-KR")} 신청
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* 시드 배정 */}
                  {tt.status === "approved" && (
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-[var(--color-text-muted)]">시드</label>
                      <input
                        type="number"
                        min={1}
                        defaultValue={tt.seedNumber ?? ""}
                        onBlur={(e) =>
                          updateSeed(tt.id, e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-16 rounded-[8px] border-none bg-[var(--color-elevated)] px-2 py-1 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50"
                        placeholder="-"
                      />
                    </div>
                  )}

                  {/* 상태 뱃지 */}
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[tt.status] ?? ""}`}>
                    {STATUS_LABEL[tt.status] ?? tt.status}
                  </span>

                  {/* 액션 버튼 */}
                  {tt.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(tt.id, "approved")}
                        disabled={actionLoading === tt.id}
                        className="rounded-full bg-[var(--color-game-team)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-game-team)] hover:bg-[var(--color-game-team)]/20 disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => updateStatus(tt.id, "rejected")}
                        disabled={actionLoading === tt.id}
                        className="rounded-full bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20 disabled:opacity-50"
                      >
                        거절
                      </button>
                    </div>
                  )}
                  {tt.status === "approved" && (
                    <button
                      onClick={() => updateStatus(tt.id, "rejected")}
                      disabled={actionLoading === tt.id}
                      className="rounded-full bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20 disabled:opacity-50"
                    >
                      거절
                    </button>
                  )}
                  {tt.status === "rejected" && (
                    <button
                      onClick={() => updateStatus(tt.id, "approved")}
                      disabled={actionLoading === tt.id}
                      className="rounded-full bg-[var(--color-game-team)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-game-team)] hover:bg-[var(--color-game-team)]/20 disabled:opacity-50"
                    >
                      승인으로 변경
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
