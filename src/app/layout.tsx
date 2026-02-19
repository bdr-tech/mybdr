import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyBDR - Basketball Tournament Platform",
  description: "농구 토너먼트 관리 플랫폼",
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
