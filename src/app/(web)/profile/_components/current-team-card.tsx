import Link from "next/link";

/**
 * CurrentTeamCard - 현재 소속 팀 카드
 *
 * 디자인 시안(bdr_1): CURRENT TEAM 카드 1개
 * - 팀 이니셜 원형 + 팀명 + "팀 상세 정보" 버튼
 * - 팀이 없으면 팀 가입 유도 메시지
 */

interface Team {
  id: string;
  name: string;
  role: string;
}

interface CurrentTeamCardProps {
  teams: Team[];
}

export function CurrentTeamCard({ teams }: CurrentTeamCardProps) {
  // 첫 번째 팀을 메인 팀으로 표시
  const mainTeam = teams[0];

  return (
    <div
      className="rounded-md border p-5 flex flex-col items-center justify-center text-center h-full"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div
        className="text-xs font-bold tracking-widest uppercase mb-5"
        style={{ color: "var(--color-text-muted)" }}
      >
        Current Team
      </div>

      {mainTeam ? (
        <>
          {/* 팀 이니셜 원형 */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border-4 mb-3 text-2xl font-bold"
            style={{
              borderColor: "rgba(27, 60, 135, 0.2)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-accent)",
            }}
          >
            {mainTeam.name.charAt(0)}
          </div>
          {/* 팀 이름 */}
          <h4
            className="text-lg font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            {mainTeam.name}
          </h4>
          {/* 역할 표시 */}
          <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
            {mainTeam.role === "captain" ? "주장" : "멤버"}
          </p>
          {/* CTA 버튼 */}
          <Link
            href={`/teams/${mainTeam.id}`}
            className="w-full py-2.5 rounded text-center text-xs font-bold transition-all hover:opacity-90"
            // accent 배경은 테마 반응형이므로 글씨도 on-accent로 자동 전환
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-on-accent)" }}
          >
            팀 상세 정보
          </Link>
        </>
      ) : (
        /* 팀 없는 경우 */
        <>
          <span
            className="material-symbols-outlined text-4xl mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            group_off
          </span>
          <p className="text-sm mb-1" style={{ color: "var(--color-text-primary)" }}>
            소속 팀이 없습니다
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            팀에 가입하여 함께 경기하세요
          </p>
          <Link
            href="/teams"
            className="w-full py-2.5 rounded text-center text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            팀 찾기
          </Link>
        </>
      )}
    </div>
  );
}
