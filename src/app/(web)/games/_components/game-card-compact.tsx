import Link from "next/link";
import type { games } from "@prisma/client";
// 경기 뱃지/라벨 상수 (공통 파일에서 import)
import { TYPE_BADGE, STATUS_LABEL, SKILL_BADGE } from "../_constants/game-badges";

type GameCardData = Pick<
  games,
  | "id" | "uuid" | "title" | "status" | "game_type"
  | "city" | "venue_name" | "scheduled_at"
  | "current_participants" | "max_participants"
  | "fee_per_person" | "skill_level"
>;

export function GameCardCompact({ game }: { game: GameCardData }) {
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const badge = TYPE_BADGE[game.game_type] ?? TYPE_BADGE[0];
  const status = STATUS_LABEL[game.status] ?? null;
  const skill = game.skill_level && game.skill_level !== "all" ? SKILL_BADGE[game.skill_level] : null;
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;
  const barColor = pct >= 100 ? "#EF4444" : pct >= 80 ? "#D97706" : "#1B3C87";
  const location = game.venue_name ?? game.city ?? "";
  const fee = game.fee_per_person && Number(game.fee_per_person) > 0
    ? `₩${Number(game.fee_per_person).toLocaleString()}`
    : null;

  const dateStr = game.scheduled_at
    ? `${game.scheduled_at.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", timeZone: "Asia/Seoul" })} ${game.scheduled_at.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}`
    : "";

  return (
    <Link href={href}>
      <div className="group flex h-full flex-col rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--color-accent)]/30">
        {/* 상단 컬러 바 */}
        <div className="h-1" style={{ backgroundColor: badge.bg }} />

        <div className="flex flex-1 flex-col p-3.5">
          {/* Row 1: 유형 뱃지 + 상태 */}
          <div className="mb-2 flex items-center justify-between">
            <span
              className="rounded-[6px] px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            {status && (
              <span className="text-xs font-bold" style={{ color: status.color }}>
                {status.text}
              </span>
            )}
          </div>

          {/* Row 2: 제목 */}
          <h3 className="mb-1 text-sm font-bold text-[var(--color-text-primary)] line-clamp-1 leading-tight group-hover:text-[var(--color-accent)] transition-colors">
            {game.title}
          </h3>

          {/* Row 3: 날짜 + 장소 */}
          <div className="mb-2 space-y-0.5">
            {dateStr && (
              <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {dateStr}
              </p>
            )}
            {location && (
              <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="line-clamp-1">{location}</span>
              </p>
            )}
          </div>

          {/* Row 4: 참가 프로그레스 */}
          {max > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
                {cur}/{max}
              </span>
            </div>
          )}

          {/* Row 5: 참가비 + 난이도 */}
          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              {fee ?? <span className="text-[var(--color-text-secondary)]">무료</span>}
            </span>
            {skill && (
              <span
                className="rounded-[6px] px-2 py-0.5 text-xs font-bold"
                style={{ backgroundColor: skill.bg, color: skill.color }}
              >
                {skill.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
