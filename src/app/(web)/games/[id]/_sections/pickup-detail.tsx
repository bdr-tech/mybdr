import type { games } from "@prisma/client";

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

const SKILL_LABEL: Record<string, string> = {
  all: "전체",
  beginner: "초급",
  intermediate: "중급",
  intermediate_advanced: "중고급",
  advanced: "고급",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b border-[#E8ECF0] last:border-0">
      <th className="w-24 py-2.5 pr-4 text-left text-sm font-normal text-[#6B7280] align-top whitespace-nowrap">
        {label}
      </th>
      <td className="py-2.5 text-sm font-medium text-[#111827]">{value}</td>
    </tr>
  );
}

export function PickupDetail({ game }: PickupDetailProps) {
  const location = [game.city, game.district, game.venue_name]
    .filter(Boolean)
    .join(" ");
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;

  const feeDisplay = game.entry_fee_note
    ? game.entry_fee_note
    : game.fee_per_person && Number(game.fee_per_person) > 0
    ? `${Number(game.fee_per_person).toLocaleString()}원`
    : "무료";

  return (
    <table className="w-full">
      <tbody>
        <InfoRow
          label="일시"
          value={
            game.scheduled_at
              ? game.scheduled_at.toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"
          }
        />
        {game.duration_hours && (
          <InfoRow label="경기 시간" value={`${game.duration_hours}시간`} />
        )}
        {location && <InfoRow label="장소" value={location} />}
        {game.venue_address && (
          <InfoRow label="주소" value={game.venue_address} />
        )}
        <InfoRow
          label="모집 인원"
          value={`${game.min_participants ?? 4}~${max}명 (현재 ${cur}명)`}
        />
        <InfoRow label="참가비" value={feeDisplay} />
        {game.contact_phone && (
          <InfoRow
            label="담당자 연락처"
            value={
              <a
                href={`tel:${game.contact_phone}`}
                className="text-[#0066FF] hover:underline"
              >
                {game.contact_phone}
              </a>
            }
          />
        )}
        {game.skill_level && game.skill_level !== "all" && (
          <InfoRow
            label="기술 수준"
            value={SKILL_LABEL[game.skill_level] ?? game.skill_level}
          />
        )}
        {game.requirements && (
          <InfoRow label="참가 조건" value={game.requirements} />
        )}
        {game.notes && <InfoRow label="비고" value={game.notes} />}
      </tbody>
    </table>
  );
}
