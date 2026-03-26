"use client";

/* ============================================================
 * RightSidebarLoggedIn -- 로그인 상태 우측 사이드바
 *
 * 왜 사이드바가 필요한가: 3열 레이아웃에서 우측에 보조 정보를 제공하여
 * 사용자가 주요 경기, 개인 통계, 랭킹, 커뮤니티를 한눈에 볼 수 있다.
 *
 * 위젯 4개:
 * 1. 오늘의 주요 경기 (네이비 카드)
 * 2. 나의 통계 (Wins/Rank 2열) -- /api/web/profile/stats
 * 3. 실시간 랭킹 (01/02/03 순위 리스트) -- /api/web/teams
 * 4. 커뮤니티 (최신글 + 조회수 높은 글) -- /api/web/community
 * ============================================================ */

import Link from "next/link";
import useSWR from "swr";

/* ---------- 타입 정의 ---------- */

// /api/web/teams 응답의 팀 하나
interface TeamData {
  id: string;
  name: string;
  wins: number;
}

// /api/web/community 응답의 게시글 하나 (apiSuccess가 snake_case로 변환)
interface PostData {
  id: string;
  public_id: string | null;
  title: string;
  view_count: number;
  created_at: string | null;
}

/* ---------- 경기수 기반 티어 계산 ---------- */
// 프로필 페이지(profile-header.tsx)와 동일한 로직
// DB에 별도 랭크 시스템이 없으므로 총 경기수로 임시 티어 부여
function getTier(gamesPlayed: number): { label: string; color: string } {
  if (gamesPlayed >= 200) return { label: "Diamond", color: "var(--color-primary)" };
  if (gamesPlayed >= 100) return { label: "Platinum", color: "var(--color-tier-platinum)" };
  if (gamesPlayed >= 50) return { label: "Gold", color: "var(--color-tier-gold)" };
  if (gamesPlayed >= 20) return { label: "Silver", color: "var(--color-tier-silver)" };
  return { label: "Bronze", color: "var(--color-tier-bronze)" };
}

/* ---------- Fallback 데이터 (API 실패 시 표시) ---------- */
const FALLBACK_TEAMS: TeamData[] = [
  { id: "1", name: "서울 다이내믹스", wins: 42 },
  { id: "2", name: "블랙 타이거즈", wins: 38 },
  { id: "3", name: "Storm FC", wins: 31 },
];

const FALLBACK_RECENT_POSTS: PostData[] = [
  { id: "1", public_id: null, title: "이번 윈터 챌린지 룰 변경사항 있나요?", view_count: 120, created_at: null },
  { id: "2", public_id: null, title: "Storm FC 팀원 모집합니다 (수비수)", view_count: 90, created_at: null },
  { id: "3", public_id: null, title: "신규 업데이트 패치노트 요약", view_count: 80, created_at: null },
];

const FALLBACK_POPULAR_POSTS: PostData[] = [
  { id: "4", public_id: null, title: "11월 랭킹 보상 공지 확인하세요", view_count: 1200, created_at: null },
  { id: "5", public_id: null, title: "초보자를 위한 경기 운영 팁 5가지", view_count: 850, created_at: null },
];

/* 서버에서 미리 가져온 데이터를 받을 수 있는 props (없으면 기존처럼 SWR이 API 호출) */
interface RightSidebarLoggedInProps {
  fallbackTeams?: { teams: TeamData[] };
  fallbackCommunity?: { posts: PostData[] };
}

export function RightSidebarLoggedIn({ fallbackTeams, fallbackCommunity }: RightSidebarLoggedInProps = {}) {
  // 3개의 독립 API를 각각 useSWR로 호출
  // fallbackData가 있으면 로딩 없이 즉시 표시, SWR이 뒤에서 최신 데이터 갱신
  // profile/stats는 개인 데이터라 프리페치 안 함 (기존 SWR 유지)
  const { data: profileData } = useSWR<{ career_averages: { games_played: number } | null }>(
    "/api/web/profile/stats"
  );
  const { data: teamsData } = useSWR<{ teams: TeamData[] }>("/api/web/teams", null, { fallbackData: fallbackTeams });
  const { data: communityData } = useSWR<{ posts: PostData[] }>("/api/web/community", null, { fallbackData: fallbackCommunity });

  // 나의 통계: career_averages.games_played (snake_case API 응답)
  const gamesPlayed = profileData?.career_averages?.games_played ?? 0;

  // 팀 랭킹: 상위 3팀 (API 데이터 없으면 fallback)
  const topTeams: TeamData[] = (() => {
    const teams = teamsData?.teams;
    return teams && teams.length > 0 ? teams.slice(0, 3) : FALLBACK_TEAMS;
  })();

  // 커뮤니티: 최신글 3개 + 조회수 높은 글 2개
  const recentPosts: PostData[] = (() => {
    const posts = communityData?.posts;
    return posts && posts.length > 0 ? posts.slice(0, 3) : FALLBACK_RECENT_POSTS;
  })();

  const popularPosts: PostData[] = (() => {
    const posts = communityData?.posts;
    if (!posts || posts.length === 0) return FALLBACK_POPULAR_POSTS;
    // 조회수 내림차순 정렬 후 상위 2개
    const byViews = [...posts].sort((a, b) => b.view_count - a.view_count);
    return byViews.slice(0, 2);
  })();

  // 경기수 기반 티어 계산
  const tier = getTier(gamesPlayed);

  // 조회수를 사람이 읽기 좋은 형식으로 변환 (예: 1200 -> "1.2k")
  const formatViews = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // 게시글 상세 링크 생성 (API 응답이 snake_case이므로 public_id로 접근)
  const getPostLink = (post: PostData): string => {
    return `/community/${post.public_id || post.id}`;
  };

  return (
    <div className="space-y-8" style={{ fontSize: '120%' }}>
      {/* === 1. 오늘의 주요 경기 (네이비 배경) === */}
      <div className="bg-secondary rounded-xl p-6 relative overflow-hidden group border border-border">
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-2">오늘의 주요 경기</h3>
          <p className="text-blue-100 text-sm opacity-80 mb-4">
            리그 전체 일정을 확인하고 참가하세요.
          </p>
          <Link href="/games" className="text-white border border-white/30 hover:bg-white/10 px-4 py-2 rounded text-sm transition-all inline-block">
            전체보기
          </Link>
        </div>
        {/* 배경 장식 */}
        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/10 rotate-12">
          sports_basketball
        </span>
      </div>

      {/* === 2. 나의 통계 (API: /api/web/profile/stats) === */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h4 className="text-sm font-bold text-text-primary mb-6 flex items-center justify-between uppercase tracking-wider">
          나의 통계
          <span className="material-symbols-outlined text-text-muted text-sm">insights</span>
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {/* 총 경기수를 Wins 자리에 표시 */}
          <div className="bg-card p-5 rounded-lg border border-border">
            <div className="text-xs text-text-muted uppercase mb-1 font-bold">Games</div>
            <div className="text-2xl font-bold text-text-primary">{gamesPlayed}</div>
          </div>
          {/* 경기수 기반 임시 티어를 Rank 자리에 표시 */}
          <div className="bg-card p-5 rounded-lg border border-border">
            <div className="text-xs text-text-muted uppercase mb-1 font-bold">Rank</div>
            <div className="text-2xl font-bold" style={{ color: tier.color }}>{tier.label}</div>
          </div>
        </div>
      </div>

      {/* === 3. 실시간 랭킹 (API: /api/web/teams, wins 상위 3팀) === */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            실시간 랭킹
          </span>
          <span className="material-symbols-outlined text-text-muted text-sm">leaderboard</span>
        </div>
        <div className="space-y-3">
          {topTeams.map((team, idx) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className={`flex items-center justify-between p-2.5 rounded border border-border ${
                idx === 0 ? "bg-card/40" : "bg-transparent"
              } hover:bg-card/60 transition-colors`}
            >
              <div className="flex items-center gap-3">
                {/* 순위 번호: 1등만 primary 색상 강조 */}
                <span className={`text-xs ${idx === 0 ? "font-bold text-primary" : "font-medium text-text-muted"}`}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className={`text-xs ${idx === 0 ? "font-bold text-text-primary" : "font-medium text-text-secondary"}`}>
                  {team.name}
                </span>
              </div>
              {/* 승수 표시 */}
              <span className="text-xs text-text-muted">{team.wins}W</span>
            </Link>
          ))}
        </div>
      </div>

      {/* === 4. 커뮤니티 (API: /api/web/community) === */}
      <div className="bg-surface rounded-xl border border-border flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-border">
          <h4 className="text-base font-bold text-text-primary flex items-center justify-between">
            커뮤니티
            <span className="material-symbols-outlined text-text-muted text-xl">forum</span>
          </h4>
        </div>

        {/* 본문: 최신글 + 조회수 높은 글 */}
        <div className="p-6 space-y-10">
          {/* 최신글 3개 */}
          <div>
            <h5 className="text-xs font-bold text-primary uppercase mb-4 tracking-wider">
              최신글
            </h5>
            <ul className="space-y-4">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link href={getPostLink(post)} className="flex items-start gap-3 group cursor-pointer">
                    <span className="w-1.5 h-1.5 bg-elevated rounded-full mt-2 group-hover:bg-primary shrink-0" />
                    <p className="text-sm text-text-secondary group-hover:text-text-primary leading-relaxed line-clamp-1">
                      {post.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 조회수 높은 글 2개 */}
          <div>
            <h5 className="text-xs font-bold text-secondary uppercase mb-4 tracking-wider">
              조회수 높은 글
            </h5>
            <ul className="space-y-4">
              {popularPosts.map((post) => (
                <li key={post.id}>
                  <Link href={getPostLink(post)} className="flex flex-col gap-1 group cursor-pointer">
                    <p className="text-sm text-text-secondary group-hover:text-text-primary line-clamp-1">
                      {post.title}
                    </p>
                    <span className="text-xs text-text-muted">{formatViews(post.view_count)} views</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 하단: 대회 알림 받기 (네이비 배경) */}
        <div className="p-6 bg-secondary text-white rounded-b-xl">
          <p className="text-sm font-bold mb-3">대회 알림 받기</p>
          <button className="w-full bg-white text-secondary py-2.5 rounded-lg text-sm font-bold hover:bg-white/90 transition-colors">
            알림 설정
          </button>
        </div>
      </div>
    </div>
  );
}
