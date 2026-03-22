"use client";

/* ============================================================
 * HeroBento — 히어로 벤토 그리드
 * 좌측(col-span-2): LIVE NOW 비디오 플레이어 스타일 메인 배너
 * 우측(col-span-1): 오늘의 주요 경기 카드 + 나의 통계(로그인) / 서비스 소개(비로그인)
 *
 * 왜 벤토 그리드인가: 첫 화면에서 핵심 콘텐츠(라이브 경기)를 크게 보여주고,
 * 부가 정보를 작은 카드로 배치해 시각적 계층을 만든다.
 * ============================================================ */

/* 세션 정보: 서버에서 getWebSession()으로 받은 JwtPayload를 전달받는다 */
interface UserSession {
  sub: string;
  name: string;
  email: string;
  role: string;
}

interface HeroBentoProps {
  session: UserSession | null;
}

export function HeroBento({ session }: HeroBentoProps) {
  return (
    /* 3열 그리드: 메인 배너 2칸 + 사이드 카드 1칸 */
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

      {/* ===== 메인 배너: LIVE NOW 비디오 플레이어 스타일 ===== */}
      <div className="md:col-span-2 relative h-[420px] rounded-xl overflow-hidden bg-card group border border-border">
        {/* 배경 이미지 + 호버 시 확대 효과 */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            alt="2024 서울 챔피언십 결승"
            className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"
          />
          {/* play_circle 오버레이: 영상처럼 보이게 하는 장치 */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <span className="material-symbols-outlined text-white text-7xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              play_circle
            </span>
          </div>
        </div>

        {/* 하단 그라디언트: 텍스트가 잘 보이도록 어둡게 처리 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* 텍스트 오버레이 */}
        <div className="absolute bottom-0 left-0 p-8 w-full pointer-events-none">
          {/* LIVE NOW 뱃지 */}
          <span className="inline-block px-3 py-1 bg-primary text-on-primary text-[10px] font-bold tracking-widest uppercase rounded mb-4">
            LIVE NOW
          </span>
          {/* 제목: Space Grotesk 폰트 */}
          <h2 className="text-4xl font-heading font-bold text-white mb-2 leading-tight">
            2024 서울 챔피언십
            <br />
            결승 토너먼트
          </h2>
          <p className="text-text-secondary max-w-lg mb-6">
            현재 최고의 랭킹을 자랑하는 두 팀의 치열한 대결이 시작되었습니다.
            실시간 스코어를 확인하세요.
          </p>
          {/* CTA 버튼 */}
          <button className="bg-primary hover:bg-primary-hover text-on-primary px-6 py-3 rounded font-bold flex items-center gap-2 transition-colors active:scale-95 pointer-events-auto">
            실시간 중계 보기
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ===== 우측 사이드 카드 2개 세로 배치 ===== */}
      <div className="flex flex-col gap-6">
        {/* 카드 1: 오늘의 주요 경기 (네이비 배경) */}
        <div className="flex-1 bg-secondary rounded-xl p-6 relative overflow-hidden group border border-border min-h-[198px] flex flex-col justify-center">
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-2">오늘의 주요 경기</h3>
            <p className="text-blue-100 text-sm opacity-80 mb-4">
              리그 전체 일정을 확인하고 참가하세요.
            </p>
            <button className="text-white border border-white/30 hover:bg-white/10 px-4 py-2 rounded text-sm transition-all">
              전체보기
            </button>
          </div>
          {/* 배경 장식 아이콘 */}
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-white/10 rotate-12">
            sports_basketball
          </span>
        </div>

        {/* 카드 2: 로그인 시 → 나의 통계 / 비로그인 시 → 서비스 소개 */}
        {session ? (
          /* 로그인 상태: 나의 통계 카드 */
          <div className="flex-1 bg-surface rounded-xl p-6 border border-border flex flex-col justify-center min-h-[198px]">
            <h4 className="text-sm font-bold text-text-primary mb-6 flex items-center justify-between uppercase tracking-wider">
              나의 통계
              <span className="material-symbols-outlined text-text-muted text-sm">insights</span>
            </h4>
            {/* Wins / Rank 2열 그리드 */}
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
        ) : (
          /* 비로그인 상태: 서비스 소개 카드 */
          <div className="flex-1 bg-gradient-to-br from-surface to-card rounded-xl p-8 border border-border flex flex-col justify-center min-h-[198px]">
            <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Service Feature
            </h4>
            <p className="text-text-primary font-bold text-lg mb-2">
              실시간 데이터 분석
            </p>
            <p className="text-text-muted text-xs leading-relaxed mb-4">
              모든 경기의 기록이 체계적으로 관리되어 프로 선수 같은 통계를 제공합니다.
            </p>
            {/* 인디케이터 닷 */}
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <div className="w-1.5 h-1.5 bg-elevated rounded-full" />
              <div className="w-1.5 h-1.5 bg-elevated rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
