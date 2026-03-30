import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

interface RosterTabProps {
  teamId: bigint;
  accent: string;
}

// 포지션 정렬 우선순위 — 농구 기준
const POSITION_ORDER = ["PG", "SG", "SF", "PF", "C"];

// 포지션별로 멤버 분류하는 유틸 함수
function groupByPosition<T extends { position: string | null }>(members: T[]) {
  const groups: Record<string, T[]> = {};
  for (const m of members) {
    const pos = m.position ?? "미설정";
    if (!groups[pos]) groups[pos] = [];
    groups[pos].push(m);
  }
  // PG SG SF PF C 먼저, 나머지는 마지막
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
  // 기존 쿼리 100% 유지
  const members = await prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    include: { user: { select: { id: true, nickname: true, name: true, position: true, city: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  }).catch(() => []);

  const captains = members.filter((m) => m.role === "captain");
  const rest = members.filter((m) => m.role !== "captain");
  const grouped = groupByPosition(rest.map((m) => ({ ...m, position: m.user?.position ?? null })));

  // 개별 멤버 카드 (원형 아바타 그리드 스타일)
  function MemberCard({ m }: { m: typeof members[0] }) {
    const displayName = m.user?.nickname ?? m.user?.name ?? "멤버";
    const isCaptain = m.role === "captain";
    const roleLabel = ROLE_LABEL[m.role ?? "member"] ?? m.role ?? "멤버";
    const userId = m.user?.id?.toString();
    const position = m.user?.position ?? "-";

    const inner = (
      <div className="group flex flex-col items-center rounded border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center transition-all hover:bg-[var(--color-card-hover)]">
        {/* 원형 아바타 */}
        <div className="relative mb-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{
              backgroundColor: isCaptain ? accent : "var(--color-surface-high)",
              borderWidth: "2px",
              borderColor: isCaptain ? `${accent}80` : "var(--color-border)",
            }}
          >
            <span className={isCaptain ? "" : "text-[var(--color-text-secondary)]"}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* 주장 배지 */}
          {isCaptain && (
            <span className="absolute -bottom-1 -right-1 rounded bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-black text-white">
              CP
            </span>
          )}
        </div>
        {/* 이름 + 포지션 */}
        <p className="text-sm font-bold text-[var(--color-text-primary)] mb-0.5">{displayName}</p>
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-medium">{position}</p>
        {/* 역할 배지 */}
        <div className="mt-2">
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={
              isCaptain
                ? { backgroundColor: `${accent}22`, color: accent }
                : { backgroundColor: "var(--color-surface-high)", color: "var(--color-text-muted)" }
            }
          >
            {roleLabel}
          </span>
        </div>
      </div>
    );

    return userId ? (
      <Link href={`/users/${userId}`} className="block">{inner}</Link>
    ) : (
      <div>{inner}</div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-10 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)] mb-2">groups</span>
        <p className="text-sm text-[var(--color-text-muted)]">멤버가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 주장 섹션 */}
      {captains.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            주장
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {captains.map((m) => <MemberCard key={m.id.toString()} m={m} />)}
          </div>
        </div>
      )}

      {/* 포지션별 멤버 그리드 — 6열 */}
      {grouped.map(([pos, posMembers]) => (
        <div key={pos}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {pos}
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {posMembers.map((m) => <MemberCard key={m.id.toString()} m={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
