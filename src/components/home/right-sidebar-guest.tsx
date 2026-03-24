"use client";

/* ============================================================
 * RightSidebarGuest -- 비로그인 상태 우측 사이드바
 *
 * 왜 별도 컴포넌트인가: 비로그인 사용자에게는 가입 유도(CTA)와
 * 서비스 소개를 보여줘야 하므로 로그인 사이드바와 구성이 다르다.
 *
 * 위젯 6개:
 * 1. "지금 바로 시작하세요" CTA (네이비)
 * 2. SERVICE FEATURE (실시간 데이터 분석)
 * 3. 오늘의 주요 경기 (네이비 카드)
 * 4. "BDR과 함께 성장하세요" (통계 + 가입 버튼)
 * 5. 실시간 랭킹 -- /api/web/teams
 * 6. 커뮤니티 미리보기 -- /api/web/community
 * ============================================================ */

import { useState, useEffect } from "react";
import Link from "next/link";

/* ---------- 타입 정의 ---------- */

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

/* ---------- Fallback 데이터 (API 실패 시 표시) ---------- */
const FALLBACK_TEAMS: TeamData[] = [
  { id: "1", name: "서울 다이내믹스", wins: 42 },
  { id: "2", name: "블랙 타이거즈", wins: 38 },
  { id: "3", name: "Storm FC", wins: 31 },
];

const FALLBACK_POSTS: PostData[] = [
  { id: "1", publicId: null, title: "이번 윈터 챌린지 룰 변경사항 있나요?", viewCount: 120, createdAt: null },
  { id: "2", publicId: null, title: "Storm FC 팀원 모집합니다 (수비수)", viewCount: 90, createdAt: null },
];

export function RightSidebarGuest() {
  // 실시간 랭킹 상위 3팀
  const [topTeams, setTopTeams] = useState<TeamData[]>(FALLBACK_TEAMS);
  // 커뮤니티 최신글 2개
  const [recentPosts, setRecentPosts] = useState<PostData[]>(FALLBACK_POSTS);

  useEffect(() => {
    // 2개의 API를 병렬 호출하여 로딩 시간 최소화
    const fetchAll = async () => {
      const results = await Promise.allSettled([
        // 1) 팀 목록 (인증 불필요, wins DESC 정렬)
        fetch("/api/web/teams").then((r) => r.json()),
        // 2) 커뮤니티 게시글 (인증 불필요, created_at DESC)
        fetch("/api/web/community").then((r) => r.json()),
      ]);

      // 팀 랭킹: 상위 3팀만 사용
      if (results[0].status === "fulfilled" && results[0].value?.data?.teams) {
        const teams = results[0].value.data.teams as TeamData[];
        if (teams.length > 0) {
          setTopTeams(teams.slice(0, 3));
        }
      }

      // 커뮤니티: 최신글 2개만 사용
      if (results[1].status === "fulfilled" && results[1].value?.data?.posts) {
        const posts = results[1].value.data.posts as PostData[];
        if (posts.length > 0) {
          setRecentPosts(posts.slice(0, 2));
        }
      }
    };

    fetchAll();
  }, []);

  // 게시글 상세 링크 생성
  const getPostLink = (post: PostData): string => {
    return `/community/${post.publicId || post.id}`;
  };

  return (
    <div className="space-y-8" style={{ fontSize: '120%' }}>
      {/* === 1. 가입 유도 CTA (네이비 배경) === */}
      <div className="bg-secondary rounded-xl p-8 relative overflow-hidden group border border-border">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-3">
            지금 바로 시작하세요
          </h3>
          <p className="text-blue-100 text-sm opacity-80 mb-6 leading-relaxed">
            전국의 농구 동호인들과 매칭하고,
            <br />
            나만의 커리어를 쌓아보세요.
          </p>
          <button className="bg-white text-secondary font-bold px-6 py-2.5 rounded text-sm hover:bg-blue-50 transition-all active:scale-95 shadow-lg">
            무료로 시작하기
          </button>
        </div>
        {/* 배경 장식 */}
        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/10 rotate-12">
          sports_basketball
        </span>
      </div>

      {/* === 2. SERVICE FEATURE === */}
      <div className="bg-gradient-to-br from-surface to-card rounded-xl p-8 border border-border">
        <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
          Service Feature
        </h4>
        <p className="text-text-primary font-bold text-lg mb-2">
          실시간 데이터 분석
        </p>
        <p className="text-text-muted text-xs leading-relaxed mb-4">
          모든 경기의 기록이 체계적으로 관리되어 프로 선수 같은 통계를 제공합니다.
        </p>
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
          <div className="w-1.5 h-1.5 bg-elevated rounded-full" />
          <div className="w-1.5 h-1.5 bg-elevated rounded-full" />
        </div>
      </div>

      {/* === 3. 오늘의 주요 경기 (네이비 카드) === */}
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
        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/10 rotate-12">
          schedule
        </span>
      </div>

      {/* === 4. BDR과 함께 성장하세요 (통계 + 가입) === */}
      {/* TODO: "4,200개 팀", "12.5k+ 매치", "85.2k+ 선수"는 하드코딩 유지
          새 API(/api/web/stats)로 실제 count를 가져오는 작업은 별도 진행 예정 */}
      <div className="bg-surface rounded-xl p-8 border border-border flex flex-col items-center text-center">
        {/* 아이콘 */}
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">query_stats</span>
        </div>
        <h4 className="text-lg font-bold text-text-primary mb-2">
          BDR과 함께 성장하세요
        </h4>
        <p className="text-text-muted text-sm mb-6">
          현재까지 4,200개 이상의 팀이
          <br />
          BDR에서 실력을 증명하고 있습니다.
        </p>
        {/* 통계 2열 -- 하드코딩 유지 (TODO: /api/web/stats 연결) */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div className="bg-card p-3 rounded-lg border border-border">
            <div className="text-[10px] text-text-muted uppercase mb-1">등록 매치</div>
            <div className="text-lg font-bold text-text-primary">12.5k+</div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border">
            <div className="text-[10px] text-text-muted uppercase mb-1">활동 선수</div>
            <div className="text-lg font-bold text-text-primary">85.2k+</div>
          </div>
        </div>
        {/* 가입 버튼 */}
        <button className="w-full bg-primary text-on-primary py-3 rounded-lg text-sm font-bold hover:brightness-110 active:scale-95 transition-all">
          지금 가입하기
        </button>
      </div>

      {/* === 5. 실시간 랭킹 (API: /api/web/teams, wins 상위 3팀) === */}
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

      {/* === 6. 커뮤니티 미리보기 (API: /api/web/community, 최신글 2개) === */}
      <div className="bg-surface rounded-xl border border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h4 className="text-base font-bold text-text-primary flex items-center justify-between">
            커뮤니티 미리보기
            <span className="material-symbols-outlined text-text-muted text-xl">forum</span>
          </h4>
        </div>
        <div className="p-6 space-y-8">
          {/* 최신글 2개 */}
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
        </div>
        {/* 하단: 커뮤니티 이동 (네이비) */}
        <div className="p-6 bg-secondary text-white rounded-b-xl">
          <p className="text-sm font-bold mb-3">전체 게시판 방문하기</p>
          <Link href="/community" className="w-full bg-white text-secondary py-2.5 rounded-lg text-sm font-bold hover:bg-white/90 transition-colors block text-center">
            커뮤니티 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
