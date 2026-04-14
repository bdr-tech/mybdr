import Link from "next/link";

export function BracketEmpty({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] py-16 px-6 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="mb-4 text-4xl">🏆</div>
      <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
        아직 대진표가 없습니다
      </h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 주최자가 대진표를 생성하면 여기에 표시됩니다.
      </p>
      {/* CTA 버튼: accent 색상 + hover 시 약간 어두워지는 효과 */}
      <Link
        href={`/tournaments/${tournamentId}/teams`}
        className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[var(--color-on-accent)] transition-colors hover:opacity-90"
      >
        참가팀 보러가기
      </Link>
    </div>
  );
}
