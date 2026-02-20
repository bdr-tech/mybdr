import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// ── 대회 설명 파서 ──────────────────────────────────────────

type Section =
  | { type: "keyvalue"; items: [string, string][] }
  | { type: "numbered"; title: string; items: string[] }
  | { type: "bullets"; title: string; items: string[] }
  | { type: "prizes"; title: string; items: { rank: string; items: string[] }[] }
  | { type: "misc"; items: { label?: string; value: string; url?: string }[] }
  | { type: "sponsors"; sponsors: string[] };

function parsePrizeLine(line: string): { rank: string; items: string[] } {
  // "MVP: 트로피 / 부상"
  const colonMatch = line.match(/^([^:]+):\s*(.+)/);
  if (colonMatch) {
    return { rank: colonMatch[1].trim(), items: colonMatch[2].split("/").map((s) => s.trim()) };
  }
  // "우승 트로피 / 상금 50만원"
  const [rank, ...rest] = line.split(" ");
  return { rank, items: rest.join(" ").split("/").map((s) => s.trim()) };
}

function parseDescription(text: string): Section[] {
  const paragraphs = text.trim().split(/\n\n+/);
  const sections: Section[] = [];

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const [first, ...rest] = lines;

    // Sponsored By
    if (first.startsWith("Sponsored By:")) {
      const val = first.replace("Sponsored By:", "").trim();
      sections.push({ type: "sponsors", sponsors: val.split(",").map((s) => s.trim()) });
      continue;
    }

    // 모든 줄이 key:value 형식
    const allKV = lines.every((l) => /^[^:]+:\s*.+/.test(l));
    if (allKV) {
      const items = lines.map((l) => {
        const idx = l.indexOf(":");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()] as [string, string];
      });
      sections.push({ type: "keyvalue", items });
      continue;
    }

    // 첫 줄이 섹션 헤더
    if (rest.length > 0 && !first.startsWith("-") && !/^\d+\./.test(first)) {
      if (rest.every((l) => /^\d+\./.test(l))) {
        sections.push({
          type: "numbered",
          title: first,
          items: rest.map((l) => l.replace(/^\d+\.\s*/, "")),
        });
        continue;
      }
      if (rest.every((l) => l.startsWith("-"))) {
        sections.push({
          type: "bullets",
          title: first,
          items: rest.map((l) => l.replace(/^-\s*/, "")),
        });
        continue;
      }
      if (first.includes("시상")) {
        sections.push({
          type: "prizes",
          title: first,
          items: rest.map(parsePrizeLine),
        });
        continue;
      }
    }

    // 기타 (혼합)
    const miscItems = lines.map((l) => {
      const urlMatch = l.match(/\(?(https?:\/\/[^\s)]+)\)?/);
      const kvMatch = l.match(/^([^:]+):\s*(.+)/);
      if (kvMatch) {
        return { label: kvMatch[1].trim(), value: kvMatch[2].trim(), url: urlMatch?.[1] };
      }
      return { value: l, url: urlMatch?.[1] };
    });
    sections.push({ type: "misc", items: miscItems });
  }

  return sections;
}

// ── 섹션 렌더러 ────────────────────────────────────────────

const PRIZE_EMOJI: Record<string, string> = { 우승: "🥇", 준우승: "🥈", MVP: "⭐" };

function DescriptionSections({ text }: { text: string }) {
  const sections = parseDescription(text);

  return (
    <div className="space-y-5">
      {sections.map((sec, i) => {
        if (sec.type === "keyvalue") {
          return (
            <Card key={i} className="space-y-3">
              <h3 className="text-sm font-semibold text-[#F4A261]">경기 정보</h3>
              <dl className="space-y-2">
                {sec.items.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 text-sm">
                    <dt className="text-[#A0A0A0]">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          );
        }

        if (sec.type === "numbered") {
          return (
            <Card key={i}>
              <h3 className="mb-3 text-sm font-semibold text-[#F4A261]">{sec.title}</h3>
              <ol className="space-y-2">
                {sec.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F4A261]/20 text-xs font-bold text-[#F4A261]">
                      {j + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </Card>
          );
        }

        if (sec.type === "bullets") {
          return (
            <Card key={i}>
              <h3 className="mb-3 text-sm font-semibold text-[#F4A261]">{sec.title}</h3>
              <ul className="space-y-2">
                {sec.items.map((item, j) => (
                  <li key={j} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F4A261]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        }

        if (sec.type === "prizes") {
          return (
            <Card key={i}>
              <h3 className="mb-3 text-sm font-semibold text-[#F4A261]">{sec.title}</h3>
              <div className="overflow-hidden rounded-[12px] border border-[#2A2A2A]">
                <table className="w-full text-sm">
                  <thead className="bg-[#252525]">
                    <tr>
                      <th className="px-4 py-2 text-left text-[#A0A0A0]">순위</th>
                      <th className="px-4 py-2 text-left text-[#A0A0A0]">시상</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.items.map((prize, j) => (
                      <tr key={j} className="border-t border-[#2A2A2A]">
                        <td className="px-4 py-2.5 font-medium">
                          {PRIZE_EMOJI[prize.rank] ?? ""} {prize.rank}
                        </td>
                        <td className="px-4 py-2.5 text-[#A0A0A0]">
                          {prize.items.join(" + ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        }

        if (sec.type === "misc") {
          return (
            <Card key={i} className="space-y-2">
              {sec.items.map((item, j) => {
                // URL 포함 → 링크
                if (item.url) {
                  const displayValue = item.value.replace(/\(https?:\/\/[^\s)]+\)/g, "").trim();
                  return (
                    <div key={j} className="text-sm">
                      {item.label && (
                        <span className="mr-1 text-[#A0A0A0]">{item.label}:</span>
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#F4A261] underline underline-offset-2"
                      >
                        {displayValue || item.url}
                      </a>
                    </div>
                  );
                }
                // 일반 텍스트
                return (
                  <div key={j} className="text-sm">
                    {item.label ? (
                      <>
                        <span className="text-[#A0A0A0]">{item.label}: </span>
                        <span>{item.value.replace(`${item.label}: `, "")}</span>
                      </>
                    ) : (
                      <span className="text-[#A0A0A0]">{item.value}</span>
                    )}
                  </div>
                );
              })}
            </Card>
          );
        }

        if (sec.type === "sponsors") {
          return (
            <Card key={i}>
              <p className="mb-2 text-xs text-[#A0A0A0]">Sponsored By</p>
              <div className="flex flex-wrap gap-2">
                {sec.sponsors.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[#252525] px-3 py-1 text-sm font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          );
        }

        return null;
      })}
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "success" | "error" | "warning" | "info" }> = {
  draft:              { label: "준비중",  variant: "default" },
  registration:       { label: "참가접수", variant: "info" },
  registration_open:  { label: "참가접수", variant: "info" },
  registration_closed:{ label: "접수마감", variant: "warning" },
  ongoing:            { label: "진행중",  variant: "success" },
  completed:          { label: "완료",   variant: "default" },
  cancelled:          { label: "취소",   variant: "error" },
};

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      tournamentTeams: {
        include: { team: { select: { name: true } } },
        orderBy: [{ wins: "desc" }],
      },
      tournamentMatches: {
        orderBy: { scheduledAt: "asc" },
        take: 10,
        include: {
          homeTeam: { include: { team: { select: { name: true } } } },
          awayTeam: { include: { team: { select: { name: true } } } },
        },
      },
    },
  });
  if (!tournament) return notFound();

  const statusInfo = STATUS_LABEL[tournament.status ?? "draft"] ?? { label: tournament.status ?? "draft", variant: "default" as const };

  const tabs = [
    { href: `/tournaments/${id}`, label: "개요" },
    { href: `/tournaments/${id}/schedule`, label: "일정" },
    { href: `/tournaments/${id}/standings`, label: "순위" },
    { href: `/tournaments/${id}/bracket`, label: "대진표" },
    { href: `/tournaments/${id}/teams`, label: "참가팀" },
  ];

  return (
    <div>
      {/* 헤더 */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        <p className="mt-2 text-sm text-[#A0A0A0]">
          {tournament.format}
          {" · "}
          {tournament.tournamentTeams.length}팀
          {tournament.startDate && ` · ${tournament.startDate.toLocaleDateString("ko-KR")}`}
          {tournament.endDate && ` ~ ${tournament.endDate.toLocaleDateString("ko-KR")}`}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {tournament.venue_name && (
            <span className="text-[#A0A0A0]">
              📍 {[tournament.city, tournament.venue_name].filter(Boolean).join(" ")}
            </span>
          )}
          {tournament.entry_fee && Number(tournament.entry_fee) > 0 && (
            <span className="text-[#A0A0A0]">
              💰 참가비 {Number(tournament.entry_fee).toLocaleString()}원
            </span>
          )}
        </div>
      </Card>

      {/* 서브 탭 */}
      <div className="mb-6 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="whitespace-nowrap rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-[#A0A0A0] hover:bg-[#252525] hover:text-white"
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 대회 정보 (구조화된 설명) */}
      {tournament.description && (
        <div className="mb-6">
          <DescriptionSections text={tournament.description} />
        </div>
      )}

      {/* 최근 경기 + 순위 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">최근 경기</h2>
          <div className="space-y-2">
            {tournament.tournamentMatches.map((m) => (
              <Card key={m.id.toString()} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">{m.homeTeam?.team.name ?? "TBD"}</span>
                <span className="rounded-full bg-[#252525] px-3 py-1 text-sm font-bold">
                  {m.homeScore}:{m.awayScore}
                </span>
                <span className="text-sm font-medium">{m.awayTeam?.team.name ?? "TBD"}</span>
              </Card>
            ))}
            {tournament.tournamentMatches.length === 0 && (
              <Card className="text-center text-sm text-[#A0A0A0]">경기가 없습니다.</Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">순위</h2>
          <Card className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2A2A2A] text-[#A0A0A0]">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">팀</th>
                  <th className="px-4 py-2 text-center">승</th>
                  <th className="px-4 py-2 text-center">패</th>
                </tr>
              </thead>
              <tbody>
                {tournament.tournamentTeams.map((t, i) => (
                  <tr key={t.id.toString()} className="border-b border-[#1F1F1F]">
                    <td className="px-4 py-2 font-bold text-[#F4A261]">{i + 1}</td>
                    <td className="px-4 py-2">{t.team.name}</td>
                    <td className="px-4 py-2 text-center">{t.wins ?? 0}</td>
                    <td className="px-4 py-2 text-center">{t.losses ?? 0}</td>
                  </tr>
                ))}
                {tournament.tournamentTeams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-[#A0A0A0]">
                      팀이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
