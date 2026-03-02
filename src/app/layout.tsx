import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyBDR - Basketball Tournament Platform",
  description: "농구 토너먼트 관리 플랫폼",
  // PWA: iOS 홈 화면 추가 지원
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
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
