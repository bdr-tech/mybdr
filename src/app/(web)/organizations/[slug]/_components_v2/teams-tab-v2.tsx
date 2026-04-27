/* ============================================================
 * 단체 상세 - 소속팀 탭 v2 (Server Component)
 *
 * 이유(왜):
 *  - 시안은 단체 → 팀 N개 카드 그리드를 보여주지만, 현재 DB에는
 *    organizations ↔ teams 직접 관계가 없다 (series → tournaments → teams).
 *  - 정확한 "소속팀" 집계 쿼리는 별도 설계가 필요해 Phase 3 후속으로 미룸
 *    (scratchpad "Phase 3 Orgs 추후 구현 목록 — 단체별 팀 수 집계" 일치).
 *  - 그래서 본 탭은 빈 상태 placeholder만 보여주고, UI 자리는 보존한다.
 * ============================================================ */

export function TeamsTabV2() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
      {/* Material Symbols (lucide-react 금지 컨벤션) */}
      <span className="material-symbols-outlined text-4xl text-[var(--color-text-disabled)]">
        sports_basketball
      </span>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        준비 중 (집계 예정)
      </p>
      <p className="mx-auto mt-1 max-w-md text-xs text-[var(--color-text-disabled)]">
        단체 소속 팀 집계 기능은 추후 업데이트 예정입니다.
      </p>
    </div>
  );
}
