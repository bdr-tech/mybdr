/**
 * MiniStat — 프로필 Hero 내부 통계 1칸
 *
 * 왜:
 * - `/profile`과 `/users/[id]` 양쪽 Hero에 동일 디자인의 통계 그리드가 중복 구현되어 있었다
 *   (profile-hero.tsx 내부 함수 + users/[id]/page.tsx 인라인 4칸).
 * - 이제 공용 Hero 하나가 양쪽을 커버하므로 MiniStat도 공용으로 추출.
 *
 * 어떻게:
 * - 라벨(상단, 작은 회색) + 숫자(하단, 큰 볼드).
 * - highlight=true일 때는 숫자를 BDR Red(--color-primary)로 강조 (승률 등).
 * - 색상은 전부 CSS 변수 경유 (하드코딩 0).
 */

export interface MiniStatProps {
  /** 라벨 텍스트 (예: "경기수", "승률") */
  label: string;
  /** 표시 값 (숫자/문자열 모두 허용, 최종은 문자열로 렌더) */
  value: string | number;
  /** 강조 색상 적용 여부 — 승률 같은 핵심 지표는 BDR Red로 */
  highlight?: boolean;
}

export function MiniStat({ label, value, highlight }: MiniStatProps) {
  return (
    <div
      className="min-w-[72px] rounded-md p-3 text-center md:min-w-[90px]"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <p
        className="mb-1 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-lg font-bold md:text-xl"
        style={{
          color: highlight
            ? "var(--color-primary)"
            : "var(--color-text-primary)",
        }}
      >
        {String(value)}
      </p>
    </div>
  );
}
