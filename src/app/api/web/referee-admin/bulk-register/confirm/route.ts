import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  hasPermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { encryptResidentId, extractLast4 } from "@/lib/security/encryption";
import { executeMatch } from "@/lib/services/referee-matching";

/**
 * /api/web/referee-admin/bulk-register/confirm
 *
 * Excel 일괄 사전 등록 확정.
 *
 * 이유:
 *   - preview에서 계산한 결과를 바탕으로 "매칭/미매칭" 행만 실제 등록
 *   - duplicated/invalid 행은 여기서 스킵 (중복 방지 + 입력 오류 방어)
 *
 * 로직:
 *   1) 권한 체크 (referee_manage 또는 game_manage)
 *   2) body.rows 재검증 (프론트 변조 방어 → 서버에서 다시 매칭/중복 판정은 간소화)
 *   3) $transaction으로 Referee 일괄 생성
 *   4) 생성 후 matched인 행은 executeMatch()로 유저 연결 (트랜잭션 밖 — 각 매칭 실패가 전체 실패로 번지지 않도록)
 *
 * body 스키마:
 *   {
 *     rows: [
 *       {
 *         row_number, name, phone, birth_date?, license_number?,
 *         level?, role_type, match_status, match_user_id?, resident_id?
 *       }
 *     ]
 *   }
 */

export const dynamic = "force-dynamic";

// 행 데이터 Zod 스키마 — preview 응답 구조를 그대로 받음
const rowSchema = z.object({
  row_number: z.number().int(),
  name: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(1).max(20),
  birth_date: z.string().trim().nullable().optional(),
  license_number: z.string().trim().max(50).nullable().optional(),
  level: z
    .enum(["beginner", "intermediate", "advanced", "international"])
    .nullable()
    .optional(),
  role_type: z.enum(["referee", "scorer", "timer"]),
  match_status: z.enum(["matched", "unmatched", "duplicated", "invalid"]),
  match_user_id: z.string().nullable().optional(),
  resident_id: z.string().trim().nullable().optional(),
});

const confirmSchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    // 1) 관리자 인증
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) 권한: referee_manage 또는 game_manage
    if (
      !hasPermission(admin.role, "referee_manage") &&
      !hasPermission(admin.role, "game_manage")
    ) {
      return apiError("이 기능에 대한 접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 3) body 검증
    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    const { rows } = parsed.data;

    // 4) 등록 대상 선별: matched/unmatched만 처리, 나머지 스킵
    const targetRows = rows.filter(
      (r) => r.match_status === "matched" || r.match_status === "unmatched"
    );
    const skippedDuplicated = rows.filter(
      (r) => r.match_status === "duplicated"
    ).length;
    const skippedInvalid = rows.filter(
      (r) => r.match_status === "invalid"
    ).length;

    if (targetRows.length === 0) {
      return apiSuccess({
        created: 0,
        matched: 0,
        unmatched: 0,
        skipped: {
          duplicated: skippedDuplicated,
          invalid: skippedInvalid,
        },
      });
    }

    // 5) 서버 측 중복 재검증 (TOCTOU 방지)
    //    preview 이후 confirm 사이에 같은 이름+전화번호로 등록된 레코드가 생길 수 있음
    const names = Array.from(new Set(targetRows.map((r) => r.name)));
    const existingReferees = await prisma.referee.findMany({
      where: {
        association_id: admin.associationId,
        registered_name: { in: names },
        registered_phone: { not: null },
      },
      select: { registered_name: true, registered_phone: true },
    });

    const dupKeySet = new Set<string>();
    for (const r of existingReferees) {
      if (!r.registered_phone) continue;
      dupKeySet.add(`${r.registered_name}|${normalizePhone(r.registered_phone)}`);
    }

    // 6) Referee 일괄 생성 (트랜잭션)
    //    - user_id는 여기서 설정하지 않음 (매칭 실행은 트랜잭션 밖)
    //    - association_id는 세션에서 강제
    const createdIds: Array<{
      refereeId: bigint;
      matchUserId: string | null;
    }> = [];
    let skippedDupInTx = 0;

    await prisma.$transaction(async (tx) => {
      for (const r of targetRows) {
        const phoneNorm = normalizePhone(r.phone);
        const key = `${r.name}|${phoneNorm}`;

        // 트랜잭션 내에서 한 번 더 중복 확인 (외부에서 먼저 조회한 뒤 같은 트랜잭션 내 신규 생성이 있을 수 있음)
        if (dupKeySet.has(key)) {
          skippedDupInTx++;
          continue;
        }

        // 주민번호 암호화 (평문 저장 금지)
        let residentIdEnc: string | null = null;
        let residentIdLast4: string | null = null;
        if (r.resident_id) {
          try {
            residentIdEnc = encryptResidentId(r.resident_id);
            residentIdLast4 = extractLast4(r.resident_id);
          } catch {
            // 암호화 실패 시 주민번호 없이 등록 (관리자에게 invalid로 알렸어야 하므로 여기선 fallback)
            residentIdEnc = null;
            residentIdLast4 = null;
          }
        }

        const created = await tx.referee.create({
          data: {
            // user_id는 null — 등록 후 executeMatch가 채움
            association_id: admin.associationId,
            registered_name: r.name,
            registered_phone: r.phone,
            registered_birth_date: r.birth_date
              ? new Date(r.birth_date)
              : null,
            resident_id_enc: residentIdEnc,
            resident_id_last4: residentIdLast4,
            level: r.level ?? null,
            role_type: r.role_type,
            license_number: r.license_number ?? null,
            match_status: "unmatched",
            registered_by_admin_id: admin.userId,
            status: "active",
          },
          select: { id: true },
        });

        // 트랜잭션 내 이후 중복 차단
        dupKeySet.add(key);

        createdIds.push({
          refereeId: created.id,
          matchUserId: r.match_status === "matched" ? r.match_user_id ?? null : null,
        });
      }
    });

    // 7) 매칭 실행 (트랜잭션 밖 — 개별 실패가 전체 롤백으로 번지지 않게)
    let matchedCount = 0;
    const matchErrors: Array<{ referee_id: string; reason: string }> = [];

    for (const { refereeId, matchUserId } of createdIds) {
      if (!matchUserId) continue;
      try {
        await executeMatch(refereeId, BigInt(matchUserId));
        matchedCount++;
      } catch (e) {
        // 매칭 실패 — 해당 Referee는 unmatched 상태로 남음 (등록 자체는 성공)
        matchErrors.push({
          referee_id: refereeId.toString(),
          reason: e instanceof Error ? e.message : "매칭 실패",
        });
      }
    }

    const totalCreated = createdIds.length;
    const unmatchedCount = totalCreated - matchedCount;

    return apiSuccess(
      {
        created: totalCreated,
        matched: matchedCount,
        unmatched: unmatchedCount,
        skipped: {
          duplicated: skippedDuplicated + skippedDupInTx,
          invalid: skippedInvalid,
        },
        match_errors: matchErrors,
      },
      201
    );
  } catch {
    return apiError("일괄 등록 처리 중 오류가 발생했습니다.", 500);
  }
}
