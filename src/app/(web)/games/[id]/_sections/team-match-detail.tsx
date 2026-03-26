import type { games } from "@prisma/client";

// 팀 대결 경기 상세: 시설 안내(Amenities) + 경기 규칙(Rules) 스타일
// 기존 테이블 형태 -> 디자인 시안 기반 카드 레이아웃으로 전환
// 데이터 로직 100% 유지, UI만 변경

interface TeamMatchDetailProps {
  game: Pick<
    games,
    | "scheduled_at"
    | "duration_hours"
    | "city"
    | "district"
    | "venue_name"
    | "venue_address"
    | "uniform_home_color"
    | "uniform_away_color"
    | "requirements"
    | "notes"
  >;
}

export function TeamMatchDetail({ game }: TeamMatchDetailProps) {
  const location = [game.city, game.district, game.venue_name]
    .filter(Boolean)
    .join(" ");

  const rules = game.requirements
    ? game.requirements.split("\n").filter((r) => r.trim())
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 시설 안내 (Amenities) */}
      <section className="md:col-span-2 bg-[var(--color-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
        <h3 className="text-[var(--color-accent)] dark:text-[var(--color-game-guest)] font-bold text-xl mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          시설 안내 (Amenities)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {location && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">location_on</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)] text-center">{location}</span>
              <span className="text-xs text-[var(--color-text-muted)]">Location</span>
            </div>
          )}

          {game.venue_address && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">map</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)] text-center">{game.venue_address}</span>
              <span className="text-xs text-[var(--color-text-muted)]">Address</span>
            </div>
          )}

          {game.duration_hours && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">timer</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{game.duration_hours}시간</span>
              <span className="text-xs text-[var(--color-text-muted)]">Duration</span>
            </div>
          )}

          {/* 유니폼 색상 표시 - 팀 대결 특화 정보 */}
          {(game.uniform_home_color || game.uniform_away_color) && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">checkroom</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-5 w-5 rounded-full border border-[var(--color-border)]"
                    style={{ backgroundColor: game.uniform_home_color ?? "#FF0000" }}
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">홈</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-5 w-5 rounded-full border border-[var(--color-border)]"
                    style={{ backgroundColor: game.uniform_away_color ?? "#0000FF" }}
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">어웨이</span>
                </div>
              </div>
              <span className="text-xs text-[var(--color-text-muted)] mt-1">Uniform</span>
            </div>
          )}
        </div>
      </section>

      {/* 경기 규칙 (Rules) */}
      <section className="bg-[var(--color-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
        <h3 className="text-[var(--color-accent)] dark:text-[var(--color-game-guest)] font-bold text-lg mb-4">
          경기 규칙 (Rules)
        </h3>
        <ul className="space-y-3">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-1">check_circle</span>
              {rule.trim()}
            </li>
          ))}

          {game.notes && (
            <li className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-1">check_circle</span>
              {game.notes}
            </li>
          )}

          {rules.length === 0 && !game.notes && (
            <li className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-1">check_circle</span>
              모든 레벨 환영
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
