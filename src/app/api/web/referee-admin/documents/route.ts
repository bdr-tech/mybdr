import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  optimizeDocumentImage,
  validateImageFile,
} from "@/lib/services/image-processor";
import { encryptDocument } from "@/lib/security/document-encryption";

/**
 * /api/web/referee-admin/documents
 *
 * 관리자용 서류 관리 API.
 *
 * GET  — 특정 심판의 서류 목록 (메타데이터만, encrypted_data 제외)
 * POST — 관리자 대리 업로드
 *
 * 보안:
 *   - getAssociationAdmin() + requirePermission('document_manage')
 *   - IDOR 방지: referee.association_id = admin.associationId
 *   - encrypted_data는 API 응답에 절대 포함하지 않음
 */

export const dynamic = "force-dynamic";

// ── 허용 서류 타입 ──
const VALID_DOC_TYPES = ["certificate", "id_card", "bankbook"] as const;

/**
 * GET — 특정 심판의 서류 목록 조회.
 *
 * query: ?referee_id=xxx
 */
export async function GET(request: NextRequest) {
  // 1) 관리자 인증
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  // document_manage 권한 체크
  const denied = requirePermission(admin.role, "document_manage");
  if (denied) return denied;

  // 2) referee_id 파라미터 추출
  const { searchParams } = new URL(request.url);
  const refereeIdStr = searchParams.get("referee_id");
  if (!refereeIdStr || !/^\d+$/.test(refereeIdStr)) {
    return apiError("유효하지 않은 referee_id입니다.", 400, "BAD_REQUEST");
  }
  const refereeId = BigInt(refereeIdStr);

  // 3) IDOR 방지: 해당 심판이 관리자의 협회 소속인지 확인
  const referee = await prisma.referee.findUnique({
    where: { id: refereeId },
    select: { association_id: true },
  });
  if (!referee || referee.association_id !== admin.associationId) {
    return apiError("해당 심판을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }

  // 4) 서류 목록 조회 — encrypted_data 제외
  const documents = await prisma.refereeDocument.findMany({
    where: { referee_id: refereeId },
    select: {
      id: true,
      doc_type: true,
      file_size: true,
      file_type: true,
      ocr_status: true,
      uploaded_by: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  const result = documents.map((d) => ({
    ...d,
    id: String(d.id),
    uploaded_by: String(d.uploaded_by),
  }));

  return apiSuccess(result);
}

/**
 * POST — 관리자 대리 업로드.
 *
 * body (multipart/form-data): file + doc_type + referee_id
 */
export async function POST(request: NextRequest) {
  // 1) 관리자 인증 + 권한 체크
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  const denied = requirePermission(admin.role, "document_manage");
  if (denied) return denied;

  // 2) FormData 파싱
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  const file = formData.get("file") as File | null;
  const docType = formData.get("doc_type") as string | null;
  const refereeIdStr = formData.get("referee_id") as string | null;

  // 필수값 검증
  if (!file || !docType || !refereeIdStr) {
    return apiError(
      "file, doc_type, referee_id는 필수입니다.",
      400,
      "BAD_REQUEST"
    );
  }

  // doc_type 유효성
  if (!VALID_DOC_TYPES.includes(docType as typeof VALID_DOC_TYPES[number])) {
    return apiError(
      `유효하지 않은 서류 유형입니다. (허용: ${VALID_DOC_TYPES.join(", ")})`,
      400,
      "BAD_REQUEST"
    );
  }

  // referee_id 유효성
  if (!/^\d+$/.test(refereeIdStr)) {
    return apiError("유효하지 않은 referee_id입니다.", 400, "BAD_REQUEST");
  }
  const refereeId = BigInt(refereeIdStr);

  // 3) IDOR 방지: 해당 심판이 관리자의 협회 소속인지 확인
  const referee = await prisma.referee.findUnique({
    where: { id: refereeId },
    select: { association_id: true },
  });
  if (!referee || referee.association_id !== admin.associationId) {
    return apiError("해당 심판을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }

  // 4) 파일 → Buffer 변환
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type;

  // 5) 파일 검증
  const validation = validateImageFile(buffer, mimeType);
  if (!validation.valid) {
    return apiError(validation.error!, 400, "INVALID_FILE");
  }

  // 6) 이미지 최적화
  const optimized = await optimizeDocumentImage(buffer, mimeType);

  // 7) 암호화
  const encryptedData = encryptDocument(optimized);

  // 8) DB 저장 (upsert)
  const document = await prisma.refereeDocument.upsert({
    where: {
      referee_id_doc_type: {
        referee_id: refereeId,
        doc_type: docType,
      },
    },
    create: {
      referee_id: refereeId,
      doc_type: docType,
      encrypted_data: encryptedData,
      file_size: buffer.length,
      file_type: mimeType,
      ocr_status: "pending",
      uploaded_by: admin.userId,
    },
    update: {
      encrypted_data: encryptedData,
      file_size: buffer.length,
      file_type: mimeType,
      ocr_status: "pending",
      ocr_result: Prisma.DbNull,
      uploaded_by: admin.userId,
    },
    select: {
      id: true,
      doc_type: true,
      file_size: true,
      file_type: true,
      ocr_status: true,
      created_at: true,
      updated_at: true,
    },
  });

  return apiSuccess(
    { ...document, id: String(document.id) },
    201
  );
}
