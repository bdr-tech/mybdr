import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TeamJoinButton } from "./join-button";

export const revalidate = 60;

// primaryColor가 흰색 계열이면 secondaryColor를 accent로 사용
function resolveAccent(primary: string | null, secondary: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "#F4A261";
  }
  return primary;
}

function MemberAvatar({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#111827]"
      style={{ backgroundColor: `${color}55` }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  captain: "주장",
  coach: "코치",
  manager: "매니저",
  member: "멤버",
};

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id: BigInt(id) },
    include: {
      teamMembers: {
        include: { user: { select: { id: true, nickname: true, name: true } } },
        orderBy: [{ role: "asc" }],
      },
    },
  }).catch(() => null);
  if (!team) return notFound();

  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const secondary = team.secondaryColor ?? "#FFFFFF";
  const memberCount = team.teamMembers.length;
  const maxMembers = team.max_members ?? 15;
  const location = [team.city, team.district].filter(Boolean).join(" ");
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const draws = team.draws ?? 0;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null;

  const captain = team.teamMembers.find((m) => m.role === "captain");
  const captainName = captain?.user?.nickname ?? captain?.user?.name;

  return (
    <div className="space-y-4">
      {/* 히어로 배너 */}
      <div
        className="relative overflow-hidden rounded-[20px] p-6"
        style={{
          background: `linear-gradient(135deg, ${secondary}ee 0%, ${secondary}99 50%, #FFFFFF 100%)`,
          border: `1px solid ${accent}33`,
        }}
      >
        {/* 배경 장식 원 */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-10"
          style={{ backgroundColor: accent }}
        />
        <div
          className="pointer-events-none absolute -bottom-6 right-16 h-20 w-20 rounded-full opacity-10"
          style={{ backgroundColor: accent }}
        />

        <div className="relative flex items-start gap-4">
          {/* 팀 로고 원 */}
          <div
            className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-3xl font-black text-[#111827]"
            style={{
              backgroundColor: `${accent}55`,
              border: `2px solid ${accent}66`,
            }}
          >
            {team.name.charAt(0).toUpperCase()}
          </div>

          {/* 팀 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-[#111827]">{team.name}</h1>
              {team.accepting_members && (
                <Badge variant="success">모집중</Badge>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[#6B7280]">
              {location && <span>📍 {location}</span>}
              {team.founded_year && <span>🗓 {team.founded_year}년 창단</span>}
              {captainName && <span>👑 주장 {captainName}</span>}
            </div>

            {/* 전적 */}
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="flex flex-col items-center rounded-[10px] bg-[#FFFFFF0A] px-3 py-1.5 min-w-[52px]">
                <span className="text-lg font-bold text-[#111827]">{wins}</span>
                <span className="text-[10px] text-[#6B7280]">승</span>
              </div>
              <div className="flex flex-col items-center rounded-[10px] bg-[#FFFFFF0A] px-3 py-1.5 min-w-[52px]">
                <span className="text-lg font-bold text-[#111827]">{losses}</span>
                <span className="text-[10px] text-[#6B7280]">패</span>
              </div>
              {draws > 0 && (
                <div className="flex flex-col items-center rounded-[10px] bg-[#FFFFFF0A] px-3 py-1.5 min-w-[52px]">
                  <span className="text-lg font-bold text-[#111827]">{draws}</span>
                  <span className="text-[10px] text-[#6B7280]">무</span>
                </div>
              )}
              {winRate !== null && (
                <div className="flex flex-col items-center rounded-[10px] bg-[#FFFFFF0A] px-3 py-1.5 min-w-[52px]">
                  <span className="text-lg font-bold text-[#111827]">{winRate}%</span>
                  <span className="text-[10px] text-[#6B7280]">승률</span>
                </div>
              )}
              <div className="flex flex-col items-center rounded-[10px] bg-[#FFFFFF0A] px-3 py-1.5 min-w-[52px]">
                <span className="text-lg font-bold text-[#111827]">{memberCount}</span>
                <span className="text-[10px] text-[#6B7280]">멤버</span>
              </div>
            </div>
          </div>
        </div>

        {/* 설명 */}
        {team.description && (
          <p className="relative mt-4 text-sm text-[#6B7280] leading-relaxed border-t border-[#FFFFFF0F] pt-4">
            {team.description}
          </p>
        )}

        {/* 가입 버튼 */}
        <div className="relative mt-4 flex justify-end">
          <TeamJoinButton teamId={id} />
        </div>
      </div>

      {/* 멤버 현황 바 */}
      <div className="rounded-[16px] bg-[#FFFFFF] px-5 py-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">멤버 현황</span>
          <span className="text-[#6B7280]">{memberCount} / {maxMembers}명</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-[#E8ECF0]">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all"
            style={{
              width: `${Math.min((memberCount / maxMembers) * 100, 100)}%`,
              backgroundColor: accent,
            }}
          />
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="rounded-[16px] bg-[#FFFFFF] p-5">
        <h2 className="mb-4 font-semibold">
          멤버 <span className="ml-1 text-sm font-normal text-[#9CA3AF]">{memberCount}명</span>
        </h2>

        <div className="grid gap-2 sm:grid-cols-2">
          {team.teamMembers.map((m) => {
            const displayName = m.user?.nickname ?? m.user?.name ?? "멤버";
            const isCaptain = m.role === "captain";
            const roleLabel = ROLE_LABEL[m.role ?? "member"] ?? m.role ?? "멤버";
            const userId = m.user?.id?.toString();

            const inner = (
              <div className="flex items-center gap-3 rounded-[12px] bg-[#EEF2FF] px-3 py-2.5 transition-colors hover:bg-[#E2E8F0]">
                <MemberAvatar name={displayName} color={isCaptain ? accent : "#6B7280"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#111827]">{displayName}</p>
                </div>
                <span
                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={
                    isCaptain
                      ? { backgroundColor: `${accent}55`, color: "#ffffff" }
                      : { backgroundColor: "#E8ECF0", color: "#6B7280" }
                  }
                >
                  {roleLabel}
                </span>
              </div>
            );

            return userId ? (
              <Link key={m.id.toString()} href={`/users/${userId}`}>
                {inner}
              </Link>
            ) : (
              <div key={m.id.toString()}>{inner}</div>
            );
          })}
        </div>

        {team.teamMembers.length === 0 && (
          <p className="text-center text-sm text-[#6B7280]">멤버가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
