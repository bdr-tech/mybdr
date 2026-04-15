import sharp from "sharp";

/**
 * 정산 서류 이미지 최적화 + 검증 유틸.
 *
 * 이유: 원본 이미지를 그대로 암호화하면 DB 용량이 폭증한다.
 *       1500px 이내 리사이즈 + 그레이스케일 + JPEG 70% 압축으로
 *       평균 80~90% 용량을 절감하면서 OCR/열람에 충분한 품질을 유지한다.
 */

// ── 허용 MIME 타입 ──
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

// ── 최대 파일 크기: 10MB (최적화 전 원본 기준) ──
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ── 매직 바이트 시그니처 (파일 위변조 방지) ──
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],        // JPEG: FF D8 FF
  "image/png": [0x89, 0x50, 0x4e, 0x47],   // PNG: 89 50 4E 47
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // PDF: %PDF
};

/**
 * 이미지 최적화: 리사이즈 + 그레이스케일 + JPEG 압축.
 *
 * PDF는 이미지가 아니므로 최적화하지 않고 원본 그대로 반환한다.
 * (sharp는 PDF를 처리하지 못함)
 */
export async function optimizeDocumentImage(
  buffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  // PDF는 최적화 불가 — 원본 반환
  if (mimeType === "application/pdf") {
    return buffer;
  }

  // 1500px 이내 리사이즈 + 흑백 + JPEG 70% 압축
  return sharp(buffer)
    .resize(1500, 1500, { fit: "inside", withoutEnlargement: true })
    .grayscale()
    .jpeg({ quality: 70 })
    .toBuffer();
}

/**
 * 파일 유효성 검증.
 *
 * 3가지를 확인한다:
 *   1) MIME 타입이 허용 목록에 있는지
 *   2) 파일 크기가 10MB 이내인지
 *   3) 파일의 매직 바이트(시그니처)가 MIME 타입과 일치하는지
 *
 * 매직 바이트 검증 이유: Content-Type 헤더는 클라이언트가 위조할 수 있으므로
 * 실제 파일 내용의 첫 바이트를 확인하여 위장된 악성 파일을 차단한다.
 */
export function validateImageFile(
  buffer: Buffer,
  mimeType: string
): { valid: boolean; error?: string } {
  // 1) MIME 타입 체크
  if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: `허용되지 않는 파일 형식입니다. (허용: JPEG, PNG, PDF)`,
    };
  }

  // 2) 파일 크기 체크 (10MB)
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. (최대 10MB, 현재 ${(buffer.length / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  // 3) 매직 바이트 검증 — 실제 파일 내용과 MIME 타입 일치 확인
  const expected = MAGIC_BYTES[mimeType];
  if (expected) {
    const header = Array.from(buffer.subarray(0, expected.length));
    const matches = expected.every((byte, i) => header[i] === byte);
    if (!matches) {
      return {
        valid: false,
        error: "파일 내용이 지정된 형식과 일치하지 않습니다.",
      };
    }
  }

  return { valid: true };
}
