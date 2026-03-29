import { z } from "zod";

// 현장 선수 등록 스키마 (FR-101 ~ FR-105)
export const onsitePlayerRegistrationSchema = z.object({
  player_name: z
    .string()
    .trim()
    .min(1, "선수 이름을 입력하세요")
    .max(50, "선수 이름은 50자 이하여야 합니다"),
  jersey_number: z
    .number()
    .int("등번호는 정수여야 합니다")
    .min(0, "등번호는 0 이상이어야 합니다")
    .max(99, "등번호는 99 이하여야 합니다"),
  position: z
    .enum(["PG", "SG", "SF", "PF", "C"])
    .optional()
    .nullable(),
  birth_date: z
    .string()
    .max(20)
    .optional()
    .nullable(),
});

export type OnsitePlayerRegistrationInput = z.infer<typeof onsitePlayerRegistrationSchema>;

// 선수 목록 조회 쿼리 파라미터
export const playerListQuerySchema = z.object({
  updated_after: z
    .string()
    .datetime({ offset: true })
    .optional(),
});

export type PlayerListQueryInput = z.infer<typeof playerListQuerySchema>;
