import { NextResponse } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

// BDR 채널 업로드 재생목록 ID
// channelId UC... → uploads playlist "UU" + channelId.slice(2)
const UPLOADS_PLAYLIST_ID = process.env.BDR_YOUTUBE_UPLOADS_PLAYLIST_ID ?? "";

// 캐시: 30분 유지 (YouTube API 쿼터 절약)
let cachedVideos: YouTubeVideo[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000;

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

interface ScoredVideo {
  video: YouTubeVideo;
  score: number;
  reason: string;
}

// YouTube playlistItems API로 채널 최근 영상 가져오기
async function fetchChannelVideos(apiKey: string): Promise<YouTubeVideo[]> {
  if (cachedVideos.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedVideos;
  }

  if (!UPLOADS_PLAYLIST_ID) {
    console.error("[youtube] BDR_YOUTUBE_UPLOADS_PLAYLIST_ID not configured");
    return [];
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST_ID}&maxResults=15&key=${apiKey}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) {
    console.error("[youtube] PlaylistItems fetch failed:", res.status);
    return [];
  }
  const data = await res.json();

  const videos: YouTubeVideo[] = (data.items ?? []).map(
    (item: { snippet: { resourceId: { videoId: string }; title: string; description: string; thumbnails: { high?: { url: string }; medium?: { url: string } }; publishedAt: string } }) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.medium?.url ?? "",
      publishedAt: item.snippet.publishedAt,
    })
  );

  cachedVideos = videos;
  cacheTimestamp = Date.now();
  return videos;
}

// 키워드 기반 점수 매칭 (Gemini 대체 — 0ms, 비용 0)
function scoreVideos(
  videos: YouTubeVideo[],
  userCity: string | null,
  userPosition: string | null
): ScoredVideo[] {
  const text = (v: YouTubeVideo) =>
    `${v.title} ${v.description}`.toLowerCase();

  // 지역명 키워드 (시/도 단위)
  const cityKeyword = userCity?.toLowerCase() ?? "";

  // 포지션 관련 키워드 매핑
  const positionKeywords: Record<string, string[]> = {
    가드: ["가드", "guard", "pg", "sg", "드리블", "패스"],
    포워드: ["포워드", "forward", "sf", "pf", "슛", "미드레인지"],
    센터: ["센터", "center", "리바운드", "블록", "포스트"],
  };

  // 유저 포지션에 해당하는 키워드 (다중 포지션 지원: "가드,포워드")
  const myPosKeywords: string[] = [];
  if (userPosition) {
    for (const pos of userPosition.split(",")) {
      const trimmed = pos.trim();
      for (const [key, keywords] of Object.entries(positionKeywords)) {
        if (trimmed.includes(key)) {
          myPosKeywords.push(...keywords);
        }
      }
    }
  }

  return videos.map((v, idx) => {
    let score = 0;
    let reason = "최신 영상";
    const content = text(v);

    // 최신순 가산점 (index 0 = 가장 최신)
    score += Math.max(0, 10 - idx);

    // 지역 매칭
    if (cityKeyword && content.includes(cityKeyword)) {
      score += 5;
      reason = "내 지역 관련";
    }

    // 포지션 매칭
    if (myPosKeywords.length > 0) {
      const matched = myPosKeywords.some((kw) => content.includes(kw));
      if (matched) {
        score += 3;
        reason = reason === "최신 영상" ? "포지션 관련" : reason;
      }
    }

    // 하이라이트/대회 영상 가산점 (인기 콘텐츠)
    if (/하이라이트|highlight|대회|결승|챔피언/.test(content)) {
      score += 2;
      if (reason === "최신 영상") reason = "하이라이트";
    }

    return { video: v, score, reason };
  });
}

export async function GET() {
  const youtubeKey = process.env.YOUTUBE_API_KEY;

  if (!youtubeKey) {
    return NextResponse.json({ error: "YouTube API not configured" }, { status: 503 });
  }

  try {
    const videos = await fetchChannelVideos(youtubeKey);
    if (videos.length === 0) {
      return NextResponse.json({ videos: [] });
    }

    // 유저 정보로 키워드 매칭 (로그인 시)
    const session = await getWebSession();
    let userCity: string | null = null;
    let userPosition: string | null = null;

    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: BigInt(session.sub) },
        select: { city: true, position: true },
      });
      userCity = user?.city ?? null;
      userPosition = user?.position ?? null;
    }

    const scored = scoreVideos(videos, userCity, userPosition);
    scored.sort((a, b) => b.score - a.score);

    const result = scored.slice(0, 5).map((s) => ({
      video_id: s.video.videoId,
      title: s.video.title,
      thumbnail: s.video.thumbnail,
      published_at: s.video.publishedAt,
      reason: s.reason,
    }));

    return NextResponse.json({ videos: result });
  } catch (err) {
    console.error("[youtube] Error:", err);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
