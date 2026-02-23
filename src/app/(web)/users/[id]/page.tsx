import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

const POSITION_LABEL: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

const ROLE_LABEL: Record<string, string> = {
  captain: "주장",
  coach: "코치",
  manager: "매니저",
  member: "멤버",
};

function StatBox({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-[12px] bg-[#EEF2FF] px-4 py-3 min-w-[64px]">
      <span className="text-lg font-bold text-[#111827]">{value}</span>
      <span className="mt-0.5 text-[10px] text-[#6B7280]">{label}</span>
    </div>
  );
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: BigInt(id) },
    select: {
      id: true,
      name: true,
      nickname: true,
      position: true,
      height: true,
      city: true,
      district: true,
      bio: true,
      total_games_participated: true,
      createdAt: true,
      teamMembers: {
        where: { status: "active" },
        include: {
          team: {
            select: { id: true, name: true, primaryColor: true, city: true },
          },
        },
        orderBy: { joined_at: "desc" },
      },
    },
  }).catch(() => null);

  if (!user) return notFound();

  const displayName = user.nickname ?? user.name ?? "사용자";
  const initial = displayName.charAt(0).toUpperCase();
  const location = [user.city, user.district].filter(Boolean).join(" ");
  const joinYear = user.createdAt.getFullYear();

  return (
    <div className="space-y-4">
      {/* 프로필 히어로 */}
      <div className="relative overflow-hidden rounded-[20px] bg-[#FFFFFF] p-6">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#0066FF] opacity-5" />

        <div className="relative flex items-start gap-4">
          {/* 아바타 */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(0,102,255,0.15)] text-3xl font-black text-[#F4A261] border-2 border-[#0066FF]/30">
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-[#111827]">{displayName}</h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {user.position && (
                <span className="rounded-full bg-[rgba(0,102,255,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#F4A261]">
                  {user.position}
                  {POSITION_LABEL[user.position] ? ` · ${POSITION_LABEL[user.position]}` : ""}
                </span>
              )}
              {location && (
                <span className="text-sm text-[#6B7280]">📍 {location}</span>
              )}
            </div>

            {user.height && (
              <p className="mt-1 text-sm text-[#9CA3AF]">키 {user.height}cm</p>
            )}
          </div>
        </div>

        {/* 바이오 */}
        {user.bio && (
          <p className="relative mt-4 border-t border-[#E8ECF0] pt-4 text-sm leading-relaxed text-[#6B7280]">
            {user.bio}
          </p>
        )}

        {/* 통계 */}
        <div className="relative mt-4 flex flex-wrap gap-2">
          <StatBox value={user.total_games_participated ?? 0} label="참가경기" />
          <StatBox value={user.teamMembers.length} label="소속팀" />
          <StatBox value={`${joinYear}년`} label="가입" />
        </div>
      </div>

      {/* 소속 팀 */}
      <div className="rounded-[16px] bg-[#FFFFFF] p-5">
        <h2 className="mb-4 font-semibold">
          소속 팀
          <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
            {user.teamMembers.length}개
          </span>
        </h2>

        {user.teamMembers.length > 0 ? (
          <div className="space-y-2">
            {user.teamMembers.map((m) => {
              const accent = m.team.primaryColor ?? "#F4A261";
              const accentSafe =
                accent.toLowerCase() === "#ffffff" || accent.toLowerCase() === "#fff"
                  ? "#F4A261"
                  : accent;
              return (
                <Link
                  key={m.id.toString()}
                  href={`/teams/${m.team.id}`}
                  className="flex items-center gap-3 rounded-[12px] bg-[#EEF2FF] px-4 py-3 hover:bg-[#E8ECF0] transition-colors"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: `${accentSafe}22`, color: accentSafe }}
                  >
                    {m.team.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#111827]">{m.team.name}</p>
                    {m.team.city && (
                      <p className="text-xs text-[#9CA3AF]">{m.team.city}</p>
                    )}
                  </div>
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs"
                    style={
                      m.role === "captain"
                        ? { backgroundColor: `${accentSafe}22`, color: accentSafe }
                        : { backgroundColor: "#E8ECF0", color: "#6B7280" }
                    }
                  >
                    {ROLE_LABEL[m.role ?? "member"] ?? m.role}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-[#6B7280]">소속 팀이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
