import { z } from "zod";

// 영문명 규칙: 알파벳/숫자/공백/하이픈만 허용, 빈 문자열은 null로 치환
const nameEnSchema = z
  .string()
  .trim()
  .max(100, "영문 팀명은 100자 이하여야 합니다")
  .regex(/^[A-Za-z0-9 \-]*$/, "영문, 숫자, 공백, 하이픈만 사용 가능합니다")
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const updateTeamSchema = z.object({
  name: z.string().trim().min(2, "팀명은 2자 이상이어야 합니다").max(30, "팀명은 30자 이하여야 합니다").optional(),
  name_en: nameEnSchema,
  name_primary: z.enum(["ko", "en"]).default("ko").optional(),
  description: z.string().max(500).nullable().optional(),
  city: z.string().max(50).nullable().optional(),
  district: z.string().max(50).nullable().optional(),
  home_court: z.string().max(100).nullable().optional(),
  founded_year: z.number().int().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "유효한 색상 코드를 입력하세요").optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "유효한 색상 코드를 입력하세요").optional(),
  is_public: z.boolean().optional(),
  accepting_members: z.boolean().optional(),
  max_members: z.number().int().min(2).max(50).optional(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
