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
    <div className="flex flex-col items-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 min-w-[64px]">
      <span className="text-lg font-bold text-[var(--color-text-primary)]">{value}</span>
      <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">{label}</span>
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
      <div className="relative overflow-hidden rounded-[20px] bg-[var(--color-card)] p-6">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[var(--color-accent)] opacity-5" />

        <div className="relative flex items-start gap-4">
          {/* 아바타 */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(0,102,255,0.15)] text-3xl font-black text-[var(--color-primary)] border-2 border-[var(--color-accent)]/30">
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold uppercase tracking-wide text-[var(--color-text-primary)] sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{displayName}</h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {user.position && (
                <span className="rounded-full bg-[rgba(27,60,135,0.12)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                  {user.position}
                  {POSITION_LABEL[user.position] ? ` · ${POSITION_LABEL[user.position]}` : ""}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)]"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>{location}</span>
              )}
            </div>

            {user.height && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">키 {user.height}cm</p>
            )}
          </div>
        </div>

        {/* 바이오 */}
        {user.bio && (
          <p className="relative mt-4 border-t border-[var(--color-border)] pt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
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
      <div className="rounded-[16px] bg-[var(--color-card)] p-5">
        <h2 className="mb-4 font-semibold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
          소속 팀
          <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
            {user.teamMembers.length}개
          </span>
        </h2>

        {user.teamMembers.length > 0 ? (
          <div className="space-y-2">
            {user.teamMembers.map((m) => {
              const accent = m.team.primaryColor ?? "#E31B23";
              const accentSafe =
                accent.toLowerCase() === "#ffffff" || accent.toLowerCase() === "#fff"
                  ? "#E31B23"
                  : accent;
              return (
                <Link
                  key={m.id.toString()}
                  href={`/teams/${m.team.id}`}
                  className="flex items-center gap-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: `${accentSafe}22`, color: accentSafe }}
                  >
                    {m.team.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--color-text-primary)]">{m.team.name}</p>
                    {m.team.city && (
                      <p className="text-xs text-[var(--color-text-muted)]">{m.team.city}</p>
                    )}
                  </div>
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs"
                    style={
                      m.role === "captain"
                        ? { backgroundColor: `${accentSafe}22`, color: accentSafe }
                        : { backgroundColor: "var(--color-border)", color: "var(--color-text-muted)" }
                    }
                  >
                    {ROLE_LABEL[m.role ?? "member"] ?? m.role}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--color-text-muted)]">소속 팀이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
