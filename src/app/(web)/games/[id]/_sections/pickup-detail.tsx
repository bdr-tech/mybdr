import type { games } from "@prisma/client";
import { SKILL_LABEL } from "@/lib/constants/game-status";

// 픽업 경기 상세: 시설 안내(Amenities) + 경기 규칙(Rules) 스타일
// 기존 테이블 형태 -> 디자인 시안(bdr_2, bdr_6) 기반 카드 레이아웃으로 전환
// 데이터 로직은 100% 유지, UI만 변경

interface PickupDetailProps {
  game: Pick<
    games,
    | "scheduled_at"
    | "ended_at"
    | "duration_hours"
    | "city"
    | "district"
    | "venue_name"
    | "venue_address"
    | "max_participants"
    | "min_participants"
    | "current_participants"
    | "fee_per_person"
    | "entry_fee_note"
    | "contact_phone"
    | "skill_level"
    | "requirements"
    | "notes"
  >;
}

// SKILL_LABEL은 @/lib/constants/game-status에서 import (7단계 + 하위 호환)

export function PickupDetail({ game }: PickupDetailProps) {
  // 장소 정보 조합
  const location = [game.city, game.district, game.venue_name]
    .filter(Boolean)
    .join(" ");

  // requirements를 줄바꿈 기준으로 규칙 목록으로 분리
  const rules = game.requirements
    ? game.requirements.split("\n").filter((r) => r.trim())
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 시설 안내 (Amenities) - 2칸 차지 */}
      <section className="md:col-span-2 bg-[var(--color-card)] p-6 rounded-md border border-[var(--color-border)] shadow-sm">
        <h3 className="text-[var(--color-accent)] dark:text-[var(--color-game-guest)] font-bold text-xl mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          시설 안내 (Amenities)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* 장소 정보 */}
          {location && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">location_on</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)] text-center">{location}</span>
              <span className="text-xs text-[var(--color-text-muted)]">Location</span>
            </div>
          )}

          {/* 주소 */}
          {game.venue_address && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">map</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)] text-center">{game.venue_address}</span>
              <span className="text-xs text-[var(--color-text-muted)]">Address</span>
            </div>
          )}

          {/* 경기 시간 */}
          {game.duration_hours && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">timer</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{game.duration_hours}시간</span>
              <span className="text-xs text-[var(--color-text-muted)]">Duration</span>
            </div>
          )}

          {/* 실력 수준 */}
          {game.skill_level && game.skill_level !== "all" && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">fitness_center</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {SKILL_LABEL[game.skill_level] ?? game.skill_level}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">Skill Level</span>
            </div>
          )}

          {/* 연락처 */}
          {game.contact_phone && (
            <div className="flex flex-col items-center p-4 bg-[var(--color-surface)] rounded-lg border border-transparent hover:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl mb-2">call</span>
              <a
                href={`tel:${game.contact_phone}`}
                className="text-sm font-medium text-[var(--color-text-primary)] hover:underline"
              >
                {game.contact_phone}
              </a>
              <span className="text-xs text-[var(--color-text-muted)]">Contact</span>
            </div>
          )}
        </div>
      </section>

      {/* 경기 규칙 (Rules) - 1칸 차지 */}
      <section className="bg-[var(--color-card)] p-6 rounded-md border border-[var(--color-border)] shadow-sm">
        <h3 className="text-[var(--color-accent)] dark:text-[var(--color-game-guest)] font-bold text-lg mb-4">
          경기 규칙 (Rules)
        </h3>
        <ul className="space-y-3">
          {/* 기본 규칙: 모집 인원 표시 */}
          <li className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-1">check_circle</span>
            {game.min_participants ?? 4}~{game.max_participants ?? 0}명 모집 (현재 {game.current_participants ?? 0}명)
          </li>

          {/* requirements에서 파싱한 규칙들 */}
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-1">check_circle</span>
              {rule.trim()}
            </li>
          ))}

          {/* 비고(notes)가 있으면 표시 */}
          {game.notes && (
            <li className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-1">check_circle</span>
              {game.notes}
            </li>
          )}

          {/* 규칙이 하나도 없을 때 기본 메시지 */}
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
