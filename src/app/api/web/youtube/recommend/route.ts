import { NextResponse } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

// BDR 채널 업로드 재생목록 ID
// channelId UC... → uploads playlist "UU" + channelId.slice(2)
const UPLOADS_PLAYLIST_ID = process.env.BDR_YOUTUBE_UPLOADS_PLAYLIST_ID ?? "";

// 캐시: 기본 30분, 라이브가 있으면 5분으로 단축
let cachedResult: EnrichedVideo[] = [];
let cacheTimestamp = 0;
let cacheTTL = 30 * 60 * 1000; // 기본 30분

// BDR 디비전 키워드 목록 (제목/설명에서 매칭용)
const DIVISION_KEYWORDS = [
  "스타터스", "비기너", "챌린저", "마스터스",
  "프로", "엘리트", "오픈",
  "starters", "beginner", "challenger", "masters",
  "pro", "elite", "open",
];

// HOT 판단 기준: 게시 경과일 대비 조회수 임계값
const HOT_THRESHOLDS = [
  { maxDays: 1, minViews: 1000 },   // 24시간 이내 1000뷰 이상
  { maxDays: 3, minViews: 5000 },   // 3일 이내 5000뷰 이상
  { maxDays: 7, minViews: 10000 },  // 7일 이내 10000뷰 이상
];

// --- 타입 정의 ---

interface PlaylistItem {
  snippet: {
    resourceId: { videoId: string };
    title: string;
    description: string;
    thumbnails: { high?: { url: string }; medium?: { url: string } };
    publishedAt: string;
  };
}

interface VideoDetailsItem {
  id: string;
  snippet: {
    liveBroadcastContent: "live" | "upcoming" | "none";
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
    scheduledStartTime?: string;
    activeLiveChatId?: string;
  };
  statistics: {
    viewCount: string;
  };
}

// playlistItems + videos API를 합친 풍부한 영상 정보
interface EnrichedVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  liveBroadcastContent: "live" | "upcoming" | "none";
  viewCount: number;
}

interface ScoredVideo {
  video: EnrichedVideo;
  score: number;
  badges: string[];
  isLive: boolean;
}

// --- YouTube API 호출 ---

// 1단계: playlistItems API로 채널 최근 영상 ID 목록 가져오기
async function fetchPlaylistItems(apiKey: string): Promise<PlaylistItem[]> {
  if (!UPLOADS_PLAYLIST_ID) {
    console.error("[youtube] BDR_YOUTUBE_UPLOADS_PLAYLIST_ID not configured");
    return [];
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST_ID}&maxResults=50&key=${apiKey}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) {
    console.error("[youtube] PlaylistItems fetch failed:", res.status);
    return [];
  }
  const data = await res.json();
  return data.items ?? [];
}

// 2단계: videos API로 라이브/통계 상세 정보 가져오기
// videoId 목록을 쉼표로 묶어서 한 번에 요청 (API 쿼터 절약)
async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string
): Promise<VideoDetailsItem[]> {
  if (videoIds.length === 0) return [];

  const ids = videoIds.join(",");
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${ids}&key=${apiKey}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) {
    console.error("[youtube] Videos API fetch failed:", res.status);
    return [];
  }
  const data = await res.json();
  return data.items ?? [];
}

// playlistItems + videos API 결과를 합쳐서 EnrichedVideo 배열 생성
async function fetchEnrichedVideos(apiKey: string): Promise<EnrichedVideo[]> {
  // 캐시가 유효하면 재사용
  if (cachedResult.length > 0 && Date.now() - cacheTimestamp < cacheTTL) {
    return cachedResult;
  }

  // 1단계: 재생목록에서 영상 기본 정보 가져오기
  const items = await fetchPlaylistItems(apiKey);
  if (items.length === 0) return [];

  // 2단계: videoId 목록으로 상세 정보 일괄 조회
  const videoIds = items.map((item) => item.snippet.resourceId.videoId);
  const details = await fetchVideoDetails(videoIds, apiKey);

  // videoId를 key로 하는 상세정보 맵 생성 (O(1) 조회용)
  const detailMap = new Map<string, VideoDetailsItem>();
  for (const d of details) {
    detailMap.set(d.id, d);
  }

  // 두 API 결과를 합침 (upcoming은 완전히 제외)
  const enriched: EnrichedVideo[] = [];
  for (const item of items) {
    const vid = item.snippet.resourceId.videoId;
    const detail = detailMap.get(vid);
    const broadcastStatus = detail?.snippet?.liveBroadcastContent ?? "none";

    // 예정 스트리밍(upcoming)은 아직 볼 수 없으므로 제외
    if (broadcastStatus === "upcoming") continue;

    enriched.push({
      videoId: vid,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.medium?.url ??
        "",
      publishedAt: item.snippet.publishedAt,
      liveBroadcastContent: broadcastStatus,
      viewCount: parseInt(detail?.statistics?.viewCount ?? "0", 10),
    });
  }

  // 라이브 영상이 있으면 캐시를 5분으로 단축, 없으면 30분
  const hasLive = enriched.some((v) => v.liveBroadcastContent === "live");
  cacheTTL = hasLive ? 5 * 60 * 1000 : 30 * 60 * 1000;

  cachedResult = enriched;
  cacheTimestamp = Date.now();
  return enriched;
}

// --- 점수 시스템 ---

// HOT 여부 판단: 게시일 대비 조회수가 급증했는지 확인
function isHotVideo(publishedAt: string, viewCount: number): boolean {
  const now = Date.now();
  const published = new Date(publishedAt).getTime();
  const daysSincePublish = (now - published) / (1000 * 60 * 60 * 24);

  for (const threshold of HOT_THRESHOLDS) {
    if (daysSincePublish <= threshold.maxDays && viewCount >= threshold.minViews) {
      return true;
    }
  }
  return false;
}

// 영상 제목/설명에서 BDR 디비전명 매칭
function matchDivision(title: string, description: string): string | null {
  const content = `${title} ${description}`.toLowerCase();
  for (const keyword of DIVISION_KEYWORDS) {
    if (content.includes(keyword.toLowerCase())) {
      // 한글 디비전명을 우선 반환 (영어 키워드가 매칭되면 한글명으로 변환)
      const koreanMap: Record<string, string> = {
        starters: "스타터스",
        beginner: "비기너",
        challenger: "챌린저",
        masters: "마스터스",
        pro: "프로",
        elite: "엘리트",
        open: "오픈",
      };
      return koreanMap[keyword.toLowerCase()] ?? keyword;
    }
  }
  return null;
}

// 전면 개편된 점수 시스템
// 우선순위: LIVE(+100) > 디비전매칭(+20) > HOT(+10) > 지역+포지션(+5)
function scoreVideos(
  videos: EnrichedVideo[],
  userCity: string | null,
  userPosition: string | null
): ScoredVideo[] {
  const cityKeyword = userCity?.toLowerCase() ?? "";

  // 포지션 관련 키워드 매핑
  const positionKeywords: Record<string, string[]> = {
    가드: ["가드", "guard", "pg", "sg", "드리블", "패스"],
    포워드: ["포워드", "forward", "sf", "pf", "슛", "미드레인지"],
    센터: ["센터", "center", "리바운드", "블록", "포스트"],
  };

  // 유저 포지션에 해당하는 키워드 목록 (다중 포지션 지원: "가드,포워드")
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

  return videos.map((v) => {
    let score = 0;
    const badges: string[] = [];
    const content = `${v.title} ${v.description}`.toLowerCase();

    // 1순위: 현재 라이브 스트리밍 중 (+100)
    const isLive = v.liveBroadcastContent === "live";
    if (isLive) {
      score += 100;
      badges.push("LIVE");
    }

    // 2순위: 선호 디비전 매칭 (+20)
    const division = matchDivision(v.title, v.description);
    if (division) {
      score += 20;
      badges.push(division);
    }

    // 3순위: 조회수 급증 HOT (+10)
    if (isHotVideo(v.publishedAt, v.viewCount)) {
      score += 10;
      badges.push("HOT");
    }

    // 4순위: 지역 + 포지션 키워드 매칭 (+5)
    const cityMatch = cityKeyword && content.includes(cityKeyword);
    const posMatch =
      myPosKeywords.length > 0 &&
      myPosKeywords.some((kw) => content.includes(kw));
    if (cityMatch || posMatch) {
      score += 5;
      badges.push("맞춤");
    }

    return { video: v, score, badges, isLive };
  });
}

// --- API 핸들러 ---

export async function GET() {
  const youtubeKey = process.env.YOUTUBE_API_KEY;

  if (!youtubeKey) {
    return NextResponse.json(
      { error: "YouTube API not configured" },
      { status: 503 }
    );
  }

  try {
    const videos = await fetchEnrichedVideos(youtubeKey);
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

    // API 응답: badges 배열, is_live 포함
    const result = scored.slice(0, 5).map((s) => ({
      video_id: s.video.videoId,
      title: s.video.title,
      thumbnail: s.video.thumbnail,
      published_at: s.video.publishedAt,
      badges: s.badges,
      is_live: s.isLive,
    }));

    return NextResponse.json({ videos: result });
  } catch (err) {
    console.error("[youtube] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
