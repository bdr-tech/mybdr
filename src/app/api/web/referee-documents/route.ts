import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import {
  optimizeDocumentImage,
  validateImageFile,
} from "@/lib/services/image-processor";
import { encryptDocument } from "@/lib/security/document-encryption";

/**
 * /api/web/referee-documents
 *
 * 본인용 서류 관리 API.
 *
 * GET  — 내 서류 목록 조회 (encrypted_data 제외)
 * POST — 서류 업로드 (multipart/form-data)
 *
 * 보안:
 *   - getWebSession()으로 로그인 확인
 *   - Referee.user_id = 세션 userId로 본인 확인
 *   - encrypted_data는 API 응답에 절대 포함하지 않음
 */

export const dynamic = "force-dynamic";

// Next.js App Router: body size 제한 해제 (대용량 이미지 업로드)
export const runtime = "nodejs";

// ── 허용 서류 타입 ──
const VALID_DOC_TYPES = ["certificate", "id_card", "bankbook"] as const;

/**
 * GET — 내 서류 목록 조회.
 *
 * encrypted_data를 select에서 제외하여 응답 크기를 줄이고 보안을 유지한다.
 */
export async function GET() {
  // 1) 세션 확인
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");

  const userId = BigInt(session.sub);

  // 2) 본인 Referee 조회
  const referee = await prisma.referee.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  if (!referee) return apiError("심판 프로필이 없습니다.", 404, "NOT_FOUND");

  // 3) 서류 목록 조회 — encrypted_data 제외!
  const documents = await prisma.refereeDocument.findMany({
    where: { referee_id: referee.id },
    select: {
      id: true,
      doc_type: true,
      file_size: true,
      file_type: true,
      ocr_status: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  // BigInt → string 변환 (JSON 직렬화 호환)
  const result = documents.map((d) => ({
    ...d,
    id: String(d.id),
  }));

  return apiSuccess(result);
}

/**
 * POST — 서류 업로드.
 *
 * 처리 흐름:
 *   1) FormData에서 file + doc_type 추출
 *   2) validateImageFile()로 파일 검증 (MIME + 크기 + 매직 바이트)
 *   3) optimizeDocumentImage()로 이미지 최적화 (리사이즈 + 그레이스케일 + JPEG)
 *   4) encryptDocument()로 AES-256-GCM 암호화
 *   5) RefereeDocument upsert (같은 doc_type이면 교체)
 */
export async function POST(request: NextRequest) {
  // 1) 세션 확인
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");

  const userId = BigInt(session.sub);

  // 2) 본인 Referee 조회
  const referee = await prisma.referee.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  if (!referee) return apiError("심판 프로필이 없습니다.", 404, "NOT_FOUND");

  // 3) FormData 파싱
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  const file = formData.get("file") as File | null;
  const docType = formData.get("doc_type") as string | null;

  // 필수값 검증
  if (!file || !docType) {
    return apiError("file과 doc_type은 필수입니다.", 400, "BAD_REQUEST");
  }

  // doc_type 유효성
  if (!VALID_DOC_TYPES.includes(docType as typeof VALID_DOC_TYPES[number])) {
    return apiError(
      `유효하지 않은 서류 유형입니다. (허용: ${VALID_DOC_TYPES.join(", ")})`,
      400,
      "BAD_REQUEST"
    );
  }

  // 4) 파일 → Buffer 변환
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type;

  // 5) 파일 검증 (MIME + 크기 + 매직 바이트)
  const validation = validateImageFile(buffer, mimeType);
  if (!validation.valid) {
    return apiError(validation.error!, 400, "INVALID_FILE");
  }

  // 6) 이미지 최적화 (리사이즈 + 그레이스케일 + JPEG 70%)
  const optimized = await optimizeDocumentImage(buffer, mimeType);

  // 7) AES-256-GCM 암호화
  const encryptedData = encryptDocument(optimized);

  // 8) DB 저장 (upsert — 같은 doc_type이면 교체)
  const document = await prisma.refereeDocument.upsert({
    where: {
      referee_id_doc_type: {
        referee_id: referee.id,
        doc_type: docType,
      },
    },
    create: {
      referee_id: referee.id,
      doc_type: docType,
      encrypted_data: encryptedData,
      file_size: buffer.length, // 원본 크기 저장 (최적화 전)
      file_type: mimeType,
      ocr_status: "pending",
      uploaded_by: userId,
    },
    update: {
      encrypted_data: encryptedData,
      file_size: buffer.length,
      file_type: mimeType,
      ocr_status: "pending",
      ocr_result: Prisma.DbNull, // 교체 시 OCR 결과 초기화
      uploaded_by: userId,
    },
    // encrypted_data 제외한 메타데이터만 반환
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
