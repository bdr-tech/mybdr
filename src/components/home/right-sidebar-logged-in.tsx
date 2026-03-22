"use client";

/* ============================================================
 * RightSidebarLoggedIn — 로그인 상태 우측 사이드바
 *
 * 왜 사이드바가 필요한가: 3열 레이아웃에서 우측에 보조 정보를 제공하여
 * 사용자가 주요 경기, 개인 통계, 랭킹, 커뮤니티를 한눈에 볼 수 있다.
 *
 * 위젯 4개:
 * 1. 오늘의 주요 경기 (네이비 카드)
 * 2. 나의 통계 (Wins/Rank 2열)
 * 3. 실시간 랭킹 (01/02/03 순위 리스트)
 * 4. 커뮤니티 (최신글 + 조회수 높은 글 + 대회 알림 받기)
 * ============================================================ */

export function RightSidebarLoggedIn() {
  return (
    <div className="space-y-8">
      {/* === 1. 오늘의 주요 경기 (네이비 배경) === */}
      <div className="bg-secondary rounded-xl p-6 relative overflow-hidden group border border-border">
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-2">오늘의 주요 경기</h3>
          <p className="text-blue-100 text-sm opacity-80 mb-4">
            리그 전체 일정을 확인하고 참가하세요.
          </p>
          <button className="text-white border border-white/30 hover:bg-white/10 px-4 py-2 rounded text-sm transition-all">
            전체보기
          </button>
        </div>
        {/* 배경 장식 */}
        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/10 rotate-12">
          sports_basketball
        </span>
      </div>

      {/* === 2. 나의 통계 === */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h4 className="text-sm font-bold text-text-primary mb-6 flex items-center justify-between uppercase tracking-wider">
          나의 통계
          <span className="material-symbols-outlined text-text-muted text-sm">insights</span>
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-5 rounded-lg border border-border">
            <div className="text-[10px] text-text-muted uppercase mb-1 font-bold">Wins</div>
            <div className="text-2xl font-bold text-text-primary">42</div>
          </div>
          <div className="bg-card p-5 rounded-lg border border-border">
            <div className="text-[10px] text-text-muted uppercase mb-1 font-bold">Rank</div>
            <div className="text-2xl font-bold text-primary">Gold I</div>
          </div>
        </div>
      </div>

      {/* === 3. 실시간 랭킹 === */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            실시간 랭킹
          </span>
          <span className="material-symbols-outlined text-text-muted text-sm">leaderboard</span>
        </div>
        <div className="space-y-3">
          {/* 1등: 강조 배경 */}
          <div className="flex items-center justify-between p-2.5 bg-card/40 rounded border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary">01</span>
              <span className="text-xs font-bold text-text-primary">서울 다이내믹스</span>
            </div>
            <span className="text-[10px] text-text-muted">1,420 pts</span>
          </div>
          {/* 2등 */}
          <div className="flex items-center justify-between p-2.5 bg-transparent rounded border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-muted">02</span>
              <span className="text-xs font-medium text-text-secondary">블랙 타이거즈</span>
            </div>
            <span className="text-[10px] text-text-muted">1,385 pts</span>
          </div>
          {/* 3등 */}
          <div className="flex items-center justify-between p-2.5 bg-transparent rounded border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-muted">03</span>
              <span className="text-xs font-medium text-text-secondary">Storm FC</span>
            </div>
            <span className="text-[10px] text-text-muted">1,254 pts</span>
          </div>
        </div>
      </div>

      {/* === 4. 커뮤니티 === */}
      <div className="bg-surface rounded-xl border border-border flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-border">
          <h4 className="text-sm font-bold text-text-primary flex items-center justify-between">
            커뮤니티
            <span className="material-symbols-outlined text-text-muted text-lg">forum</span>
          </h4>
        </div>

        {/* 본문: 최신글 + 조회수 높은 글 */}
        <div className="p-6 space-y-10">
          {/* 최신글 */}
          <div>
            <h5 className="text-[10px] font-bold text-primary uppercase mb-4 tracking-wider">
              최신글
            </h5>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group cursor-pointer">
                <span className="w-1.5 h-1.5 bg-elevated rounded-full mt-1.5 group-hover:bg-primary shrink-0" />
                <p className="text-xs text-text-secondary group-hover:text-text-primary leading-relaxed">
                  이번 윈터 챌린지 룰 변경사항 있나요?
                </p>
              </li>
              <li className="flex items-start gap-3 group cursor-pointer">
                <span className="w-1.5 h-1.5 bg-elevated rounded-full mt-1.5 group-hover:bg-primary shrink-0" />
                <p className="text-xs text-text-secondary group-hover:text-text-primary leading-relaxed">
                  Storm FC 팀원 모집합니다 (수비수)
                </p>
              </li>
              <li className="flex items-start gap-3 group cursor-pointer">
                <span className="w-1.5 h-1.5 bg-elevated rounded-full mt-1.5 group-hover:bg-primary shrink-0" />
                <p className="text-xs text-text-secondary group-hover:text-text-primary leading-relaxed">
                  신규 업데이트 패치노트 요약
                </p>
              </li>
            </ul>
          </div>

          {/* 조회수 높은 글 */}
          <div>
            <h5 className="text-[10px] font-bold text-secondary uppercase mb-4 tracking-wider">
              조회수 높은 글
            </h5>
            <ul className="space-y-4">
              <li className="flex flex-col gap-1 group cursor-pointer">
                <p className="text-xs text-text-secondary group-hover:text-text-primary line-clamp-1">
                  11월 랭킹 보상 공지 확인하세요
                </p>
                <span className="text-[10px] text-text-muted">1.2k views</span>
              </li>
              <li className="flex flex-col gap-1 group cursor-pointer">
                <p className="text-xs text-text-secondary group-hover:text-text-primary line-clamp-1">
                  초보자를 위한 경기 운영 팁 5가지
                </p>
                <span className="text-[10px] text-text-muted">850 views</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단: 대회 알림 받기 (네이비 배경) */}
        <div className="p-6 bg-secondary text-white rounded-b-xl">
          <p className="text-xs font-bold mb-3">대회 알림 받기</p>
          <button className="w-full bg-white text-secondary py-2.5 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors">
            알림 설정
          </button>
        </div>
      </div>
    </div>
  );
}
