import type { MetadataRoute } from "next";

// robots.txt: 검색엔진 크롤러에게 "어디를 읽어도 되고, 어디는 읽지 마라"고 알려주는 파일
// Next.js가 자동으로 /robots.txt 경로에 생성해줌
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://mybdr.kr";

  return {
    rules: [
      {
        userAgent: "*", // 모든 검색엔진 봇에게 적용
        allow: "/", // 기본적으로 모든 페이지 크롤링 허용
        disallow: [
          "/api/", // API 엔드포인트는 크롤링 불필요
          "/admin/", // 관리자 페이지 차단
          "/profile/", // 개인정보 페이지 차단
          "/profile", // /profile 정확 경로도 차단
          "/login", // 인증 관련 페이지
          "/register",
          "/verify",
        ],
      },
    ],
    // 사이트맵 위치를 알려줘서 크롤러가 모든 페이지를 효율적으로 발견하도록
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
