import type { Metadata, Viewport } from "next";
// next/font/google: BDR v2 타입 시스템의 display(Archivo) + mono(JetBrains Mono) 로딩
// - 이유: v2 tokens.css는 --ff-display/--ff-mono 변수로 디스플레이/모노 폰트를 주입받는데,
//   font-display:swap 자동 적용 + FOUC 최소화를 위해 CDN link 대신 next/font 사용
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Archivo — v2 display(헤딩·로고·brutalist dark 대문자) 용. 여러 weight 모두 필요
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

// JetBrains Mono — v2 .t-mono / 숫자 셀(table tabular) 용
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mybdr.kr"),
  title: "MyBDR - Basketball Tournament Platform",
  description: "농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요",
  openGraph: {
    title: "MyBDR - Basketball Daily Routine",
    description: "농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요",
    images: [{ url: "/images/logo.png", width: 600, height: 600, alt: "BDR Logo" }],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "MyBDR - Basketball Daily Routine",
    description: "농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요",
    images: ["/images/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyBDR",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // iOS safe area 지원 (홈 인디케이터 영역)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // className에 next/font 변수 주입 → globals.css의 `html { --ff-display: var(--font-archivo) }` 오버라이드에서 사용
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${archivo.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* CDN 사전 연결: DNS+TCP+TLS를 미리 완료해서 폰트 로딩 시간 단축 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

        {/* Pretendard(본문) + Material Symbols(아이콘) 비동기 로딩
            - BDR v2 --ff-body 기본값 'Pretendard' 에 매칭
            - media="print" 트릭으로 렌더링 차단 해제 (onload에서 media='all'로 전환)
            - Archivo/JetBrains Mono는 next/font가 처리 (위 임포트)
            - SUIT Variable은 v2 이행으로 제거 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var fonts = [
    'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap'
  ];
  fonts.forEach(function(href){
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.media = 'print';
    l.onload = function(){ this.media = 'all'; };
    document.head.appendChild(l);
  });
})();
`,
          }}
        />
        {/* JS 비활성화 환경 폴백 */}
        <noscript>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap" />
        </noscript>
        {/* 테마 초기화: dark/light 클래스 + data-theme 속성 이중 세팅 (v2는 [data-theme="dark"] 사용)
            FOUC 방지를 위해 head에서 동기 실행 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);var mode=d?'dark':'light';document.documentElement.classList.add(mode);document.documentElement.setAttribute('data-theme',mode);if(localStorage.getItem('textSize')==='large')document.documentElement.classList.add('large-text')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
