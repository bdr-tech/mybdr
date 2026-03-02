import type { games } from "@prisma/client";

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

export function TeamMatchDetail({ game }: TeamMatchDetailProps) {
  const location = [game.city, game.district, game.venue_name]
    .filter(Boolean)
    .join(" ");

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
        {(game.uniform_home_color || game.uniform_away_color) && (
          <InfoRow
            label="유니폼"
            value={
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-5 w-5 rounded-full border border-[#E8ECF0]"
                    style={{
                      backgroundColor: game.uniform_home_color ?? "#FF0000",
                    }}
                  />
                  <span className="text-xs text-[#6B7280]">홈</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-5 w-5 rounded-full border border-[#E8ECF0]"
                    style={{
                      backgroundColor: game.uniform_away_color ?? "#0000FF",
                    }}
                  />
                  <span className="text-xs text-[#6B7280]">어웨이</span>
                </div>
              </div>
            }
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
