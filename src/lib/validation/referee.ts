import { z } from "zod";

/**
 * 심판(Referee) + 심판 자격증(RefereeCertificate) Zod 스키마.
 *
 * 설계 메모:
 * - user_id, referee_id는 클라이언트 입력을 절대 받지 않는다. 서버에서 세션 기반 주입.
 * - verified / verified_at / verified_by_admin_id는 자격증 소유자 본인이 수정할 수 없다. 스키마에서 아예 누락시켜 안전 차단.
 * - BigInt 필드(association_id)는 JSON에서 string 또는 number로 들어올 수 있으므로 문자열(숫자) 허용 후 서버에서 BigInt 변환.
 */

// ─────────────────────────────────────────────────────────────
// 공통 enum
// ─────────────────────────────────────────────────────────────

// role_type / cert_type 공통 enum (referee/scorer/timer)
const refereeRoleEnum = z.enum(["referee", "scorer", "timer"]);

// level enum (심판 숙련도)
const refereeLevelEnum = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "international",
]);

// status enum (Referee.status)
const refereeStatusEnum = z.enum(["active", "inactive", "pending_review"]);

// association_id: JSON에서 number/string 둘 다 허용 (클라이언트는 문자열 권장)
const associationIdSchema = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  // 숫자 문자열만 허용 (음수/소수/공백 차단)
  .refine((v) => /^\d+$/.test(v), {
    message: "유효하지 않은 값입니다.",
  });

// ─────────────────────────────────────────────────────────────
// Referee (본인)
// ─────────────────────────────────────────────────────────────

// 본인 Referee 생성 (user_id는 서버 주입)
export const refereeCreateSchema = z.object({
  // 소속 협회 (선택)
  association_id: associationIdSchema.optional().nullable(),
  license_number: z.string().trim().max(50).optional().nullable(),
  level: refereeLevelEnum.optional().nullable(),
  // 기본값은 서버에서 넣어주므로 optional
  role_type: refereeRoleEnum.optional(),
  region_sido: z.string().trim().max(20).optional().nullable(),
  region_sigungu: z.string().trim().max(30).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
});

export type RefereeCreateInput = z.infer<typeof refereeCreateSchema>;

// 본인 Referee 수정 (모든 필드 optional)
export const refereeUpdateSchema = z.object({
  association_id: associationIdSchema.optional().nullable(),
  license_number: z.string().trim().max(50).optional().nullable(),
  level: refereeLevelEnum.optional().nullable(),
  role_type: refereeRoleEnum.optional(),
  region_sido: z.string().trim().max(20).optional().nullable(),
  region_sigungu: z.string().trim().max(30).optional().nullable(),
  status: refereeStatusEnum.optional(),
  bio: z.string().trim().max(500).optional().nullable(),
});

export type RefereeUpdateInput = z.infer<typeof refereeUpdateSchema>;

// ─────────────────────────────────────────────────────────────
// RefereeCertificate (본인 자격증)
// ─────────────────────────────────────────────────────────────

// ISO date(YYYY-MM-DD 또는 전체 ISO) 허용
const isoDateSchema = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "유효하지 않은 값입니다.",
  });

// 자격증 생성
// 주의: verified / verified_at / verified_by_admin_id는 스키마에 없음 — 관리자 전용 필드
export const refereeCertificateCreateSchema = z.object({
  cert_type: refereeRoleEnum,
  cert_grade: z.string().trim().min(1).max(20),
  issuer: z.string().trim().min(1).max(100),
  cert_number: z.string().trim().max(50).optional().nullable(),
  issued_at: isoDateSchema,
  expires_at: isoDateSchema.optional().nullable(),
});

export type RefereeCertificateCreateInput = z.infer<
  typeof refereeCertificateCreateSchema
>;

// 자격증 수정 (모든 필드 optional, verified 계열은 역시 제외)
export const refereeCertificateUpdateSchema = z.object({
  cert_type: refereeRoleEnum.optional(),
  cert_grade: z.string().trim().min(1).max(20).optional(),
  issuer: z.string().trim().min(1).max(100).optional(),
  cert_number: z.string().trim().max(50).optional().nullable(),
  issued_at: isoDateSchema.optional(),
  expires_at: isoDateSchema.optional().nullable(),
});

export type RefereeCertificateUpdateInput = z.infer<
  typeof refereeCertificateUpdateSchema
>;
