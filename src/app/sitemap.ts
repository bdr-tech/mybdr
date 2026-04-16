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

    // 대회 목록: 공개 대회만 (비공개 대회는 검색엔진에 노출 금지)
    const tournaments = await prisma.tournament.findMany({
      where: { is_public: true },
      select: { id: true, updatedAt: true },
      take: 500,
    });

    const tournamentPages: MetadataRoute.Sitemap = tournaments.map((t) => ({
      url: `${baseUrl}/tournaments/${t.id}`,
      lastModified: t.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    // 코트 목록: 1,045개 코트 중 최근 업데이트된 순으로 500개
    const courts = await prisma.courts.findMany({
      where: { is_active: true },
      select: { id: true, updated_at: true },
      orderBy: { updated_at: "desc" },
      take: 500,
    });

    const courtPages: MetadataRoute.Sitemap = courts.map((c) => ({
      url: `${baseUrl}/courts/${c.id}`,
      lastModified: c.updated_at ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    // 커뮤니티 게시글: 삭제되지 않은 게시글 (public_id 기반 URL)
    const posts = await prisma.community_posts.findMany({
      where: { status: { not: "deleted" } },
      select: { public_id: true, updated_at: true },
      orderBy: { updated_at: "desc" },
      take: 500,
    });

    const communityPages: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${baseUrl}/community/${p.public_id}`,
      lastModified: p.updated_at ?? new Date(),
      changeFrequency: "daily" as const,
      priority: 0.5,
    }));

    // 경기 목록: 활성 경기 (public_id 기반 URL)
    // 경기 목록: status=0(모집중), 1(확정), 2(진행중), 3(완료) — 취소(4) 제외
    const games = await prisma.games.findMany({
      where: { status: { not: 4 } },
      select: { game_id: true, updated_at: true },
      orderBy: { updated_at: "desc" },
      take: 500,
    });

    const gamePages: MetadataRoute.Sitemap = games.map((g) => ({
      url: `${baseUrl}/games/${g.game_id}`,
      lastModified: g.updated_at ?? new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    dynamicPages = [...teamPages, ...tournamentPages, ...courtPages, ...communityPages, ...gamePages];
  } catch {
    // DB 연결 실패 시 정적 페이지만 반환 (빌드 환경 등)
    console.error("[sitemap] DB 조회 실패, 정적 페이지만 생성");
  }

  return [...staticPages, ...dynamicPages];
}
