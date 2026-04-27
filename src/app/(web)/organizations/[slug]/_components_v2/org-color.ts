/* ============================================================
 * 단체 색상/태그 공유 헬퍼 — Phase 3 Org 상세 v2
 *
 * 이유(왜):
 *  - DB에 organizations.brand_color / organizations.tag 컬럼이 아직 없다
 *    (스크래치패드 "🚧 추후 구현 목록 — Phase 3 Orgs" 참조).
 *  - 카드(`org-card-v2.tsx`)와 상세 Hero(`org-hero-v2.tsx`)가 동일한 색/태그
 *    fallback 로직을 공유해야 시각적으로 일관된다.
 *  - 그래서 같은 헬퍼 두 벌을 두지 않고, 본 파일을 단일 소스로 만들고
 *    카드 측에서도 import 해서 쓰도록 통합한다.
 *
 * 방법(어떻게):
 *  - `pickColor`: id 문자열을 31진 해시 → 6색 팔레트에서 결정적으로 선택
 *  - `generateTag`: 영문 대문자 우선 → 영문 단어 이니셜 → 한글 첫 2글자
 * ============================================================ */

// 6색 팔레트 (디자인 시안 ORGS 더미와 동일 — scratchpad에 기록된 값)
export const ORG_COLOR_PALETTE = [
  "#0F5FCC", // 파랑
  "#E31B23", // BDR Red
  "#10B981", // 초록
  "#F59E0B", // 주황
  "#8B5CF6", // 보라
  "#0EA5E9", // 하늘
] as const;

// id → 6색 팔레트 결정적 매핑 (같은 단체는 항상 같은 색)
export function pickColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    // 31진 해시 + |0 으로 32bit 정수화 (로직은 카드 v2와 동일)
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ORG_COLOR_PALETTE[Math.abs(hash) % ORG_COLOR_PALETTE.length];
}

// 단체명 → 4글자 이내 태그 라벨
export function generateTag(name: string): string {
  const trimmed = name.trim();

  // 1) 영문 대문자만 있는 경우 (예: "BDR" → "BDR")
  const upperOnly = trimmed.replace(/[^A-Z]/g, "");
  if (upperOnly.length >= 2) return upperOnly.slice(0, 4);

  // 2) 영문 다중 단어 → 단어 이니셜 (예: "Seoul Basket" → "SB")
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.every((w) => /^[A-Za-z]/.test(w)) && words.length >= 2) {
    return words
      .map((w) => w.charAt(0).toUpperCase())
      .join("")
      .slice(0, 4);
  }

  // 3) 한글/혼합 → 앞 2글자 (예: "서울바스켓" → "서울")
  return trimmed.slice(0, 2).toUpperCase();
}
