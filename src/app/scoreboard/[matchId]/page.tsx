"use client";

import { useEffect, useReducer, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ScoreUpdatePayload,
  TimerTickPayload,
  QuarterChangePayload,
  PbpEventPayload,
  TeamFoulPayload,
  ScoreSnapshotPayload,
} from "@/lib/supabase/types";

/* ─────────────────────────────────────────────
 * State
 * ───────────────────────────────────────────── */

interface ScoreboardState {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  quarterLabel: string;
  remainingSeconds: number;
  isRunning: boolean;
  shotClock: number | null;
  homeTeamFouls: number;
  awayTeamFouls: number;
  homeTimeoutsRemaining: number;
  awayTimeoutsRemaining: number;
  homeTimeoutsTotal: number;
  awayTimeoutsTotal: number;
  recentEvents: PbpEventPayload[];
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
}

const initialState: ScoreboardState = {
  homeTeamName: "HOME",
  awayTeamName: "AWAY",
  homeScore: 0,
  awayScore: 0,
  quarter: 1,
  quarterLabel: "Q1",
  remainingSeconds: 600,
  isRunning: false,
  shotClock: null,
  homeTeamFouls: 0,
  awayTeamFouls: 0,
  homeTimeoutsRemaining: 3,
  awayTimeoutsRemaining: 3,
  homeTimeoutsTotal: 3,
  awayTimeoutsTotal: 3,
  recentEvents: [],
  connectionStatus: "connecting",
};

type Action =
  | { type: "SCORE_UPDATE"; payload: ScoreUpdatePayload }
  | { type: "TIMER_TICK"; payload: TimerTickPayload }
  | { type: "QUARTER_CHANGE"; payload: QuarterChangePayload }
  | { type: "PBP_EVENT"; payload: PbpEventPayload }
  | { type: "TEAM_FOUL"; payload: TeamFoulPayload }
  | { type: "SNAPSHOT"; payload: ScoreSnapshotPayload }
  | { type: "CONNECTION_STATUS"; status: ScoreboardState["connectionStatus"] };

function reducer(state: ScoreboardState, action: Action): ScoreboardState {
  switch (action.type) {
    case "SCORE_UPDATE":
      return {
        ...state,
        homeScore: action.payload.home_score,
        awayScore: action.payload.away_score,
        homeTeamName: action.payload.home_team_name || state.homeTeamName,
        awayTeamName: action.payload.away_team_name || state.awayTeamName,
      };
    case "TIMER_TICK":
      return {
        ...state,
        remainingSeconds: action.payload.remaining_seconds,
        isRunning: action.payload.is_running,
        shotClock: action.payload.shot_clock ?? state.shotClock,
      };
    case "QUARTER_CHANGE":
      return {
        ...state,
        quarter: action.payload.quarter,
        quarterLabel: action.payload.quarter_label,
      };
    case "PBP_EVENT":
      return {
        ...state,
        recentEvents: [action.payload, ...state.recentEvents].slice(0, 10),
      };
    case "TEAM_FOUL":
      return {
        ...state,
        homeTeamFouls: action.payload.home_team_fouls,
        awayTeamFouls: action.payload.away_team_fouls,
        homeTimeoutsRemaining: action.payload.home_timeouts_remaining,
        awayTimeoutsRemaining: action.payload.away_timeouts_remaining,
        homeTimeoutsTotal: action.payload.home_timeouts_total,
        awayTimeoutsTotal: action.payload.away_timeouts_total,
      };
    case "SNAPSHOT":
      return {
        ...state,
        homeScore: action.payload.home_score,
        awayScore: action.payload.away_score,
        homeTeamName: action.payload.home_team_name || state.homeTeamName,
        awayTeamName: action.payload.away_team_name || state.awayTeamName,
        quarter: action.payload.quarter,
        quarterLabel: action.payload.quarter_label,
        remainingSeconds: action.payload.remaining_seconds,
        isRunning: action.payload.is_running,
        shotClock: action.payload.shot_clock ?? null,
        homeTeamFouls: action.payload.home_team_fouls,
        awayTeamFouls: action.payload.away_team_fouls,
        homeTimeoutsRemaining: action.payload.home_timeouts_remaining,
        awayTimeoutsRemaining: action.payload.away_timeouts_remaining,
        homeTimeoutsTotal: action.payload.home_timeouts_total,
        awayTimeoutsTotal: action.payload.away_timeouts_total,
        recentEvents: action.payload.recent_events ?? state.recentEvents,
      };
    case "CONNECTION_STATUS":
      return { ...state, connectionStatus: action.status };
    default:
      return state;
  }
}

/* ─────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────── */

function formatTime(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function TimeoutDots({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  return (
    <span className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            i < remaining
              ? "bg-[var(--color-warning)]"
              : "bg-[var(--color-text-disabled)]"
          }`}
        />
      ))}
    </span>
  );
}

function ConnectionBadge({
  status,
}: {
  status: ScoreboardState["connectionStatus"];
}) {
  const config = {
    connecting: { color: "bg-[var(--color-warning)]", label: "연결 중..." },
    connected: { color: "bg-[var(--color-success)]", label: "LIVE" },
    disconnected: { color: "bg-[var(--color-text-disabled)]", label: "연결 끊김" },
    error: { color: "bg-[var(--color-error)]", label: "오류" },
  };
  const { color, label } = config[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
      <span className={`inline-block h-2 w-2 rounded-full ${color} ${status === "connected" ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
 * Page Component
 * ───────────────────────────────────────────── */

export default function ScoreboardPage() {
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel");
  const [state, dispatch] = useReducer(reducer, initialState);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null>(null);

  const handleEvent = useCallback(
    (eventType: string, payload: Record<string, unknown>) => {
      switch (eventType) {
        case "score_update":
          dispatch({ type: "SCORE_UPDATE", payload: payload as unknown as ScoreUpdatePayload });
          break;
        case "timer_tick":
          dispatch({ type: "TIMER_TICK", payload: payload as unknown as TimerTickPayload });
          break;
        case "quarter_change":
          dispatch({ type: "QUARTER_CHANGE", payload: payload as unknown as QuarterChangePayload });
          break;
        case "pbp_event":
          dispatch({ type: "PBP_EVENT", payload: payload as unknown as PbpEventPayload });
          break;
        case "team_foul":
          dispatch({ type: "TEAM_FOUL", payload: payload as unknown as TeamFoulPayload });
          break;
        case "score_snapshot":
          dispatch({ type: "SNAPSHOT", payload: payload as unknown as ScoreSnapshotPayload });
          break;
      }
    },
    []
  );

  useEffect(() => {
    if (!channel) return;

    let isMounted = true;

    try {
      const supabase = getSupabaseBrowserClient();
      const realtimeChannel = supabase.channel(channel);

      // 모든 이벤트 타입 구독
      const eventTypes = [
        "score_update",
        "timer_tick",
        "quarter_change",
        "pbp_event",
        "team_foul",
        "score_snapshot",
      ];

      for (const evt of eventTypes) {
        realtimeChannel.on("broadcast", { event: evt }, (message) => {
          if (isMounted) {
            handleEvent(evt, message.payload as Record<string, unknown>);
          }
        });
      }

      realtimeChannel.subscribe((status) => {
        if (!isMounted) return;
        if (status === "SUBSCRIBED") {
          dispatch({ type: "CONNECTION_STATUS", status: "connected" });
        } else if (status === "CLOSED") {
          dispatch({ type: "CONNECTION_STATUS", status: "disconnected" });
        } else if (status === "CHANNEL_ERROR") {
          dispatch({ type: "CONNECTION_STATUS", status: "error" });
        }
      });

      channelRef.current = realtimeChannel;
    } catch {
      if (isMounted) {
        dispatch({ type: "CONNECTION_STATUS", status: "error" });
      }
    }

    return () => {
      isMounted = false;
      if (channelRef.current) {
        const supabase = getSupabaseBrowserClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channel, handleEvent]);

  /* ── 채널 없음 에러 ── */
  if (!channel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <span className="material-symbols-outlined mb-4 block text-5xl text-[var(--color-error)]">
            error
          </span>
          <h1 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
            채널 정보가 없습니다
          </h1>
          <p className="text-[var(--color-text-muted)]">
            올바른 스코어보드 URL로 접속해주세요.
          </p>
        </div>
      </div>
    );
  }

  /* ── 메인 스코어보드 ── */
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* 상단: 연결 상태 */}
      <header className="flex items-center justify-between px-4 py-2 sm:px-6">
        <span className="text-xs font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
          BDR Live
        </span>
        <ConnectionBadge status={state.connectionStatus} />
      </header>

      {/* 점수판 */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <section className="w-full max-w-3xl">
          {/* 팀 이름 */}
          <div className="mb-2 flex items-center justify-between text-center">
            <h2 className="flex-1 truncate text-base font-bold sm:text-xl">
              {state.homeTeamName}
            </h2>
            <span className="mx-4 text-sm text-[var(--color-text-muted)]">vs</span>
            <h2 className="flex-1 truncate text-base font-bold sm:text-xl">
              {state.awayTeamName}
            </h2>
          </div>

          {/* 점수 */}
          <div className="mb-4 flex items-center justify-center gap-6">
            <span className="text-6xl font-black tabular-nums sm:text-8xl lg:text-9xl">
              {state.homeScore}
            </span>
            <span className="text-3xl font-light text-[var(--color-text-muted)] sm:text-5xl">
              :
            </span>
            <span className="text-6xl font-black tabular-nums sm:text-8xl lg:text-9xl">
              {state.awayScore}
            </span>
          </div>

          {/* 쿼터 / 타이머 / 샷클락 */}
          <div className="mb-6 flex items-center justify-center gap-4 text-lg sm:text-xl">
            <span className="rounded bg-[var(--color-primary)] px-3 py-1 text-sm font-bold text-[var(--color-on-primary)]">
              {state.quarterLabel}
            </span>
            <span className={`font-mono text-2xl font-bold tabular-nums sm:text-3xl ${state.isRunning ? "text-[var(--color-success)]" : ""}`}>
              {formatTime(state.remainingSeconds)}
            </span>
            {state.shotClock !== null && (
              <span className="rounded bg-[var(--color-surface)] px-2 py-1 text-sm font-bold tabular-nums text-[var(--color-warning)]">
                Shot: {state.shotClock}
              </span>
            )}
          </div>

          {/* 팀 파울 / 타임아웃 */}
          <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            {/* 홈 팀 */}
            <div className="space-y-2 text-center">
              <div className="text-xs text-[var(--color-text-muted)]">
                팀파울
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {state.homeTeamFouls}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">T/O</div>
              <div className="flex justify-center">
                <TimeoutDots
                  remaining={state.homeTimeoutsRemaining}
                  total={state.homeTimeoutsTotal}
                />
              </div>
            </div>
            {/* 어웨이 팀 */}
            <div className="space-y-2 text-center">
              <div className="text-xs text-[var(--color-text-muted)]">
                팀파울
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {state.awayTeamFouls}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">T/O</div>
              <div className="flex justify-center">
                <TimeoutDots
                  remaining={state.awayTimeoutsRemaining}
                  total={state.awayTimeoutsTotal}
                />
              </div>
            </div>
          </div>

          {/* 최근 플레이 */}
          {state.recentEvents.length > 0 && (
            <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-3 text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                최근 플레이
              </h3>
              <ul className="space-y-2">
                {state.recentEvents.map((evt, i) => (
                  <li
                    key={`${evt.timestamp}-${i}`}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="w-12 shrink-0 font-mono text-[var(--color-text-muted)] tabular-nums">
                      {evt.timestamp}
                    </span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${
                        evt.team_side === "home"
                          ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                          : "bg-[var(--color-accent-light)] text-[var(--color-info)]"
                      }`}
                    >
                      {evt.player_number != null ? `#${evt.player_number}` : ""}
                    </span>
                    <span className="flex-1 text-[var(--color-text-secondary)]">
                      {evt.player_name && (
                        <span className="mr-1 font-medium text-[var(--color-text-primary)]">
                          {evt.player_name}
                        </span>
                      )}
                      {evt.description}
                    </span>
                    {evt.points != null && evt.points > 0 && (
                      <span className="font-bold text-[var(--color-success)]">
                        +{evt.points}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </main>

      {/* 하단 */}
      <footer className="py-3 text-center text-xs text-[var(--color-text-disabled)]">
        MyBDR Live Scoreboard
      </footer>
    </div>
  );
}
