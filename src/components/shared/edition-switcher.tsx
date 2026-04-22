/**
 * EditionSwitcher — 시리즈 회차 이동 3버튼
 *
 * 왜 이 컴포넌트가 필요한가:
 * - 시리즈(예: "BDR 챔피언십")는 여러 회차(1회차, 2회차, ...)로 구성된다.
 * - 대회 상세 페이지에서 같은 시리즈의 이전/다음 회차로 바로 이동할 수 있어야
 *   "역대 기록 추적"이 자연스러워진다.
 * - 회차별로 URL이 다른 대회 UUID이므로 next/link로 서버 내비게이션한다.
 *
 * 어떻게 동작하나:
 * - 이전/시리즈 전체/다음 3버튼 가로 정렬
 * - prev/next가 null이면 해당 버튼은 <span>으로 폴백(aria-disabled)
 *   → Link로 유지하면 href="#" 접근성 경고가 뜨고, onClick preventDefault는 SSR과 맞지 않음
 * - 색상은 전부 CSS 변수(var(--color-*))만 사용 (하드코딩 금지 — lessons.md audit)
 * - 아이콘은 Material Symbols Outlined 고정 (lucide 금지)
 */

import Link from "next/link";

export interface EditionSwitcherProps {
  /** 현재 대회 회차 번호 (표시용). edition_number nullable DB 필드지만 이 컴포넌트는 number 보장 후 호출. */
  currentEditionNumber: number;
  /** 이전 회차 tournament UUID. 1회차면 null → 버튼 비활성화. */
  prevTournamentId: string | null;
  /** 다음 회차 tournament UUID. 최신 회차면 null → 버튼 비활성화. */
  nextTournamentId: string | null;
  /** 시리즈 slug — "전체 보기" 버튼이 /series/{slug}로 이동. */
  seriesSlug: string;
  /** 시리즈 전체 회차 수 — "전체 N회차" 라벨에 사용. */
  totalEditions: number;
}

export function EditionSwitcher({
  currentEditionNumber,
  prevTournamentId,
  nextTournamentId,
  seriesSlug,
  totalEditions,
}: EditionSwitcherProps) {
  // 공통 버튼 기본 클래스 — 활성/비활성 공용. 색상은 인라인 style로 CSS 변수 주입.
  const baseBtnClass =
    "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors";

  return (
    <nav
      role="navigation"
      aria-label="회차 이동"
      // ≤320px 극단 화면에서 3버튼이 한 줄에 못 들어갈 때 줄바꿈 허용.
      // gap-2 유지로 세로 쌓여도 간격 자연스럽게 유지.
      className="flex flex-wrap items-center justify-between gap-2"
    >
      {/* 이전 회차 버튼 — prevTournamentId null이면 span 폴백 (aria-disabled) */}
      {prevTournamentId ? (
        <Link
          href={`/tournaments/${prevTournamentId}`}
          className={`${baseBtnClass} hover:border-[var(--color-primary)]`}
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          이전
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${baseBtnClass} cursor-not-allowed opacity-50`}
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          이전
        </span>
      )}

      {/* 시리즈 전체 보기 — 항상 활성 (시리즈 페이지 이동) */}
      <Link
        href={`/series/${seriesSlug}`}
        className={`${baseBtnClass} hover:border-[var(--color-primary)]`}
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-primary)",
        }}
      >
        <span className="material-symbols-outlined text-sm">apps</span>
        {/* 현재 회차 / 전체 회차 — 맥락 즉시 파악용 */}
        {currentEditionNumber}회차 / 전체 {totalEditions}회차
      </Link>

      {/* 다음 회차 버튼 — nextTournamentId null이면 span 폴백 */}
      {nextTournamentId ? (
        <Link
          href={`/tournaments/${nextTournamentId}`}
          className={`${baseBtnClass} hover:border-[var(--color-primary)]`}
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        >
          다음
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${baseBtnClass} cursor-not-allowed opacity-50`}
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
        >
          다음
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </span>
      )}
    </nav>
  );
}
