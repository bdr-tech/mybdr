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

          {/* SNS 링크: YouTube + Instagram */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.youtube.com/@BDRBASKET"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="BDR YouTube"
            >
              {/* YouTube 아이콘: Material Symbols에 없으므로 play_circle 대체 */}
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              <span>YouTube</span>
            </a>
            <a
              href="https://www.instagram.com/bdr_basket"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="BDR Instagram"
            >
              {/* Instagram 아이콘: Material Symbols에 없으므로 photo_camera 대체 */}
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
