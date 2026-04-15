import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * 정산 서류 전용 암호화 유틸 (AES-256-GCM).
 *
 * 이유: 주민번호 암호화(encryption.ts)와 동일한 AES-256-GCM 패턴이지만,
 *       **별도 키(DOCUMENT_ENCRYPTION_KEY)**를 사용한다.
 *       키를 분리하면 하나가 유출돼도 나머지 데이터를 보호할 수 있다 (키 격리 원칙).
 *
 * 저장 형식: base64( iv(12) + authTag(16) + ciphertext )
 * 환경변수: DOCUMENT_ENCRYPTION_KEY (64자 hex = 32바이트)
 */

// ── 환경변수에서 서류 암호화 키 로드 ──
function getDocumentEncryptionKey(): Buffer {
  const keyHex = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!keyHex) {
    // 개발 환경에서 키 미설정 시 안내 메시지 출력 후 에러
    console.error(
      "\n[서류 암호화] DOCUMENT_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.\n" +
        "다음 명령으로 키를 생성하세요:\n" +
        "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n" +
        ".env에 추가: DOCUMENT_ENCRYPTION_KEY=<생성된 64자 hex>\n"
    );
    throw new Error("DOCUMENT_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.");
  }
  if (keyHex.length !== 64) {
    throw new Error(
      "DOCUMENT_ENCRYPTION_KEY는 64자 hex 문자열이어야 합니다. (32바이트)"
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * 서류 이미지 암호화.
 *
 * @param buffer - 최적화된 이미지 Buffer
 * @returns base64 인코딩된 암호문 (iv + authTag + ciphertext)
 */
export function encryptDocument(buffer: Buffer): string {
  const key = getDocumentEncryptionKey();
  // GCM 권장 IV 길이: 12바이트 (96비트)
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(buffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // 인증 태그: GCM이 제공하는 무결성 검증값 (16바이트)
  const authTag = cipher.getAuthTag();

  // iv(12) + authTag(16) + ciphertext → base64로 하나의 문자열로 합침
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * 서류 이미지 복호화.
 *
 * @param encryptedBase64 - encryptDocument()로 암호화된 base64 문자열
 * @returns 복호화된 이미지 Buffer
 * @throws 키 불일치 또는 데이터 위변조 시 에러
 */
export function decryptDocument(encryptedBase64: string): Buffer {
  const key = getDocumentEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");

  // 앞 12바이트: IV, 다음 16바이트: authTag, 나머지: ciphertext
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const encrypted = combined.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}
