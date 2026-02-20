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
      <p className="mb-8 text-[#A0A0A0]">
        구독이 활성화되었습니다. 이제 모든 기능을 이용하실 수 있습니다.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-[12px] bg-[#F4A261] px-6 py-3 font-semibold text-black transition-colors hover:bg-[#E76F51]"
        >
          홈으로
        </Link>
        <Link
          href="/pricing"
          className="rounded-[12px] border border-[#2A2A2A] px-6 py-3 text-sm text-[#A0A0A0] transition-colors hover:border-[#F4A261]/50 hover:text-white"
        >
          요금제 목록
        </Link>
      </div>
    </div>
  );
}
