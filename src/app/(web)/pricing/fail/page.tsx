import Link from "next/link";

export default function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; code?: string }>;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(239,68,68,0.15)]">
        <span className="text-4xl">❌</span>
      </div>
      <h1 className="mb-2 text-xl font-bold sm:text-2xl">결제 실패</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">
        결제가 완료되지 않았습니다. 다시 시도해주세요.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/pricing"
          className="rounded-[12px] bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          요금제 다시 보기
        </Link>
        <Link
          href="/"
          className="rounded-[12px] border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-text-primary)]"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
