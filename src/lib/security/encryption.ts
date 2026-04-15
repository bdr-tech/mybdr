import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * 주민등록번호 암호화 유틸 (AES-256-GCM)
 *
 * 보안 원칙:
 *   - 평문 저장/로그 출력 절대 금지
 *   - 환경변수 RESIDENT_ID_ENCRYPTION_KEY 필수 (32바이트 hex = 64자)
 *   - GCM 모드: 무결성 검증 포함 (위변조 탐지)
 *   - IV(nonce): 매 암호화마다 랜덤 생성, 암호문 앞에 붙여서 저장
 *
 * 저장 형식: base64( iv(12) + authTag(16) + ciphertext )
 */

// ── 환경변수에서 암호화 키 로드 ──
function getEncryptionKey(): Buffer {
  const keyHex = process.env.RESIDENT_ID_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "RESIDENT_ID_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다."
    );
  }
  // 64자 hex = 32바이트 (AES-256 키 길이)
  if (keyHex.length !== 64) {
    throw new Error(
      "RESIDENT_ID_ENCRYPTION_KEY는 64자 hex 문자열이어야 합니다. (32바이트)"
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * 주민번호 암호화
 *
 * @param plainText - 평문 주민번호 (예: "901215-1234567")
 * @returns base64 인코딩된 암호문 (iv + authTag + ciphertext)
 */
export function encryptResidentId(plainText: string): string {
  const key = getEncryptionKey();
  // GCM 권장 IV 길이: 12바이트 (96비트)
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainText, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // 인증 태그: GCM이 제공하는 무결성 검증값 (16바이트)
  const authTag = cipher.getAuthTag();

  // iv(12) + authTag(16) + ciphertext → base64로 하나의 문자열로 합침
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * 주민번호 복호화
 *
 * @param encryptedBase64 - encryptResidentId()로 암호화된 base64 문자열
 * @returns 평문 주민번호
 * @throws 키 불일치 또는 데이터 위변조 시 에러
 */
export function decryptResidentId(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");

  // 앞 12바이트: IV, 다음 16바이트: authTag, 나머지: ciphertext
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const encrypted = combined.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * 주민번호 마스킹 표시
 * "901215-1234567" → "901215-1******"
 *
 * 앞 6자리(생년월일) + 하이픈 + 뒷자리 첫 번째 + ******
 */
export function maskResidentId(residentId: string): string {
  // 하이픈 제거 후 순수 숫자만
  const digits = residentId.replace(/-/g, "");
  if (digits.length !== 13) {
    return "******-*******"; // 형식 오류 시 완전 마스킹
  }
  // 앞 6자리 + 하이픈 + 7번째 자리(성별 코드) + ******
  return `${digits.slice(0, 6)}-${digits[6]}******`;
}

/**
 * 주민번호 뒷자리 마지막 4자리 추출
 * "901215-1234567" → "4567"
 *
 * DB에 resident_id_last4로 저장하여 간편 조회에 활용
 */
export function extractLast4(residentId: string): string {
  const digits = residentId.replace(/-/g, "");
  if (digits.length !== 13) {
    throw new Error("유효하지 않은 주민번호 형식입니다.");
  }
  return digits.slice(-4);
}
