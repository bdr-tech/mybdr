import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { decryptDocument } from "@/lib/security/document-encryption";
import { processDocumentOCR } from "@/lib/services/ocr-extractor";

/**
 * /api/web/referee-documents/[id]/ocr
 *
 * POST — 본인 서류에 OCR 실행.
 *
 * 처리 흐름:
 *   1) 세션 확인 + 본인 서류인지 IDOR 방지
 *   2) encrypted_data 복호화 (서버 내부에서만)
 *   3) processDocumentOCR() 호출
 *   4) DB 업데이트: ocr_status = "completed" 또는 "skipped", ocr_result 저장
 *   5) 응답: 추출 결과만 반환 (encrypted_data 절대 노출 안 함)
 *
 * 보안:
 *   - encrypted_data는 API 응답에 절대 포함하지 않음
 *   - 복호화된 이미지는 메모리에서만 사용 후 즉시 폐기
 *   - id_card는 OCR 건너뜀 (ocr_status = "skipped")
 */

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
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

  // 3) 서류 조회 (encrypted_data 포함 — 서버 내부 복호화용)
  const document = await prisma.refereeDocument.findUnique({
    where: { id: docId },
    select: {
      id: true,
      doc_type: true,
      file_type: true,
      encrypted_data: true,
      referee: { select: { user_id: true } },
    },
  });

  if (!document) {
    return apiError("서류를 찾을 수 없습니다.", 404, "NOT_FOUND");
  }

  // 본인 서류만 OCR 가능 (IDOR 방지)
  if (document.referee.user_id !== userId) {
    return apiError("본인의 서류만 OCR 처리할 수 있습니다.", 403, "FORBIDDEN");
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
      message: "신분증은 보안상 OCR을 사용하지 않습니다. 직접 입력해주세요.",
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

    // OCR 텍스트가 비어있으면 failed (환경변수 없거나 API 실패)
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
    console.error("[OCR] 처리 중 에러:", error);

    // OCR 실패해도 전체 흐름은 막지 않음
    await prisma.refereeDocument.update({
      where: { id: docId },
      data: { ocr_status: "failed" },
    });

    return apiSuccess({
      ocr_status: "failed",
      extracted: {},
      message: "자동 추출에 실패했습니다. 직접 입력해주세요.",
    });
  }
}
