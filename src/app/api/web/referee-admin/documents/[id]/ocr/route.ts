import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { decryptDocument } from "@/lib/security/document-encryption";
import { processDocumentOCR } from "@/lib/services/ocr-extractor";

/**
 * /api/web/referee-admin/documents/[id]/ocr
 *
 * POST — 관리자용 OCR 실행.
 *
 * 본인용 OCR API와 동일한 로직이지만, 권한 체크가 다르다:
 *   - getAssociationAdmin() + document_manage 권한
 *   - IDOR: 서류의 referee.association_id === admin.associationId
 */

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1) 관리자 인증 + 권한 체크
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  const denied = requirePermission(admin.role, "document_manage");
  if (denied) return denied;

  // 2) id 파라미터 검증
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 서류 ID입니다.", 400, "BAD_REQUEST");
  }
  const docId = BigInt(id);

  // 3) 서류 조회 (encrypted_data 포함)
  const document = await prisma.refereeDocument.findUnique({
    where: { id: docId },
    select: {
      id: true,
      doc_type: true,
      file_type: true,
      encrypted_data: true,
      referee: { select: { association_id: true } },
    },
  });

  if (!document) {
    return apiError("서류를 찾을 수 없습니다.", 404, "NOT_FOUND");
  }

  // IDOR 방지: 관리자의 협회 소속 심판인지 확인
  if (document.referee.association_id !== admin.associationId) {
    return apiError("해당 심판의 서류에 접근할 수 없습니다.", 403, "FORBIDDEN");
  }

  const docType = document.doc_type as "certificate" | "id_card" | "bankbook";

  // 4) 신분증은 OCR 건너뜀
  if (docType === "id_card") {
    await prisma.refereeDocument.update({
      where: { id: docId },
      data: { ocr_status: "skipped" },
    });
    return apiSuccess({
      ocr_status: "skipped",
      extracted: {},
      message: "신분증은 보안상 OCR을 사용하지 않습니다.",
    });
  }

  // 5) 복호화 + OCR 처리
  try {
    const imageBuffer = decryptDocument(document.encrypted_data);
    const ocrResult = await processDocumentOCR(
      imageBuffer,
      document.file_type,
      docType
    );

    const ocrStatus = ocrResult.raw_texts.length > 0 ? "completed" : "failed";

    // 6) DB 업데이트
    await prisma.refereeDocument.update({
      where: { id: docId },
      data: {
        ocr_status: ocrStatus,
        ocr_result: ocrResult as unknown as Prisma.InputJsonValue,
      },
    });

    return apiSuccess({
      ocr_status: ocrStatus,
      extracted: ocrResult.extracted,
      raw_text_count: ocrResult.raw_texts.length,
    });
  } catch (error) {
    console.error("[OCR 관리자] 처리 중 에러:", error);

    await prisma.refereeDocument.update({
      where: { id: docId },
      data: { ocr_status: "failed" },
    });

    return apiSuccess({
      ocr_status: "failed",
      extracted: {},
      message: "자동 추출에 실패했습니다.",
    });
  }
}
