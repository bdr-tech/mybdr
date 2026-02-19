import { z } from "zod";

export const playerStatSchema = z.object({
  tournamentTeamPlayerId: z.string().uuid(),
  points: z.number().int().min(0).default(0),
  rebounds: z.number().int().min(0).default(0),
  assists: z.number().int().min(0).default(0),
  steals: z.number().int().min(0).default(0),
  blocks: z.number().int().min(0).default(0),
  turnovers: z.number().int().min(0).default(0),
  fouls: z.number().int().min(0).max(6).default(0),
  fieldGoalsMade: z.number().int().min(0).default(0),
  fieldGoalsAttempted: z.number().int().min(0).default(0),
  threePointersMade: z.number().int().min(0).default(0),
  threePointersAttempted: z.number().int().min(0).default(0),
  freeThrowsMade: z.number().int().min(0).default(0),
  freeThrowsAttempted: z.number().int().min(0).default(0),
  minutesPlayed: z.number().int().min(0).max(60).default(0),
  isStarter: z.boolean().default(false),
  plusMinus: z.number().int().default(0),
});

export const createStatSchema = playerStatSchema;

export const bulkStatsSchema = z.object({
  stats: z.array(playerStatSchema).min(1).max(30),
});

export const batchSyncSchema = z.object({
  matches: z.array(
    z.object({
      matchId: z.string().uuid(),
      homeScore: z.number().int().min(0),
      awayScore: z.number().int().min(0),
      status: z.enum(["scheduled", "live", "completed"]),
      quarterScores: z.array(z.number().int()).optional(),
      playerStats: z.array(playerStatSchema).optional(),
    })
  ),
});

export type PlayerStatInput = z.infer<typeof playerStatSchema>;
export type BulkStatsInput = z.infer<typeof bulkStatsSchema>;
export type BatchSyncInput = z.infer<typeof batchSyncSchema>;
