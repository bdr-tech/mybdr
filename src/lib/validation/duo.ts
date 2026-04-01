import { z } from "zod";

// POST /api/v1/duo/pair — 호스트가 PIN 생성
export const duoPairSchema = z.object({
  tournament_id: z
    .string()
    .uuid("유효하지 않은 대회 ID입니다"),
  match_id: z
    .number()
    .int("경기 ID는 정수여야 합니다")
    .positive("경기 ID는 양수여야 합니다"),
});

export type DuoPairInput = z.infer<typeof duoPairSchema>;

// POST /api/v1/duo/join — 게스트가 PIN으로 참가
export const duoJoinSchema = z.object({
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN은 4자리 숫자여야 합니다"),
});

export type DuoJoinInput = z.infer<typeof duoJoinSchema>;
