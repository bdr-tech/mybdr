import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { games } from "@prisma/client";

type GameCardData = Pick<
  games,
  | "id"
  | "uuid"
  | "title"
  | "status"
  | "city"
  | "district"
  | "venue_name"
  | "scheduled_at"
  | "uniform_home_color"
  | "uniform_away_color"
  | "requirements"
>;

const STATUS_INFO: Record<number, { label: string; variant: "success" | "default" | "error" | "warning" | "info" }> = {
  0: { label: "임시",   variant: "warning" },
  1: { label: "모집중", variant: "success" },
  2: { label: "확정",   variant: "info" },
  3: { label: "완료",   variant: "default" },
  4: { label: "취소",   variant: "error" },
};

export function TeamMatchCard({ game }: { game: GameCardData }) {
  const statusInfo = STATUS_INFO[game.status] ?? { label: String(game.status), variant: "default" as const };
  const location = [game.city, game.district, game.venue_name].filter(Boolean).join(" ");
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const homeColor = game.uniform_home_color ?? "#FF0000";
  const awayColor = game.uniform_away_color ?? "#0000FF";

  return (
    <Link href={href}>
      <div
        className="group relative overflow-hidden rounded-[16px] bg-[var(--color-card)] p-5 transition-all hover:bg-[#F0FDF4] hover:-translate-y-0.5 hover:shadow-lg"
        style={{ borderLeft: "3px solid #4ADE80" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">⚔️</span>
            <span className="text-xs font-medium" style={{ color: "#4ADE80" }}>팀 대결</span>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        <h3 className="mb-3 font-semibold leading-snug text-[var(--color-text-primary)] line-clamp-2">{game.title}</h3>

        <div className="mb-3 space-y-1">
          {location && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <span>📍</span>
              <span className="truncate">{location}</span>
            </div>
          )}
          {game.scheduled_at && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <span>📅</span>
              <span>
                {game.scheduled_at.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })}
                {" "}
                {game.scheduled_at.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
              </span>
            </div>
          )}
        </div>

        <div className="mb-3 h-px bg-[var(--color-border)]" />

        {/* 유니폼 색상 */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>유니폼</span>
          <div className="flex items-center gap-1">
            <span
              className="inline-block h-4 w-4 rounded-full border border-[var(--color-border)] shadow-sm"
              style={{ backgroundColor: homeColor }}
              title="홈"
            />
            <span className="text-[var(--color-text-secondary)]">vs</span>
            <span
              className="inline-block h-4 w-4 rounded-full border border-[var(--color-border)] shadow-sm"
              style={{ backgroundColor: awayColor }}
              title="어웨이"
            />
          </div>
          {game.requirements && (
            <span className="ml-auto truncate text-[var(--color-text-secondary)]">{game.requirements}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
