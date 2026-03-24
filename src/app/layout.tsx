import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mybdr.kr"),
  title: "MyBDR - Basketball Tournament Platform",
  description: "농구 토너먼트 관리 플랫폼",
  openGraph: {
    title: "MyBDR - Basketball Tournament Platform",
    description: "농구 토너먼트 관리 플랫폼",
    images: ["/images/logo.png"],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "MyBDR - Basketball Tournament Platform",
    description: "농구 토너먼트 관리 플랫폼",
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
  viewportFit: "cover",
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
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/* flash-free 테마 초기화 */}
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
