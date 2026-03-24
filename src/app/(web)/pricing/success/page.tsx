import Link from "next/link";

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; paymentKey?: string }>;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(74,222,128,0.15)]">
        <span className="text-4xl">✅</span>
      </div>
      <h1 className="mb-2 text-xl font-bold sm:text-2xl">결제 완료!</h1>
      <p className="mb-8 text-[var(--color-text-muted)]">
        구독이 활성화되었습니다. 이제 모든 기능을 이용하실 수 있습니다.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-[12px] bg-[var(--color-accent)] px-6 py-3 font-semibold text-black transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          홈으로
        </Link>
        <Link
          href="/pricing"
          className="rounded-[12px] border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-text-primary)]"
        >
          요금제 목록
        </Link>
      </div>
    </div>
  );
}
