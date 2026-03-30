"use client";

/**
 * 세션 완료 카드 (체크아웃 후 팝업)
 *
 * 체크아웃 성공 시 표시되는 세션 요약 카드.
 * 운동 시간, 획득 XP, 레벨, 스트릭, 새 뱃지를 보여준다.
 * 닫기 버튼으로 사라진다.
 */

interface SessionCompleteCardProps {
  durationMinutes: number;
  xpEarned: number;
  gamification: {
    total_xp: number;
    level: number;
    title: string;
    leveled_up: boolean;
    level_up_badge: string | null;
    streak: number;
    streak_bonus: boolean;
    streak_bonus_xp: number;
    new_court_badges: string[];
    court_count: number;
  };
  onClose: () => void;
}

export function SessionCompleteCard({
  durationMinutes,
  xpEarned,
  gamification,
  onClose,
}: SessionCompleteCardProps) {
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;

  return (
    // 오버레이 배경
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{
          backgroundColor: "var(--color-card)",
          boxShadow: "var(--shadow-card)",
        }}
        onClick={(e) => e.stopPropagation()} // 카드 클릭 시 닫히지 않도록
      >
        {/* 상단: 운동 완료 헤더 */}
        <div className="text-center">
          <span
            className="material-symbols-outlined text-4xl mb-2 block"
            style={{ color: "var(--color-primary)" }}
          >
            sports_score
          </span>
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            농구 끝!
          </h3>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {durationText} 동안 운동했어요
          </p>
        </div>

        {/* XP 획득 */}
        <div
          className="rounded-xl p-4 text-center"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
          }}
        >
          <p
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            +{xpEarned} XP
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            총 {gamification.total_xp.toLocaleString()} XP · Lv.{gamification.level} {gamification.title}
          </p>
        </div>

        {/* 레벨업 알림 */}
        {gamification.leveled_up && (
          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
            }}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: "var(--color-accent)" }}
            >
              celebration
            </span>
            <p
              className="text-sm font-bold mt-1"
              style={{ color: "var(--color-accent)" }}
            >
              레벨 업! Lv.{gamification.level} {gamification.title}
            </p>
          </div>
        )}

        {/* 스트릭 */}
        {gamification.streak > 0 && (
          <div className="flex items-center gap-2 justify-center">
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--color-accent)", fontSize: "20px" }}
            >
              local_fire_department
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              {gamification.streak}일 연속 출석!
            </span>
            {gamification.streak_bonus && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "#FFFFFF",
                }}
              >
                +{gamification.streak_bonus_xp} XP
              </span>
            )}
          </div>
        )}

        {/* 새 뱃지 */}
        {gamification.new_court_badges.length > 0 && (
          <div className="text-center">
            <p className="text-xs font-bold mb-1" style={{ color: "var(--color-info)" }}>
              새 뱃지 획득!
            </p>
            {gamification.new_court_badges.map((badge, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full mx-1"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-info) 15%, transparent)",
                  color: "var(--color-info)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  explore
                </span>
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full rounded-[4px] py-3 text-sm font-bold text-white transition-all active:scale-95"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
