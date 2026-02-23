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
      <h1 className="mb-2 text-2xl font-bold">결제 실패</h1>
      <p className="mb-8 text-[#6B7280]">
        결제가 완료되지 않았습니다. 다시 시도해주세요.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/pricing"
          className="rounded-[12px] bg-[#0066FF] px-6 py-3 font-semibold text-black transition-colors hover:bg-[#0052CC]"
        >
          요금제 다시 보기
        </Link>
        <Link
          href="/"
          className="rounded-[12px] border border-[#E8ECF0] px-6 py-3 text-sm text-[#6B7280] transition-colors hover:border-[#0066FF]/50 hover:text-[#111827]"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
