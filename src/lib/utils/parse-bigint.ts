/**
 * 문자열을 BigInt로 안전하게 파싱한다.
 * 변환 실패 시 null을 반환하여 호출부에서 404/400 처리를 결정할 수 있도록 한다.
 */
export function parseBigIntParam(value: string): bigint | null {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}
