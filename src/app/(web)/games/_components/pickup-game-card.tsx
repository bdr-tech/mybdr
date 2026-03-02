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
  | "current_participants"
  | "max_participants"
  | "fee_per_person"
  | "entry_fee_note"
  | "contact_phone"
  | "skill_level"
>;

const STATUS_INFO: Record<number, { label: string; variant: "success" | "default" | "error" | "warning" | "info" }> = {
  0: { label: "임시",   variant: "warning" },
  1: { label: "모집중", variant: "success" },
  2: { label: "확정",   variant: "info" },
  3: { label: "완료",   variant: "default" },
  4: { label: "취소",   variant: "error" },
};

const SKILL_LABEL: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  intermediate_advanced: "중고급",
  advanced: "고급",
};

function ParticipantBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const color = pct >= 100 ? "#EF4444" : pct >= 80 ? "#FBBF24" : "#4ADE80";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8ECF0]">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="flex-shrink-0 text-xs text-[#6B7280]">{current}/{max}명</span>
    </div>
  );
}

export function PickupGameCard({ game }: { game: GameCardData }) {
  const statusInfo = STATUS_INFO[game.status] ?? { label: String(game.status), variant: "default" as const };
  const location = [game.city, game.district, game.venue_name].filter(Boolean).join(" ");
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const feeDisplay = game.entry_fee_note
    ? game.entry_fee_note
    : game.fee_per_person && Number(game.fee_per_person) > 0
    ? `${Number(game.fee_per_person).toLocaleString()}원`
    : "무료";
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;

  return (
    <Link href={href}>
      <div
        className="group relative overflow-hidden rounded-[16px] bg-white p-5 transition-all hover:bg-[#FFF8F0] hover:-translate-y-0.5 hover:shadow-lg"
        style={{ borderLeft: "3px solid #F4A261" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏀</span>
            <span className="text-xs font-medium" style={{ color: "#F4A261" }}>픽업</span>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        <h3 className="mb-3 font-semibold leading-snug text-[#111827] line-clamp-2">{game.title}</h3>

        <div className="mb-3 space-y-1">
          {location && (
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <span>📍</span>
              <span className="truncate">{location}</span>
            </div>
          )}
          {game.scheduled_at && (
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <span>📅</span>
              <span>
                {game.scheduled_at.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })}
                {" "}
                {game.scheduled_at.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
              </span>
            </div>
          )}
        </div>

        <div className="mb-3 h-px bg-[#E8ECF0]" />

        {max > 0 && <ParticipantBar current={cur} max={max} />}

        <div className="mt-2 flex items-center justify-between text-xs text-[#9CA3AF]">
          <span>💰 {feeDisplay}</span>
          <div className="flex items-center gap-1.5">
            {game.contact_phone && <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[#92400E]">📞 연락 가능</span>}
            {game.skill_level && game.skill_level !== "all" && (
              <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[#6B7280]">
                {SKILL_LABEL[game.skill_level] ?? game.skill_level}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
