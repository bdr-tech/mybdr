import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#E8ECF0] bg-[#F5F7FA] py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#F4A261]">MyBDR</span>
            <span className="text-xs text-[#6B7280]">© {new Date().getFullYear()}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#6B7280]">
            <Link href="/pricing" className="transition-colors hover:text-[#F4A261]">
              요금제
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#111827]">
              이용약관
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-[#111827]">
              개인정보처리방침
            </Link>
            <a
              href="mailto:bdr.wonyoung@gmail.com"
              className="transition-colors hover:text-[#111827]"
            >
              광고 문의
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
