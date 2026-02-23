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
      <h1 className="mb-2 text-2xl font-bold">결제 완료!</h1>
      <p className="mb-8 text-[#6B7280]">
        구독이 활성화되었습니다. 이제 모든 기능을 이용하실 수 있습니다.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-[12px] bg-[#0066FF] px-6 py-3 font-semibold text-black transition-colors hover:bg-[#0052CC]"
        >
          홈으로
        </Link>
        <Link
          href="/pricing"
          className="rounded-[12px] border border-[#E8ECF0] px-6 py-3 text-sm text-[#6B7280] transition-colors hover:border-[#0066FF]/50 hover:text-[#111827]"
        >
          요금제 목록
        </Link>
      </div>
    </div>
  );
}
