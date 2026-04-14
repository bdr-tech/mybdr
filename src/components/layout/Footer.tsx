import Link from "next/link";

export function Footer() {
  return (
    // 풋터: 배경/테두리/텍스트 CSS 변수로 다크 모드 자동 대응
    <footer className="py-4 sm:py-8" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-2 sm:gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            {/* BDR 로고: 빨강 -> 웜 오렌지 */}
            <span className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-accent)' }}>BDR</span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>&copy; {new Date().getFullYear()}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-6 sm:gap-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
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

          {/* SNS 링크: YouTube + Instagram (컬러 원본 아이콘) */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="https://www.youtube.com/@BDRBASKET"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              aria-label="BDR YouTube"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814Z" fill="#FF0000"/><path d="m9.545 15.568 6.273-3.568-6.273-3.568v7.136Z" fill="#fff"/></svg>
              <span style={{ color: 'var(--color-text-secondary)' }}>YouTube</span>
            </a>
            <a
              href="https://www.instagram.com/bdr_basket"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              aria-label="BDR Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig)"/><circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="1.5" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>
              <span style={{ color: 'var(--color-text-secondary)' }}>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
