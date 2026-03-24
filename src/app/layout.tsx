import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

/* Space Grotesk: Kinetic Pulse 헤드라인 폰트
   - 한글 미지원이므로 Pretendard가 fallback으로 동작
   - CSS 변수 --font-heading에 연결됨 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heading",
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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Pretendard: 본문 한글 폰트 (CDN) */}
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css" rel="stylesheet" />
        {/* Material Symbols Outlined: 아이콘 폰트 (lucide-react 대체) */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/* Quicksand는 기존 사용처 호환용 유지 */}
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet" />
        {/* 테마 초기화: dark/light 클래스를 html에 추가 (FOUC 방지) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.add(d?'dark':'light');if(localStorage.getItem('textSize')==='large')document.documentElement.classList.add('large-text')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${spaceGrotesk.variable} antialiased`}>{children}</body>
    </html>
  );
}
