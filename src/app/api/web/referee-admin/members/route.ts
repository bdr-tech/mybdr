import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { encryptResidentId, extractLast4 } from "@/lib/security/encryption";
import { findMatchingUser, executeMatch } from "@/lib/services/referee-matching";
// 헬스체크 봇의 쓰기 작업 차단 가드
import { requireNotBot } from "@/lib/healthcheck/is-bot";

/**
 * POST /api/web/referee-admin/members
 *
 * 심판 사전 등록 API.
 * 협회 관리자가 이름+전화번호로 심판을 미리 등록해 놓으면,
 * 해당 유저가 나중에 가입/로그인할 때 자동으로 매칭된다.
 *
 * 보안:
 *   - getAssociationAdmin() → 세션 기반 관리자 인증
 *   - requirePermission("referee_manage") → 심판 관리 권한 체크
 *   - association_id는 세션에서 강제 주입 (IDOR 방지)
 */

export const dynamic = "force-dynamic";

// ── Zod 스키마: 사전 등록 입력값 검증 ──
const preRegisterSchema = z.object({
  // 필수: 이름 (매칭 키)
  registered_name: z
    .string()
    .trim()
    .min(1, "이름은 필수입니다.")
    .max(50),
  // 필수: 전화번호 (매칭 키)
  registered_phone: z
    .string()
    .trim()
    .min(1, "전화번호는 필수입니다.")
    .max(20),
  // 선택: 생년월일
  registered_birth_date: z
    .string()
    .trim()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: "유효하지 않은 날짜입니다.",
    })
    .optional()
    .nullable(),
  // 선택: 등급
  level: z
    .enum(["beginner", "intermediate", "advanced", "international"])
    .optional()
    .nullable(),
  // 선택: 역할 (기본 referee)
  role_type: z.enum(["referee", "scorer", "timer"]).optional(),
  // 선택: 자격번호
  license_number: z.string().trim().max(50).optional().nullable(),
  // 선택: 주민등록번호 (정산용, "000000-0000000" 형식)
  resident_id: z
    .string()
    .trim()
    .optional()
    .nullable(),
  // 선택: 지역
  region_sido: z.string().trim().max(20).optional().nullable(),
  region_sigungu: z.string().trim().max(30).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    // 1) 관리자 인증
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) 심판 관리 권한 체크
    const denied = requirePermission(admin.role, "referee_manage");
    if (denied) return denied;

    // 2-1) 봇 방어 — 헬스체크 봇 계정은 쓰기 차단
    const botCheck = await requireNotBot(admin.userId);
    if (botCheck) return botCheck.error;

    // 3) 요청 본문 파싱 + 검증
    const body = await req.json();
    const parsed = preRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    const input = parsed.data;

    // 4) 중복 체크: 같은 협회에 같은 이름+전화번호로 이미 등록된 심판이 있는지
    //    전화번호는 숫자만 추출해서 비교 (하이픈/공백 무시)
    const normalizedPhone = input.registered_phone.replace(/\D/g, "");
    const existing = await prisma.referee.findFirst({
      where: {
        association_id: admin.associationId,
        registered_name: input.registered_name,
        registered_phone: { not: null },
      },
      select: { id: true, registered_phone: true },
    });

    // 전화번호 숫자만 비교해서 중복 판정
    if (
      existing &&
      existing.registered_phone &&
      existing.registered_phone.replace(/\D/g, "") === normalizedPhone
    ) {
      return apiError(
        "같은 이름과 전화번호로 이미 등록된 심판이 있습니다.",
        409,
        "DUPLICATE"
      );
    }

    // 5) 주민번호가 있으면 암호화 처리 (평문 저장 절대 금지)
    let residentIdEnc: string | null = null;
    let residentIdLast4: string | null = null;
    if (input.resident_id) {
      residentIdEnc = encryptResidentId(input.resident_id);
      residentIdLast4 = extractLast4(input.resident_id);
    }

    // 6) 심판 레코드 생성 (user_id = null, match_status = "unmatched")
    const referee = await prisma.referee.create({
      data: {
        // user_id는 null — 사전 등록이므로 아직 매칭 전
        association_id: admin.associationId,
        registered_name: input.registered_name,
        registered_phone: input.registered_phone,
        registered_birth_date: input.registered_birth_date
          ? new Date(input.registered_birth_date)
          : null,
        // 주민번호: 암호화된 값만 저장 (평문은 메모리에서 즉시 소멸)
        resident_id_enc: residentIdEnc,
        resident_id_last4: residentIdLast4,
        level: input.level ?? null,
        role_type: input.role_type ?? "referee",
        license_number: input.license_number ?? null,
        region_sido: input.region_sido ?? null,
        region_sigungu: input.region_sigungu ?? null,
        match_status: "unmatched",
        // 누가 등록했는지 기록
        registered_by_admin_id: admin.userId,
        status: "active",
      },
    });

    // 7) 자동 매칭 시도: 이름+전화번호로 기존 유저 탐색
    let matchResult: "matched" | "unmatched" | "candidates" = "unmatched";
    let matchedUserId: bigint | null = null;

    const matchedUser = await findMatchingUser(
      input.registered_name,
      input.registered_phone
    );

    if (matchedUser) {
      try {
        // 1명 매칭 → 즉시 연결
        await executeMatch(referee.id, matchedUser.id);
        matchResult = "matched";
        matchedUserId = matchedUser.id;
      } catch {
        // 매칭 실행 실패 (이미 다른 심판에 연결 등) — 등록은 성공, 매칭만 실패
        matchResult = "unmatched";
      }
    }

    return apiSuccess(
      {
        id: referee.id,
        registered_name: referee.registered_name,
        registered_phone: referee.registered_phone,
        match_status: matchResult,
        matched_user_id: matchedUserId,
        message:
          matchResult === "matched"
            ? "심판이 등록되었고, 기존 유저와 자동 매칭되었습니다."
            : "심판이 사전 등록되었습니다. (매칭 대기 중)",
      },
      201
    );
  } catch {
    return apiError("심판 사전 등록에 실패했습니다.", 500);
  }
}
