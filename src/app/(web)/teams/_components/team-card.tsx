import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface TeamCardData {
  id: bigint;
  name: string;
  primaryColor: string | null;
  secondaryColor?: string | null;
  city: string | null;
  district: string | null;
  wins: number | null;
  losses: number | null;
  accepting_members: boolean | null;
  tournaments_count: number | null;
  _count: { teamMembers: number };
}

function resolveAccent(primary: string | null, secondary?: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "#F4A261";
  }
  return primary;
}

export function TeamCard({ team }: { team: TeamCardData }) {
  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const location = [team.city, team.district].filter(Boolean).join(" ");
  const memberCount = team._count.teamMembers;

  return (
    <Link href={`/teams/${team.id}`}>
      <div
        className="flex flex-col gap-3 rounded-[16px] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        style={{ border: `1px solid ${accent}33` }}
      >
        {/* 팀 로고 */}
        <div className="flex items-start justify-between">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-black text-[#111827]"
            style={{
              backgroundColor: `${accent}44`,
              border: `2px solid ${accent}66`,
            }}
          >
            {team.name.charAt(0).toUpperCase()}
          </div>
          {team.accepting_members && (
            <Badge variant="success">모집중</Badge>
          )}
        </div>

        {/* 팀명 + 지역 */}
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#111827]">{team.name}</p>
          {location && (
            <p className="mt-0.5 truncate text-xs text-[#6B7280]">{location}</p>
          )}
        </div>

        {/* 전적 + 멤버 */}
        <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
          <span>
            {wins + losses > 0
              ? <span><span className="text-[#111827] font-medium">{wins}</span>승 <span className="text-[#6B7280]">{losses}</span>패</span>
              : "전적 없음"}
          </span>
          <span>👥 {memberCount}명</span>
        </div>
      </div>
    </Link>
  );
}
