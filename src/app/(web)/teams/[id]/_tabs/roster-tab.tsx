import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

interface RosterTabProps {
  teamId: bigint;
  accent: string;
}

const POSITION_ORDER = ["PG", "SG", "SF", "PF", "C"];

function groupByPosition<T extends { position: string | null }>(members: T[]) {
  const groups: Record<string, T[]> = {};
  for (const m of members) {
    const pos = m.position ?? "미설정";
    if (!groups[pos]) groups[pos] = [];
    groups[pos].push(m);
  }
  // sort keys: PG SG SF PF C 먼저, 나머지는 마지막
  return Object.entries(groups).sort(([a], [b]) => {
    const ai = POSITION_ORDER.indexOf(a);
    const bi = POSITION_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

const ROLE_LABEL: Record<string, string> = {
  captain: "주장",
  coach: "코치",
  manager: "매니저",
  member: "멤버",
};

export async function RosterTab({ teamId, accent }: RosterTabProps) {
  const members = await prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    include: { user: { select: { id: true, nickname: true, name: true, position: true, city: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  }).catch(() => []);

  const captains = members.filter((m) => m.role === "captain");
  const rest = members.filter((m) => m.role !== "captain");
  const grouped = groupByPosition(rest.map((m) => ({ ...m, position: m.user?.position ?? null })));

  function MemberRow({ m }: { member: typeof members[0]; m: typeof members[0] }) {
    const displayName = m.user?.nickname ?? m.user?.name ?? "멤버";
    const isCaptain = m.role === "captain";
    const roleLabel = ROLE_LABEL[m.role ?? "member"] ?? m.role ?? "멤버";
    const userId = m.user?.id?.toString();
    const joinDate = m.createdAt?.toLocaleDateString("ko-KR", { year: "numeric", month: "short", timeZone: "Asia/Seoul" });

    const inner = (
      <div className="flex items-center gap-3 rounded-[12px] bg-[#EEF2FF] px-4 py-3 transition-colors hover:bg-[#E2E8F0]">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: isCaptain ? accent : "#9CA3AF" }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#111827]">{displayName}</p>
          {m.user?.city && <p className="text-xs text-[#9CA3AF]">{m.user.city}</p>}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={isCaptain ? { backgroundColor: `${accent}22`, color: accent } : { backgroundColor: "#E8ECF0", color: "#6B7280" }}
          >
            {roleLabel}
          </span>
          {joinDate && <span className="text-[10px] text-[#9CA3AF]">{joinDate} 가입</span>}
        </div>
      </div>
    );

    return userId ? <Link href={`/users/${userId}`}>{inner}</Link> : <div>{inner}</div>;
  }

  if (members.length === 0) {
    return (
      <div className="rounded-[16px] bg-white px-5 py-10 text-center">
        <p className="text-sm text-[#9CA3AF]">멤버가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {captains.length > 0 && (
        <div className="rounded-[16px] bg-white p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">주장</h3>
          <div className="space-y-2">
            {captains.map((m) => <MemberRow key={m.id.toString()} member={m} m={m} />)}
          </div>
        </div>
      )}
      {grouped.map(([pos, posMembers]) => (
        <div key={pos} className="rounded-[16px] bg-white p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">{pos}</h3>
          <div className="space-y-2">
            {posMembers.map((m) => <MemberRow key={m.id.toString()} member={m} m={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
