/**
 * FIBA 2025 기본 game_rules 상수
 *
 * Marcus 설계: game-rules-schema.md 기반
 * FR-006: 샷클락 소수점 표시
 * FR-010: 타임아웃 설정
 */

export const FIBA_TIMING_DEFAULTS = {
  quarter_minutes: 10,
  overtime_minutes: 5,
  halftime_seconds: 600,
  quarter_break_seconds: 120,
  before_overtime_seconds: 120,
} as const;

export const FIBA_SHOT_CLOCK_DEFAULTS = {
  full_seconds: 24,
  after_offensive_rebound_seconds: 14,
  decimal_threshold_seconds: 5,
  decimal_precision: 1,
} as const;

export const FIBA_FOULS_DEFAULTS = {
  foul_out_limit: 5,
  team_bonus_threshold: 5,
  team_double_bonus_threshold: 10,
  technical_foul_ejection_limit: 2,
} as const;

export const FIBA_TIMEOUTS_DEFAULTS = {
  full_duration_seconds: 60,
  twenty_second_duration_seconds: 20,
  timeouts_first_half: 2,
  timeouts_second_half: 3,
  timeouts_overtime: 1,
  bonus_timeout_last2min_enabled: false,
  bonus_timeout_last2min_count: 1,
} as const;

export const FIBA_SCORING_DEFAULTS = {
  three_point_line_enabled: true,
  goaltending_violation_enabled: true,
} as const;

/** FIBA 2025 기본 game_rules 전체 */
export const FIBA_GAME_RULES_DEFAULTS = {
  timing: { ...FIBA_TIMING_DEFAULTS },
  shot_clock: { ...FIBA_SHOT_CLOCK_DEFAULTS },
  fouls: { ...FIBA_FOULS_DEFAULTS },
  timeouts: { ...FIBA_TIMEOUTS_DEFAULTS },
  scoring: { ...FIBA_SCORING_DEFAULTS },
} as const;

export type GameRules = typeof FIBA_GAME_RULES_DEFAULTS;
