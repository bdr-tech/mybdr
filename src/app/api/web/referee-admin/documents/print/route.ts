import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { generateSettlementPDF } from "@/lib/services/settlement-pdf";

/**
 * POST /api/web/referee-admin/documents/print
 *
 * 정산 서류 PDF 생성 API (사무국장 전용).
 *
 * 이유: 사무국장이 심판의 서류 3종(자격증/신분증/통장)을 한꺼번에
 *       워터마크 + 추적코드가 포함된 PDF로 다운로드하는 유일한 경로.
 *       encrypted_data를 복호화하여 PDF에 삽입하므로, 사무국장 외 접근 절대 불가.
 *
 * 보안:
 *   - requirePermission('document_print') — secretary_general만 허용
 *   - IDOR 방지: referee.association_id === admin.associationId
 *   - PDF는 서버에 저장하지 않음 (일회성 생성, 스트리밍 응답)
 *   - 접근 로그 기록 (console.log — 추후 DB 로그 테이블)
 */

export const dynamic = "force-dynamic";

// 필수 서류 3종
const REQUIRED_DOC_TYPES = ["certificate", "id_card", "bankbook"] as const;

export async function POST(request: NextRequest) {
  // 1) 관리자 인증 — 로그인 + 협회 관리자 여부
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  // 2) 사무국장 권한 체크 — document_print은 secretary_general만
  const denied = requirePermission(admin.role, "document_print");
  if (denied) return denied;

  // 3) 요청 body 파싱
  let body: { referee_id?: number | string };
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  const refereeIdStr = String(body.referee_id ?? "");
  if (!refereeIdStr || !/^\d+$/.test(refereeIdStr)) {
    return apiError("유효하지 않은 referee_id입니다.", 400, "BAD_REQUEST");
  }
  const refereeId = BigInt(refereeIdStr);

  // 4) IDOR 방지: 해당 심판이 관리자의 협회 소속인지 확인
  const referee = await prisma.referee.findUnique({
    where: { id: refereeId },
    select: {
      id: true,
      association_id: true,
      verified_name: true,
      license_number: true,
      level: true,
      bank_name: true,
      bank_holder: true,
      // 소속 협회 정보
      association: {
        select: { name: true },
      },
    },
  });

  if (!referee || referee.association_id !== admin.associationId) {
    return apiError("해당 심판을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }

  // 5) 서류 3종 조회 (encrypted_data 포함 — 서버 내부에서만 사용)
  const documents = await prisma.refereeDocument.findMany({
    where: { referee_id: refereeId },
    select: {
      doc_type: true,
      encrypted_data: true,
      file_type: true,
    },
  });

  // 6) 3종 모두 등록되어 있는지 확인
  const registeredTypes = new Set(documents.map((d) => d.doc_type));
  const missingTypes = REQUIRED_DOC_TYPES.filter(
    (t) => !registeredTypes.has(t)
  );

  if (missingTypes.length > 0) {
    return apiError(
      `서류가 모두 등록되어야 출력할 수 있습니다. 미등록: ${missingTypes.join(", ")}`,
      400,
      "DOCUMENTS_INCOMPLETE"
    );
  }

  // 7) 출력자(관리자) 정보 조회
  const adminUser = await prisma.user.findUnique({
    where: { id: admin.userId },
    select: { name: true },
  });

  // 8) 접근 로그 기록 (console.log — 추후 DB audit_log 테이블로 전환)
  console.log(
    `[PDF PRINT] admin_id=${String(admin.userId)} ` +
      `referee_id=${String(refereeId)} ` +
      `association_id=${String(admin.associationId)} ` +
      `timestamp=${new Date().toISOString()}`
  );

  // 9) PDF 생성
  try {
    const pdfBuffer = await generateSettlementPDF({
      referee: {
        id: referee.id,
        verified_name: referee.verified_name,
        license_number: referee.license_number,
        level: referee.level,
        bank_name: referee.bank_name,
        bank_holder: referee.bank_holder,
      },
      documents,
      association: {
        name: referee.association?.name ?? "Unknown",
      },
      printedBy: {
        id: admin.userId,
        name: adminUser?.name,
      },
    });

    // 10) PDF를 다운로드 응답으로 반환
    const today = new Date().toISOString().slice(0, 10);
    const filename = `settlement-${String(refereeId)}-${today}.pdf`;

    // Buffer → Uint8Array 변환 (Response 생성자 호환)
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // 캐시 금지 — 민감 문서
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    console.error("[PDF PRINT ERROR]", err);
    return apiError("PDF 생성에 실패했습니다.", 500, "PDF_GENERATION_FAILED");
  }
}
