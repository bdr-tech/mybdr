import type { games } from "@prisma/client";
import { SKILL_LABEL } from "@/lib/constants/game-status";

// 게스트 모집 경기 상세: 시설 안내(Amenities) + 경기 규칙(Rules) 스타일
// 기존 테이블 형태 -> 디자인 시안 기반 카드 레이아웃으로 전환
// 데이터 로직 100% 유지, UI만 변경

interface GuestDetailProps {
  game: Pick<
    games,
    | "scheduled_at"
    | "duration_hours"
    | "city"
    | "district"
    | "venue_name"
    | "venue_address"
    | "max_participants"
    | "min_participants"
    | "current_participants"
    | "fee_per_person"
    | "skill_level"
    | "requirements"
    | "notes"
    | "allow_guests"
  >;
}

// SKILL_LABEL은 @/lib/constants/game-status에서 import (7단계 + 하위 호환)

export function GuestDetail({ game }: GuestDetailProps) {
  const location = [game.city, game.district, game.venue_name]
    .filter(Boolean)
    .join(" ");

  const rules = game.requirements
    ? game.requirements.split("\n").filter((r) => r.trim())
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 시설 안내 (Amenities) */}
      <section className="md:col-span-2 bg-[var(--color-card)] p-6 rounded-md border border-[var(--color-border)] shadow-sm">
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

          {game.skill_level && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">fitness_center</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {SKILL_LABEL[game.skill_level] ?? game.skill_level}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">Skill Level</span>
            </div>
          )}

          {/* 게스트 허용 여부 - 게스트 모집 특화 정보 */}
          <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">
              {game.allow_guests ? "person_add" : "person_off"}
            </span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {game.allow_guests ? "게스트 허용" : "게스트 불가"}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">Guest Policy</span>
          </div>
        </div>
      </section>

      {/* 경기 규칙 (Rules) */}
      <section className="bg-[var(--color-card)] p-6 rounded-md border border-[var(--color-border)] shadow-sm">
        <h3 className="text-[var(--color-accent)] dark:text-[var(--color-game-guest)] font-bold text-lg mb-4">
          경기 규칙 (Rules)
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-1">check_circle</span>
            {game.min_participants ?? 1}~{game.max_participants ?? 0}명 모집 (현재 {game.current_participants ?? 0}명)
          </li>

          <li className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-1">check_circle</span>
            참가비: {game.fee_per_person && Number(game.fee_per_person) > 0
              ? `${Number(game.fee_per_person).toLocaleString()}원`
              : "무료"}
          </li>

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
