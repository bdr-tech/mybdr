import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#2A2A2A] bg-[#141414] py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#F4A261]">MyBDR</span>
            <span className="text-xs text-[#A0A0A0]">© {new Date().getFullYear()}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#A0A0A0]">
            <Link href="/pricing" className="transition-colors hover:text-[#F4A261]">
              요금제
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              이용약관
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              개인정보처리방침
            </Link>
            <a
              href="mailto:bdr.wonyoung@gmail.com"
              className="transition-colors hover:text-white"
            >
              광고 문의
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
