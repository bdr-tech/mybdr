"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface LiveMatch {
  id: number;
  status: string;
  home_score: number;
  away_score: number;
  round_name: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  tournament_name: string;
  tournament_id: string;
  home_team: { name: string; color: string };
  away_team: { name: string; color: string };
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "예정",
  live: "LIVE",
  in_progress: "진행중",
  completed: "종료",
};

const POLL_INTERVAL = 3_000;

export default function LivePage() {
  const [live, setLive] = useState<LiveMatch[]>([]);
  const [recent, setRecent] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setLive(json.live ?? []);
      setRecent(json.recent_completed ?? []);
      setLastUpdated(new Date());
    } catch {
      // 조용히 무시 — 다음 폴링에서 재시도
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    const timer = setInterval(fetchMatches, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchMatches]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* 헤더 */}
      {/* 보더를 고정 white/10 → 변수로 치환해 라이트/다크 모두 일관되게 */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏀</span>
            <div>
              <h1 className="text-lg font-bold">BDR Live Score</h1>
              {/* 캡션 텍스트: muted 변수로 통일 */}
              <p className="text-xs text-[var(--color-text-muted)]">실시간 경기 스코어</p>
            </div>
          </div>
          {lastUpdated && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {lastUpdated.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Seoul",
              })}{" "}
              기준
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* 로딩 */}
        {loading && (
          <div className="flex justify-center py-12">
            {/* TODO: accent 변수 추가 시 var(--color-accent)로 매핑. 현재 warning 변수는 의미 불일치로 스킵. */}
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 진행 중인 경기 없음 */}
        {!loading && live.length === 0 && recent.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏀</div>
            {/* 본문급 문구: secondary / 부가 설명: muted */}
            <p className="text-[var(--color-text-secondary)] text-lg font-medium">현재 진행 중인 경기가 없습니다</p>
            <p className="text-[var(--color-text-muted)] text-sm mt-2">
              경기가 시작되면 자동으로 표시됩니다
            </p>
          </div>
        )}

        {/* LIVE 경기 */}
        {live.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              {/* LIVE 펄스 점: status-live 변수 */}
              <span className="w-2 h-2 bg-[var(--color-status-live)] rounded-full animate-pulse" />
              <h2 className="text-sm font-semibold text-[var(--color-status-live)] uppercase tracking-wider">
                Live Now
              </h2>
            </div>
            <div className="space-y-3">
              {live.map((m) => (
                <MatchCard key={m.id} match={m} isLive />
              ))}
            </div>
          </section>
        )}

        {/* 최근 종료 경기 */}
        {recent.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              최근 종료
            </h2>
            <div className="space-y-3">
              {recent.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, isLive }: { match: LiveMatch; isLive?: boolean }) {
  return (
    <Link href={`/live/${match.id}`}>
      <div
        className={`bg-[var(--color-surface)] rounded-md p-4 transition-all hover:bg-[var(--color-elevated)] ${
          // LIVE 링: status-live 30% 투명 (color-mix로 라이트/다크 모두 대응)
          isLive ? "ring-1 ring-[color-mix(in_srgb,var(--color-status-live)_30%,transparent)]" : ""
        }`}
      >
        {/* 대회명 + 상태 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--color-text-muted)] truncate pr-2">
            {match.tournament_name}
            {match.round_name ? ` · ${match.round_name}` : ""}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isLive
                // LIVE 뱃지: status-live 20% 배경 + 본색 텍스트
                ? "bg-[color-mix(in_srgb,var(--color-status-live)_20%,transparent)] text-[var(--color-status-live)]"
                // 기본 뱃지: elevated 배경 + secondary 텍스트
                : "bg-[var(--color-elevated)] text-[var(--color-text-secondary)]"
            }`}
          >
            {STATUS_LABEL[match.status] ?? match.status}
          </span>
        </div>

        {/* 스코어 */}
        <div className="flex items-center justify-between">
          {/* 홈팀 */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: match.home_team.color }}
            >
              H
            </div>
            <div className="min-w-0">
              {/* 팀명: primary 텍스트로 통일 */}
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {match.home_team.name}
              </p>
            </div>
          </div>

          {/* 점수 */}
          <div className="flex items-center gap-3 px-4">
            <span
              className="text-3xl font-black tabular-nums"
              style={{ color: match.home_team.color }}
            >
              {match.home_score}
            </span>
            <span className="text-[var(--color-text-muted)] text-lg">:</span>
            <span
              className="text-3xl font-black tabular-nums"
              style={{ color: match.away_team.color }}
            >
              {match.away_score}
            </span>
          </div>

          {/* 원정팀 */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="min-w-0 text-right">
              {/* 팀명: primary 텍스트로 통일 */}
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {match.away_team.name}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: match.away_team.color }}
            >
              A
            </div>
          </div>
        </div>

        {/* 터치해서 박스스코어 보기 */}
        <div className="mt-3 text-center">
          <span className="text-xs text-[var(--color-text-muted)]">
            터치하면 박스스코어를 볼 수 있습니다
          </span>
        </div>
      </div>
    </Link>
  );
}
