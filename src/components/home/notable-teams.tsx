"use client";

/* ============================================================
 * NotableTeams — 주목할만한 팀 섹션
 *
 * 왜 이 컴포넌트가 필요한가: 새 디자인에 팀 소개 섹션이 추가되었다.
 * 사용자가 활발한 팀을 발견하고 관심을 가질 수 있도록 한다.
 *
 * 구조:
 * - 파란 세로 막대(tertiary) + "주목할만한 팀" + 필터 버튼
 * - 모바일: 가로 스크롤 / 데스크탑: 4열 그리드
 * - 팀 카드: 아이콘 + 팀명 + 포인트
 * ============================================================ */

/* 더미 데이터: 나중에 API 연결 예정 */
const TEAMS = [
  { name: "Storm FC", points: 1254, icon: "shield", color: "text-primary" },
  { name: "Red Eagles", points: 1182, icon: "military_tech", color: "text-secondary" },
  { name: "Ace One", points: 1045, icon: "rocket", color: "text-tertiary" },
  { name: "Neon Pulse", points: 980, icon: "token", color: "text-text-primary" },
];

export function NotableTeams() {
  return (
    <section>
      {/* 섹션 헤더: 파란 세로 막대 + 제목 + 필터 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-3">
          {/* 파란 세로 막대 */}
          <span className="w-1.5 h-6 bg-tertiary" />
          주목할만한 팀
        </h3>
        <button className="bg-card hover:bg-elevated text-text-primary p-2 rounded transition-colors">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </div>

      {/* 반응형 레이아웃: 모바일 가로 스크롤 / 데스크탑 4열 그리드 */}
      <div className="flex flex-row overflow-x-auto gap-4 no-scrollbar -mx-6 px-6 md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
        {TEAMS.map((team) => (
          <div
            key={team.name}
            className="min-w-[140px] md:min-w-0 bg-surface p-6 rounded-lg text-center border border-border hover:translate-y-[-4px] transition-transform cursor-pointer"
          >
            {/* 팀 아이콘 */}
            <div className="w-16 h-16 bg-card rounded-lg mx-auto mb-4 flex items-center justify-center border border-border">
              <span className={`material-symbols-outlined text-3xl ${team.color}`}>
                {team.icon}
              </span>
            </div>
            {/* 팀명 */}
            <div className="font-bold text-text-primary mb-1">{team.name}</div>
            {/* 포인트 */}
            <div className="text-[10px] text-text-muted">{team.points} Points</div>
          </div>
        ))}
      </div>
    </section>
  );
}
