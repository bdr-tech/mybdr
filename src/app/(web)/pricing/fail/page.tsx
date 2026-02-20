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
      <p className="mb-8 text-[#A0A0A0]">
        결제가 완료되지 않았습니다. 다시 시도해주세요.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/pricing"
          className="rounded-[12px] bg-[#F4A261] px-6 py-3 font-semibold text-black transition-colors hover:bg-[#E76F51]"
        >
          요금제 다시 보기
        </Link>
        <Link
          href="/"
          className="rounded-[12px] border border-[#2A2A2A] px-6 py-3 text-sm text-[#A0A0A0] transition-colors hover:border-[#F4A261]/50 hover:text-white"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
