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

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ---------- 타입 정의 ---------- */

// /api/web/profile/stats 응답에서 사용하는 필드
interface ProfileStats {
  careerAverages: {
    gamesPlayed: number;
  } | null;
}

// /api/web/teams 응답의 팀 하나
interface TeamData {
  id: string;
  name: string;
  wins: number;
}

// /api/web/community 응답의 게시글 하나
interface PostData {
  id: string;
  publicId: string | null;
  title: string;
  viewCount: number;
  createdAt: string | null;
}

/* ---------- 경기수 기반 티어 계산 ---------- */
// 프로필 페이지(profile-header.tsx)와 동일한 로직
// DB에 별도 랭크 시스템이 없으므로 총 경기수로 임시 티어 부여
function getTier(gamesPlayed: number): { label: string; color: string } {
  if (gamesPlayed >= 200) return { label: "Diamond", color: "var(--color-primary)" };
  if (gamesPlayed >= 100) return { label: "Platinum", color: "#A78BFA" };
  if (gamesPlayed >= 50) return { label: "Gold", color: "#F59E0B" };
  if (gamesPlayed >= 20) return { label: "Silver", color: "#94A3B8" };
  return { label: "Bronze", color: "#CD7F32" };
}

/* ---------- Fallback 데이터 (API 실패 시 표시) ---------- */
const FALLBACK_TEAMS: TeamData[] = [
  { id: "1", name: "서울 다이내믹스", wins: 42 },
  { id: "2", name: "블랙 타이거즈", wins: 38 },
  { id: "3", name: "Storm FC", wins: 31 },
];

const FALLBACK_RECENT_POSTS: PostData[] = [
  { id: "1", publicId: null, title: "이번 윈터 챌린지 룰 변경사항 있나요?", viewCount: 120, createdAt: null },
  { id: "2", publicId: null, title: "Storm FC 팀원 모집합니다 (수비수)", viewCount: 90, createdAt: null },
  { id: "3", publicId: null, title: "신규 업데이트 패치노트 요약", viewCount: 80, createdAt: null },
];

const FALLBACK_POPULAR_POSTS: PostData[] = [
  { id: "4", publicId: null, title: "11월 랭킹 보상 공지 확인하세요", viewCount: 1200, createdAt: null },
  { id: "5", publicId: null, title: "초보자를 위한 경기 운영 팁 5가지", viewCount: 850, createdAt: null },
];

export function RightSidebarLoggedIn() {
  // 나의 통계
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  // 실시간 랭킹 상위 3팀
  const [topTeams, setTopTeams] = useState<TeamData[]>(FALLBACK_TEAMS);
  // 커뮤니티: 최신글 3개 + 조회수 높은 글 2개
  const [recentPosts, setRecentPosts] = useState<PostData[]>(FALLBACK_RECENT_POSTS);
  const [popularPosts, setPopularPosts] = useState<PostData[]>(FALLBACK_POPULAR_POSTS);

  const [visible, setVisible] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const fetchAll = async () => {
      const results = await Promise.allSettled([
        fetch("/api/web/profile/stats").then((r) => r.json()),
        fetch("/api/web/teams?limit=5").then((r) => r.json()),
        fetch("/api/web/community?limit=5").then((r) => r.json()),
      ]);

      // 나의 통계 처리
      if (results[0].status === "fulfilled" && results[0].value?.data) {
        const stats = results[0].value.data as ProfileStats;
        if (stats.careerAverages) {
          setGamesPlayed(stats.careerAverages.gamesPlayed);
        }
      }

      // 팀 랭킹 처리 (상위 3팀만 slice)
      if (results[1].status === "fulfilled" && results[1].value?.data?.teams) {
        const teams = results[1].value.data.teams as TeamData[];
        if (teams.length > 0) {
          setTopTeams(teams.slice(0, 3));
        }
      }

      // 커뮤니티 처리: 최신글 3개 + 조회수 높은 글 2개
      if (results[2].status === "fulfilled" && results[2].value?.data?.posts) {
        const posts = results[2].value.data.posts as PostData[];
        if (posts.length > 0) {
          // 최신글: API가 이미 created_at DESC로 반환하므로 앞 3개
          setRecentPosts(posts.slice(0, 3));
          // 조회수 높은 글: 전체를 viewCount 내림차순 정렬 후 상위 2개
          const byViews = [...posts].sort((a, b) => b.viewCount - a.viewCount);
          setPopularPosts(byViews.slice(0, 2));
        }
      }
    };

    fetchAll();
  }, []);

  // 경기수 기반 티어 계산
  const tier = getTier(gamesPlayed);

  // 조회수를 사람이 읽기 좋은 형식으로 변환 (예: 1200 -> "1.2k")
  const formatViews = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // 게시글 상세 링크 생성
  const getPostLink = (post: PostData): string => {
    return `/community/${post.publicId || post.id}`;
  };

  return (
    <div ref={sidebarRef} className="space-y-8" style={{ fontSize: '120%' }}>
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
            <div className="text-[10px] text-text-muted uppercase mb-1 font-bold">Games</div>
            <div className="text-2xl font-bold text-text-primary">{gamesPlayed}</div>
          </div>
          {/* 경기수 기반 임시 티어를 Rank 자리에 표시 */}
          <div className="bg-card p-5 rounded-lg border border-border">
            <div className="text-[10px] text-text-muted uppercase mb-1 font-bold">Rank</div>
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
              <span className="text-[10px] text-text-muted">{team.wins}W</span>
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
                    <span className="text-xs text-text-muted">{formatViews(post.viewCount)} views</span>
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
