import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { SearchClient } from "./_components/search-client";

// SEO: 검색 페이지 메타데이터
export const metadata: Metadata = {
  title: "검색 - MyBDR",
  description: "경기, 대회, 팀, 코트, 유저, 커뮤니티를 통합 검색하세요.",
};

/* ============================================================
 * /search?q=키워드 — 통합 검색 결과 페이지 (BDR v2 재구성)
 *
 * 왜 서버 + 클라 분리 구조인가:
 * - Prisma 쿼리는 서버에서 직접 실행해야 보안/성능상 이점이 있다 (이전 버전 유지).
 * - 검색 input controlled + 탭 전환(클라이언트 필터)은 "use client"가 필요하다.
 * - 따라서 page.tsx(서버)는 Prisma로 6테이블 동시 검색 후 직렬화하여
 *   search-client.tsx에 props 로 전달한다.
 *
 * v2 변경점:
 * - .page 쉘 + inline maxWidth 유지 (Phase 1/2 일관)
 * - 탭 7개(전체/팀/경기/대회/커뮤니티/코트/유저) — 사용자 원칙: 데이터 있으면 표시
 * - controlled form + URL push (Enter/submit 시 router.push)
 *
 * 불변:
 * - 기존 Prisma 쿼리 6종 그대로 유지 (API/서비스 변경 없음)
 * - 6종 데이터(games/tournaments/teams/posts/users/courts) 전부 화면 노출
 * ============================================================ */

export const dynamic = "force-dynamic";

// 직렬화된 검색 결과 타입 — 클라로 넘길 때 BigInt/Date 불가능하므로 문자열화
export interface SerializedGame {
  id: string;
  title: string | null;
  game_type: number;
  venue_name: string | null;
  city: string | null;
  scheduled_at: string | null;
}
export interface SerializedTournament {
  id: string;
  name: string;
  status: string | null;
  city: string | null;
  start_date: string | null;
  teams_count: number | null;
  max_teams: number | null;
}
export interface SerializedTeam {
  id: string;
  name: string;
  city: string | null;
  members_count: number | null;
}
export interface SerializedPost {
  id: string;
  title: string;
  category: string | null;
  comments_count: number;
  created_at: string | null;
}
export interface SerializedUser {
  id: string;
  nickname: string | null;
  name: string | null;
  position: string | null;
  city: string | null;
}
export interface SerializedCourt {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  court_type: string;
  average_rating: number | null;
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";

  // 검색어가 없으면 input만 있는 빈 상태로 클라에 위임 (탭/결과는 빈 배열)
  if (!q) {
    return (
      <SearchClient
        q=""
        games={[]}
        tournaments={[]}
        teams={[]}
        posts={[]}
        users={[]}
        courts={[]}
      />
    );
  }

  // 6개 테이블 동시 검색 (서버 컴포넌트이므로 Prisma 직접 사용) — 기존 로직 그대로
  const [games, tournaments, teams, posts, users, courts] = await Promise.all([
    prisma.games.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      orderBy: { scheduled_at: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        game_type: true,
        venue_name: true,
        city: true,
        scheduled_at: true,
      },
    }),
    prisma.tournament.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        city: true,
        startDate: true,
        teams_count: true,
        maxTeams: true,
      },
    }),
    prisma.team.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        members_count: true,
      },
    }),
    prisma.community_posts.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        status: "published",
      },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        comments_count: true,
        created_at: true,
      },
    }),
    // 유저: nickname 또는 name에서 키워드 검색
    prisma.user.findMany({
      where: {
        OR: [
          { nickname: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        nickname: true,
        name: true,
        position: true,
        city: true,
      },
    }),
    // 코트: name 또는 address에서 키워드 검색
    prisma.court_infos.findMany({
      where: {
        status: "active",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { checkins_count: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        district: true,
        court_type: true,
        average_rating: true,
      },
    }),
  ]);

  // BigInt / Date 직렬화 — 클라에 전달하려면 plain object 필수
  const sGames: SerializedGame[] = games.map((g) => ({
    id: g.id.toString(),
    title: g.title,
    game_type: g.game_type,
    venue_name: g.venue_name,
    city: g.city,
    scheduled_at: g.scheduled_at ? g.scheduled_at.toISOString() : null,
  }));
  const sTournaments: SerializedTournament[] = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    city: t.city,
    start_date: t.startDate ? t.startDate.toISOString() : null,
    teams_count: t.teams_count ?? null,
    max_teams: t.maxTeams ?? null,
  }));
  const sTeams: SerializedTeam[] = teams.map((tm) => ({
    id: tm.id.toString(),
    name: tm.name,
    city: tm.city,
    members_count: tm.members_count ?? null,
  }));
  const sPosts: SerializedPost[] = posts.map((p) => ({
    id: p.id.toString(),
    title: p.title,
    category: p.category,
    // comments_count 는 스키마상 Int — nullable 처리 안전하게
    comments_count: p.comments_count ?? 0,
    created_at: p.created_at ? p.created_at.toISOString() : null,
  }));
  const sUsers: SerializedUser[] = users.map((u) => ({
    id: u.id.toString(),
    nickname: u.nickname,
    name: u.name,
    position: u.position,
    city: u.city,
  }));
  const sCourts: SerializedCourt[] = courts.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    address: c.address,
    city: c.city,
    district: c.district,
    court_type: c.court_type,
    // Decimal → number (소수점 한 자리 표시용). null 가능성 처리
    average_rating:
      c.average_rating != null ? Number(c.average_rating) : null,
  }));

  return (
    <SearchClient
      q={q}
      games={sGames}
      tournaments={sTournaments}
      teams={sTeams}
      posts={sPosts}
      users={sUsers}
      courts={sCourts}
    />
  );
}
