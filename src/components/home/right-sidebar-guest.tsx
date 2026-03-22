"use client";

/* ============================================================
 * RightSidebarGuest — 비로그인 상태 우측 사이드바
 *
 * 왜 별도 컴포넌트인가: 비로그인 사용자에게는 가입 유도(CTA)와
 * 서비스 소개를 보여줘야 하므로 로그인 사이드바와 구성이 다르다.
 *
 * 위젯 6개:
 * 1. "지금 바로 시작하세요" CTA (네이비)
 * 2. SERVICE FEATURE (실시간 데이터 분석)
 * 3. 오늘의 주요 경기 (네이비 카드)
 * 4. "BDR과 함께 성장하세요" (통계 + 가입 버튼)
 * 5. 실시간 랭킹
 * 6. 커뮤니티 미리보기
 * ============================================================ */

export function RightSidebarGuest() {
  return (
    <div className="space-y-8">
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
          <button className="text-white border border-white/30 hover:bg-white/10 px-4 py-2 rounded text-sm transition-all">
            전체보기
          </button>
        </div>
        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/10 rotate-12">
          schedule
        </span>
      </div>

      {/* === 4. BDR과 함께 성장하세요 (통계 + 가입) === */}
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
        {/* 통계 2열 */}
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

      {/* === 5. 실시간 랭킹 === */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            실시간 랭킹
          </span>
          <span className="material-symbols-outlined text-text-muted text-sm">leaderboard</span>
        </div>
        <div className="space-y-3">
          {/* 1등 강조 */}
          <div className="flex items-center justify-between p-2.5 bg-card/40 rounded border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary">01</span>
              <span className="text-xs font-bold text-text-primary">서울 다이내믹스</span>
            </div>
            <span className="text-[10px] text-text-muted">1,420 pts</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-transparent rounded border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-muted">02</span>
              <span className="text-xs font-medium text-text-secondary">블랙 타이거즈</span>
            </div>
            <span className="text-[10px] text-text-muted">1,385 pts</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-transparent rounded border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-muted">03</span>
              <span className="text-xs font-medium text-text-secondary">Storm FC</span>
            </div>
            <span className="text-[10px] text-text-muted">1,254 pts</span>
          </div>
        </div>
      </div>

      {/* === 6. 커뮤니티 미리보기 === */}
      <div className="bg-surface rounded-xl border border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h4 className="text-sm font-bold text-text-primary flex items-center justify-between">
            커뮤니티 미리보기
            <span className="material-symbols-outlined text-text-muted text-lg">forum</span>
          </h4>
        </div>
        <div className="p-6 space-y-8">
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
            </ul>
          </div>
        </div>
        {/* 하단: 커뮤니티 이동 (네이비) */}
        <div className="p-6 bg-secondary text-white rounded-b-xl">
          <p className="text-xs font-bold mb-3">전체 게시판 방문하기</p>
          <button className="w-full bg-white text-secondary py-2.5 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors">
            커뮤니티 이동
          </button>
        </div>
      </div>
    </div>
  );
}
