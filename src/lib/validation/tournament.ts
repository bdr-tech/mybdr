import { z } from "zod";

export const subdomainCheckSchema = z.object({
  name: z
    .string()
    .min(3, "최소 3자 이상")
    .max(30, "최대 30자")
    .regex(/^[a-z0-9-]+$/, "영문 소문자, 숫자, 하이픈만 사용 가능"),
});

export type SubdomainCheckInput = z.infer<typeof subdomainCheckSchema>;

// 대회 수정 스키마 — 모든 필드 optional (partial update)
export const updateTournamentSchema = z
  .object({
    name: z.string().trim().min(1, "대회명을 입력하세요").max(100, "대회명은 100자 이하여야 합니다"),
    format: z.string(),
    // 빈 문자열("")도 허용 — datetime-local 입력 초기화 시 빈 문자열이 올 수 있음
    startDate: z.string().nullable().or(z.literal("")),
    endDate: z.string().nullable().or(z.literal("")),
    status: z.string(),
    venue_name: z.string().nullable(),
    venue_address: z.string().nullable(),
    city: z.string().nullable(),
    district: z.string().nullable(),
    maxTeams: z.number().int().min(1, "최대 팀 수는 1 이상이어야 합니다"),
    team_size: z.number().int().min(1),
    roster_min: z.number().int().min(1),
    roster_max: z.number().int().min(1),
    entry_fee: z.number().min(0, "참가비는 0 이상이어야 합니다"),
    // 빈 문자열("")도 허용 — datetime-local 입력 초기화 시 빈 문자열이 올 수 있음
    registration_start_at: z.string().nullable().or(z.literal("")),
    registration_end_at: z.string().nullable().or(z.literal("")),
    description: z.string().max(5000, "설명은 5000자 이하여야 합니다").nullable(),
    rules: z.string().nullable(),
    prize_info: z.string().nullable(),
    is_public: z.boolean(),
    auto_approve_teams: z.boolean(),
    primary_color: z.string().nullable(),
    secondary_color: z.string().nullable(),
    // 접수 설정
    categories: z.record(z.string(), z.union([z.array(z.string()), z.boolean()])),
    div_caps: z.record(z.string(), z.number().int().min(0)),
    div_fees: z.record(z.string(), z.number().min(0)),
    allow_waiting_list: z.boolean(),
    waiting_list_cap: z.number().int().positive().nullable(),
    bank_name: z.string().nullable(),
    bank_account: z.string().nullable(),
    bank_holder: z.string().nullable(),
    fee_notes: z.string().nullable(),
    // 새 필드: 주최/주관/후원/성별/경기설정/장소
    organizer: z.string().nullable(),
    host: z.string().nullable(),
    sponsors: z.string().nullable(),
    gender: z.string().nullable(),
    game_time: z.string().nullable(),
    game_ball: z.string().nullable(),
    game_method: z.string().nullable(),
    places: z.array(z.object({ name: z.string(), address: z.string() })).nullable(),
    // 디자인 템플릿 + 이미지 URL
    design_template: z.enum(["basic", "poster", "logo", "photo"]).nullable(),
    logo_url: z.string().url().nullable().or(z.literal("")).or(z.null()),
    banner_url: z.string().url().nullable().or(z.literal("")).or(z.null()),
  })
  .partial()
  .refine(
    (data) => {
      if (data.roster_min !== undefined && data.roster_max !== undefined) {
        return data.roster_min <= data.roster_max;
      }
      return true;
    },
    { message: "최소 로스터 수가 최대 로스터 수보다 클 수 없습니다", path: ["roster_min"] }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: "시작일이 종료일보다 늦을 수 없습니다", path: ["startDate"] }
  );

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
