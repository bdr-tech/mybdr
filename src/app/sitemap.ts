import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

// 사이트맵: 검색엔진(구글 등)이 우리 사이트의 모든 페이지를 찾을 수 있도록 목록을 제공
// Next.js가 자동으로 /sitemap.xml 경로에 XML을 생성해줌
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://mybdr.kr";

  // --- 정적 페이지: 항상 존재하는 고정 URL ---
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily", // 홈은 매일 콘텐츠가 바뀜
      priority: 1.0, // 가장 중요한 페이지
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tournaments`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/courts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // --- 동적 페이지: DB에서 팀/대회 ID를 조회해서 개별 URL 생성 ---
  // try-catch로 감싸서 DB 연결 실패 시에도 정적 페이지는 반환되도록
  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // 팀 목록: 공개(is_public) + 활성(active) 팀만
    const teams = await prisma.team.findMany({
      where: { is_public: true, status: "active" },
      select: { id: true, updatedAt: true },
      take: 500, // 너무 많으면 사이트맵이 커지므로 제한
    });

    const teamPages: MetadataRoute.Sitemap = teams.map((team) => ({
      url: `${baseUrl}/teams/${team.id}`,
      lastModified: team.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    // 대회 목록: 모든 대회 (과거 대회도 검색엔진에 노출되면 좋음)
    const tournaments = await prisma.tournament.findMany({
      select: { id: true, updatedAt: true },
      take: 500,
    });

    const tournamentPages: MetadataRoute.Sitemap = tournaments.map((t) => ({
      url: `${baseUrl}/tournaments/${t.id}`,
      lastModified: t.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    dynamicPages = [...teamPages, ...tournamentPages];
  } catch {
    // DB 연결 실패 시 정적 페이지만 반환 (빌드 환경 등)
    console.error("[sitemap] DB 조회 실패, 정적 페이지만 생성");
  }

  return [...staticPages, ...dynamicPages];
}
