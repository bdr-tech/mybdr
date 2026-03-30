import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/feed
 *
 * 최근 활동 피드 API — 전체 공개 활동을 시간순으로 조회
 * - 경기 참가 (game_applications, status=1 승인된 것)
 * - 대회 참가 (tournament_teams)
 * - 커뮤니티 글 작성 (community_posts)
 *
 * 팔로우 기능이 아직 없으므로 "전체 최근 활동"으로 대체.
 * 각 카테고리에서 최근 5건씩 조회 후 시간순 정렬, 총 5건 반환.
 */
export async function GET(_request: NextRequest) {
  try {
    // 3개 테이블에서 최근 활동을 병렬 조회
    const [gameApps, tournamentTeams, posts] = await Promise.all([
      // 경기 참가: 승인된(status=1) 최근 신청 5건
      prisma.game_applications.findMany({
        where: { status: 1 },
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          id: true,
          created_at: true,
          users: { select: { id: true, name: true, nickname: true } },
          games: { select: { id: true, title: true, game_type: true } },
        },
      }),

      // 대회 참가: 최근 참가팀 5건
      prisma.tournamentTeam.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          team: { select: { id: true, name: true } },
          tournament: { select: { id: true, name: true } },
        },
      }),

      // 커뮤니티 글: 최근 게시글 5건
      prisma.community_posts.findMany({
        where: { status: "published" },
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          created_at: true,
          users: { select: { id: true, name: true, nickname: true } },
        },
      }),
    ]);

    // 통합 피드 아이템으로 변환 (각 타입별로 통일된 형태)
    type FeedItem = {
      type: "game_join" | "tournament_join" | "post";
      timestamp: string;
      actor: string;
      title: string;
      href: string;
      icon: string;
    };

    const feed: FeedItem[] = [];

    // 경기 참가 활동
    for (const app of gameApps) {
      feed.push({
        type: "game_join",
        timestamp: app.created_at?.toISOString() ?? new Date().toISOString(),
        actor: app.users?.nickname ?? app.users?.name ?? "익명",
        title: app.games?.title ?? "경기",
        href: `/games/${app.games?.id?.toString() ?? ""}`,
        icon: "sports_basketball",
      });
    }

    // 대회 참가 활동
    for (const tt of tournamentTeams) {
      feed.push({
        type: "tournament_join",
        timestamp: tt.createdAt?.toISOString() ?? new Date().toISOString(),
        actor: tt.team?.name ?? "팀",
        title: tt.tournament?.name ?? "대회",
        href: `/tournaments/${tt.tournament?.id ?? ""}`,
        icon: "emoji_events",
      });
    }

    // 커뮤니티 글 작성 활동
    for (const post of posts) {
      feed.push({
        type: "post",
        timestamp: post.created_at?.toISOString() ?? new Date().toISOString(),
        actor: post.users?.nickname ?? post.users?.name ?? "익명",
        title: post.title ?? "게시글",
        href: `/community/${post.id?.toString() ?? ""}`,
        icon: "forum",
      });
    }

    // 시간순 정렬 (최신 먼저) 후 5건만 반환
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return apiSuccess(feed.slice(0, 5));
  } catch (error) {
    console.error("[feed] error:", error);
    return apiError("피드 조회 중 오류가 발생했습니다.", 500);
  }
}
