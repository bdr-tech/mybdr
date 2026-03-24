import Link from "next/link";

export function Footer() {
  return (
    // 풋터: 배경/테두리/텍스트 CSS 변수로 다크 모드 자동 대응
    <footer className="py-8" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            {/* BDR 로고: 빨강 -> 웜 오렌지 */}
            <span className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-accent)' }}>BDR</span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>&copy; {new Date().getFullYear()}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <Link href="/pricing" className="transition-colors hover:underline" style={{ color: 'inherit' }}>
              요금제
            </Link>
            <Link href="/terms" className="transition-colors hover:underline" style={{ color: 'inherit' }}>
              이용약관
            </Link>
            <Link href="/privacy" className="transition-colors hover:underline" style={{ color: 'inherit' }}>
              개인정보처리방침
            </Link>
            <a
              href="mailto:bdr.wonyoung@gmail.com"
              className="transition-colors hover:underline"
              style={{ color: 'inherit' }}
            >
              광고 문의
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
