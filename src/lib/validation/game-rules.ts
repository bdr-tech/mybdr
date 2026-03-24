/**
 * game_rules JSON Zod 스키마
 *
 * Marcus 설계: game-rules-schema.md 기반
 * FR-006: 샷클락 소수점 (shot_clock.decimal_threshold_seconds, decimal_precision)
 * FR-010: 타임아웃 설정 (timeouts 섹션)
 *
 * 모든 필드는 optional — 누락 시 FIBA 기본값으로 폴백.
 * Flutter 앱(bdr_stat)의 GameRulesModel.fromJson()과 1:1 대응.
 */
import { z } from "zod";

// -- timing --
export const timingSchema = z.object({
  quarter_minutes: z.number().int().min(1).max(20).optional(),
  overtime_minutes: z.number().int().min(1).max(10).optional(),
  halftime_seconds: z.number().int().min(0).max(1800).optional(),
  quarter_break_seconds: z.number().int().min(0).max(600).optional(),
  before_overtime_seconds: z.number().int().min(0).max(600).optional(),
}).optional();

// -- shot_clock (FR-006) --
export const shotClockSchema = z.object({
  full_seconds: z.number().int().min(10).max(60).optional(),
  after_offensive_rebound_seconds: z.number().int().min(5).max(30).optional(),
  decimal_threshold_seconds: z.number().int().min(0).max(24).optional(),
  decimal_precision: z.number().int().min(0).max(2).optional(),
}).optional();

// -- fouls --
export const foulsSchema = z.object({
  foul_out_limit: z.number().int().min(3).max(10).optional(),
  team_bonus_threshold: z.number().int().min(1).max(10).optional(),
  team_double_bonus_threshold: z.number().int().min(1).max(999).optional(),
  technical_foul_ejection_limit: z.number().int().min(1).max(5).optional(),
}).optional();

// -- timeouts (FR-010) --
export const timeoutsSchema = z.object({
  full_duration_seconds: z.number().int().min(10).max(120).optional(),
  twenty_second_duration_seconds: z.number().int().min(10).max(60).optional(),
  timeouts_first_half: z.number().int().min(0).max(10).optional(),
  timeouts_second_half: z.number().int().min(0).max(10).optional(),
  timeouts_overtime: z.number().int().min(0).max(5).optional(),
  bonus_timeout_last2min_enabled: z.boolean().optional(),
  bonus_timeout_last2min_count: z.number().int().min(0).max(3).optional(),
}).optional();

// -- scoring --
export const scoringSchema = z.object({
  three_point_line_enabled: z.boolean().optional(),
  goaltending_violation_enabled: z.boolean().optional(),
}).optional();

/** 완전한 game_rules 스키마 — 5개 섹션 모두 optional */
export const gameRulesSchema = z.object({
  timing: timingSchema,
  shot_clock: shotClockSchema,
  fouls: foulsSchema,
  timeouts: timeoutsSchema,
  scoring: scoringSchema,
}).optional();

export type GameRulesInput = z.infer<typeof gameRulesSchema>;
