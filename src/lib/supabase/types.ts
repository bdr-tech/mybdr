/**
 * Supabase Realtime 경기 스코어보드 이벤트 타입
 * Flutter 앱(bdr_stat)에서 broadcast하는 이벤트 구조
 */

export interface ScoreUpdatePayload {
  home_score: number;
  away_score: number;
  home_team_name: string;
  away_team_name: string;
}

export interface TimerTickPayload {
  remaining_seconds: number;
  is_running: boolean;
  shot_clock?: number;
}

export interface QuarterChangePayload {
  quarter: number;
  quarter_label: string; // "Q1", "Q2", "Q3", "Q4", "OT1" 등
}

export interface PbpEventPayload {
  event_type: string;
  player_name: string;
  player_number: number | null;
  team_side: "home" | "away";
  description: string;
  points?: number;
  timestamp: string; // 게임 내 타이머 시각 (예: "07:45")
}

export interface TeamFoulPayload {
  home_team_fouls: number;
  away_team_fouls: number;
  home_timeouts_remaining: number;
  away_timeouts_remaining: number;
  home_timeouts_total: number;
  away_timeouts_total: number;
}

/** 경기 전체 상태 스냅샷 (초기 로드 + 주기적 동기화) */
export interface ScoreSnapshotPayload {
  home_score: number;
  away_score: number;
  home_team_name: string;
  away_team_name: string;
  quarter: number;
  quarter_label: string;
  remaining_seconds: number;
  is_running: boolean;
  shot_clock?: number;
  home_team_fouls: number;
  away_team_fouls: number;
  home_timeouts_remaining: number;
  away_timeouts_remaining: number;
  home_timeouts_total: number;
  away_timeouts_total: number;
  recent_events: PbpEventPayload[];
}

/** Supabase Broadcast 이벤트 타입 유니온 */
export type ScoreboardEventType =
  | "score_update"
  | "timer_tick"
  | "quarter_change"
  | "pbp_event"
  | "team_foul"
  | "score_snapshot";
