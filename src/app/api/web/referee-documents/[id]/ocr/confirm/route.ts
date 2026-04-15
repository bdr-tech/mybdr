import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { encryptResidentId } from "@/lib/security/encryption";

/**
 * /api/web/referee-documents/[id]/ocr/confirm
 *
 * POST — OCR 결과 확정 (편집 후 저장).
 *
 * 서류 유형에 따라 다른 테이블에 저장:
 *   - certificate → RefereeCertificate upsert
 *   - bankbook → Referee의 bank_name/bank_account(암호화)/bank_holder 업데이트
 *   - id_card → Referee의 verified_name 업데이트 (수동 입력)
 *
 * 보안:
 *   - 본인 서류만 확정 가능 (IDOR 방지)
 *   - bank_account는 encryptResidentId 패턴으로 암호화 저장
 */

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1) 세션 확인
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");

  const userId = BigInt(session.sub);

  // 2) id 파라미터 검증
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 서류 ID입니다.", 400, "BAD_REQUEST");
  }
  const docId = BigInt(id);

  // 3) 서류 조회 — doc_type + referee 정보
  const document = await prisma.refereeDocument.findUnique({
    where: { id: docId },
    select: {
      id: true,
      doc_type: true,
      referee_id: true,
      referee: { select: { user_id: true, id: true } },
    },
  });

  if (!document) {
    return apiError("서류를 찾을 수 없습니다.", 404, "NOT_FOUND");
  }

  // 본인 서류만 확정 가능
  if (document.referee.user_id !== userId) {
    return apiError(
      "본인의 서류만 확정할 수 있습니다.",
      403,
      "FORBIDDEN"
    );
  }

  // 4) body 파싱
  let body: Record<string, string | undefined>;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  const docType = document.doc_type;
  const refereeId = document.referee_id;

  try {
    // 5) 서류 유형에 따라 다른 테이블에 저장
    if (docType === "certificate") {
      await saveCertificateData(refereeId, body);
    } else if (docType === "bankbook") {
      await saveBankbookData(refereeId, body);
    } else if (docType === "id_card") {
      await saveIdCardData(refereeId, body);
    }

    return apiSuccess({ confirmed: true, doc_type: docType });
  } catch (error) {
    console.error("[OCR 확정] 저장 중 에러:", error);
    return apiError("저장에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── 서류별 저장 함수 ──

/**
 * 자격증 데이터 → RefereeCertificate upsert.
 *
 * 같은 referee에 자격증이 이미 있으면 업데이트, 없으면 생성.
 * cert_type/cert_grade는 필수 (없으면 기본값 사용).
 */
async function saveCertificateData(
  refereeId: bigint,
  data: Record<string, string | undefined>
) {
  const certType = data.cert_type || "referee";
  const certGrade = data.cert_grade || "";
  const issuer = data.issuer || "";
  const certNumber = data.cert_number || null;

  // issued_date 파싱 — "YYYY-MM-DD" 형식이면 Date로 변환
  let issuedAt: Date | null = null;
  if (data.issued_date) {
    const parsed = new Date(data.issued_date);
    if (!isNaN(parsed.getTime())) {
      issuedAt = parsed;
    }
  }

  // 기존 자격증 있는지 확인 (같은 referee_id + cert_type)
  const existing = await prisma.refereeCertificate.findFirst({
    where: { referee_id: refereeId, cert_type: certType },
    select: { id: true },
  });

  if (existing) {
    // 기존 자격증 업데이트
    await prisma.refereeCertificate.update({
      where: { id: existing.id },
      data: {
        cert_grade: certGrade,
        issuer,
        cert_number: certNumber,
        ...(issuedAt && { issued_at: issuedAt }),
      },
    });
  } else {
    // 새 자격증 생성 — issued_at 필수이므로 기본값 설정
    await prisma.refereeCertificate.create({
      data: {
        referee_id: refereeId,
        cert_type: certType,
        cert_grade: certGrade,
        issuer,
        cert_number: certNumber,
        issued_at: issuedAt || new Date(),
      },
    });
  }
}

/**
 * 통장 데이터 → Referee의 bank_name/bank_account/bank_holder 업데이트.
 *
 * bank_account는 암호화 저장 (encryptResidentId 패턴 재사용).
 */
async function saveBankbookData(
  refereeId: bigint,
  data: Record<string, string | undefined>
) {
  const updateData: Record<string, string | null> = {};

  if (data.bank_name) {
    updateData.bank_name = data.bank_name;
  }
  if (data.account_holder) {
    updateData.bank_holder = data.account_holder;
  }
  if (data.account_number) {
    // 계좌번호는 암호화 저장
    try {
      updateData.bank_account = encryptResidentId(data.account_number);
    } catch {
      // 암호화 키 미설정 시 평문 저장 안 함 (보안 원칙)
      console.error(
        "[OCR 확정] 계좌번호 암호화 실패 — RESIDENT_ID_ENCRYPTION_KEY 확인 필요"
      );
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.referee.update({
      where: { id: refereeId },
      data: updateData,
    });
  }
}

/**
 * 신분증 데이터 → Referee의 verified_name 업데이트 (수동 입력).
 */
async function saveIdCardData(
  refereeId: bigint,
  data: Record<string, string | undefined>
) {
  const updateData: Record<string, string | null> = {};

  if (data.name) {
    updateData.verified_name = data.name;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.referee.update({
      where: { id: refereeId },
      data: updateData,
    });
  }
}
