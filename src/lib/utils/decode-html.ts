/**
 * HTML 엔티티 디코드 유틸
 *
 * [왜 필요한가]
 * 다음카페 크롤링으로 들어온 텍스트에 `&amp;`, `&#39;`, `&nbsp;` 등 HTML 엔티티가
 * 그대로 저장돼 있어 UI에 "팀&amp;스포츠" 같이 노출되는 문제가 있다.
 * DB 원본 값은 그대로 두고 **렌더링 시점에만** 디코드하여
 * - 원본 복구 가능 (재인코딩/중복 디코드 위험 없음)
 * - 카페 파서 출력과 분리 (파서는 DB 의존 0 유지)
 *
 * [의존성 0 원칙]
 * 외부 라이브러리(he/entities 등) 대신 정규식 기반 경량 구현.
 * 자주 등장하는 명명 엔티티 + 숫자/16진수 참조만 커버한다.
 */

// 자주 쓰이는 명명 엔티티 매핑 (필요 시 확장)
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0", // non-breaking space
};

/**
 * HTML 엔티티를 일반 문자로 디코드한다.
 * - `null`/`undefined`/빈 문자열은 그대로 반환 → 옵셔널 체이닝과 호환
 * - `&amp;` → `&`, `&#39;` → `'`, `&#x27;` → `'`, `&nbsp;` → (NBSP)
 * - 알 수 없는 엔티티는 원문 유지 (안전한 폴백)
 */
export function decodeHtmlEntities<T extends string | null | undefined>(input: T): T {
  // null / undefined / 빈 문자열은 손대지 않음
  if (input === null || input === undefined || input === "") return input;

  // 이 시점에서 input은 non-empty string. TS 타입 좁히기를 위해 캐스트.
  const s = input as string;

  return s
    // 숫자 참조 (&#123; 또는 &#x7B;) — 먼저 처리 (명명 엔티티와 충돌 없음)
    .replace(/&#(x?[0-9a-fA-F]+);/g, (_, code: string) => {
      const isHex = code.startsWith("x") || code.startsWith("X");
      const num = isHex ? parseInt(code.slice(1), 16) : parseInt(code, 10);
      // NaN 또는 유니코드 범위 밖이면 원문 유지
      if (!Number.isFinite(num) || num < 0 || num > 0x10ffff) return `&#${code};`;
      try {
        return String.fromCodePoint(num);
      } catch {
        return `&#${code};`;
      }
    })
    // 명명 엔티티 — 매핑에 있는 것만 치환, 나머지는 원문 유지
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => {
      const mapped = NAMED_ENTITIES[name.toLowerCase()];
      return mapped !== undefined ? mapped : match;
    }) as T;
}
