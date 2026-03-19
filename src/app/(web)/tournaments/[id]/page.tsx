import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 30;

// -- 대회 설명 파서 --

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

// -- 섹션 렌더러 --

const PRIZE_ICON: Record<string, string> = { 우승: "1st", 준우승: "2nd", MVP: "MVP" };

function DescriptionSections({ text }: { text: string }) {
  const sections = parseDescription(text);

  return (
    <div className="space-y-5">
      {sections.map((sec, i) => {
        if (sec.type === "keyvalue") {
          return (
            <Card key={i} className="space-y-3">
              <h3 className="text-sm font-semibold text-[#E31B23]">경기 정보</h3>
              <dl className="space-y-2">
                {sec.items.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 text-sm">
                    <dt className="text-[#6B7280]">{k}</dt>
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
              <h3 className="mb-3 text-sm font-semibold text-[#E31B23]">{sec.title}</h3>
              <ol className="space-y-2">
                {sec.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1B3C87]/20 text-xs font-bold text-[#E31B23]">
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
              <h3 className="mb-3 text-sm font-semibold text-[#E31B23]">{sec.title}</h3>
              <ul className="space-y-2">
                {sec.items.map((item, j) => (
                  <li key={j} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1B3C87]" />
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
              <h3 className="mb-3 text-sm font-semibold text-[#E31B23]">{sec.title}</h3>
              <div className="overflow-hidden rounded-[12px] border border-[#E8ECF0]">
                <table className="w-full text-sm">
                  <thead className="bg-[#EEF2FF]">
                    <tr>
                      <th className="px-4 py-2 text-left text-[#6B7280]">순위</th>
                      <th className="px-4 py-2 text-left text-[#6B7280]">시상</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.items.map((prize, j) => (
                      <tr key={j} className="border-t border-[#E8ECF0]">
                        <td className="px-4 py-2.5 font-medium">
                          {PRIZE_ICON[prize.rank] ? <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1B3C87]/10 text-xs font-bold text-[#E31B23]">{PRIZE_ICON[prize.rank]}</span> : null} {prize.rank}
                        </td>
                        <td className="px-4 py-2.5 text-[#6B7280]">
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
                // URL 포함 -> 링크
                if (item.url) {
                  const displayValue = item.value.replace(/\(https?:\/\/[^\s)]+\)/g, "").trim();
                  return (
                    <div key={j} className="text-sm">
                      {item.label && (
                        <span className="mr-1 text-[#6B7280]">{item.label}:</span>
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E31B23] underline underline-offset-2"
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
                        <span className="text-[#6B7280]">{item.label}: </span>
                        <span>{item.value.replace(`${item.label}: `, "")}</span>
                      </>
                    ) : (
                      <span className="text-[#6B7280]">{item.value}</span>
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
              <p className="mb-2 text-xs text-[#6B7280]">Sponsored By</p>
              <div className="flex flex-wrap gap-2">
                {sec.sponsors.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[#EEF2FF] px-3 py-1 text-sm font-medium"
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

// -- 메인 페이지 --

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "success" | "error" | "warning" | "info" }> = {
  draft:              { label: "준비중",  variant: "default" },
  active:             { label: "모집중",  variant: "info" },
  published:          { label: "모집중",  variant: "info" },
  registration:       { label: "참가접수", variant: "info" },
  registration_open:  { label: "참가접수", variant: "info" },
  registration_closed:{ label: "접수마감", variant: "warning" },
  ongoing:            { label: "진행중",  variant: "success" },
  completed:          { label: "완료",   variant: "default" },
  cancelled:          { label: "취소",   variant: "error" },
};

// -- Skeleton for matches + standings --
function MatchesStandingsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Skeleton className="mb-3 h-5 w-20" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-[16px]" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-12" />
        <Skeleton className="h-48 rounded-[16px]" />
      </div>
    </div>
  );
}

// -- Async component: matches + standings (heaviest queries) --
async function MatchesAndStandings({ tournamentId }: { tournamentId: string }) {
  // 병렬 fetch: 경기 + 팀 순위를 동시에
  const [matches, teams] = await Promise.all([
    prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { team: { select: { name: true } } } },
        awayTeam: { select: { team: { select: { name: true } } } },
      },
    }),
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      orderBy: [{ wins: "desc" }],
      select: {
        id: true,
        wins: true,
        losses: true,
        team: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-3 font-semibold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>최근 경기</h2>
        <div className="space-y-2">
          {matches.map((m) => (
            <Card key={m.id.toString()} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">{m.homeTeam?.team.name ?? "TBD"}</span>
              <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-sm font-bold">
                {m.homeScore}:{m.awayScore}
              </span>
              <span className="text-sm font-medium">{m.awayTeam?.team.name ?? "TBD"}</span>
            </Card>
          ))}
          {matches.length === 0 && (
            <Card className="text-center text-sm text-[#6B7280]">경기가 없습니다.</Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>순위</h2>
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E8ECF0] text-[#6B7280]">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">팀</th>
                <th className="px-4 py-2 text-center">승</th>
                <th className="px-4 py-2 text-center">패</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => (
                <tr key={t.id.toString()} className="border-b border-[#F1F5F9]">
                  <td className="px-4 py-2 font-bold text-[#E31B23]">{i + 1}</td>
                  <td className="px-4 py-2">{t.team.name}</td>
                  <td className="px-4 py-2 text-center">{t.wins ?? 0}</td>
                  <td className="px-4 py-2 text-center">{t.losses ?? 0}</td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-[#6B7280]">
                    팀이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // UUID 형식이 아닌 경우 (예: /tournaments/new) 404 처리
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return notFound();
  }

  // 헤더 정보만 먼저 가져옴 (select로 필요한 필드만)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      description: true,
      startDate: true,
      endDate: true,
      city: true,
      venue_name: true,
      entry_fee: true,
      registration_start_at: true,
      registration_end_at: true,
      categories: true,
      div_caps: true,
      div_fees: true,
      allow_waiting_list: true,
      bank_name: true,
      bank_account: true,
      bank_holder: true,
      maxTeams: true,
      _count: { select: { tournamentTeams: true } },
    },
  });
  if (!tournament) return notFound();

  // 접수 상태 판단
  const now = new Date();
  const regStatuses = ["registration", "registration_open", "active", "published"];
  const isRegStatus = regStatuses.includes(tournament.status ?? "");
  const regOpen = tournament.registration_start_at;
  const regClose = tournament.registration_end_at;
  const isRegistrationOpen = isRegStatus && (!regOpen || regOpen <= now) && (!regClose || regClose >= now);
  const isRegistrationSoon = isRegStatus && regOpen && regOpen > now;

  // 디비전별 등록 현황
  const categories = (tournament.categories ?? {}) as Record<string, string[]>;
  const divCaps = (tournament.div_caps ?? {}) as Record<string, number>;
  const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
  const hasCategories = Object.keys(categories).length > 0;

  let divisionCounts: { division: string | null; _count: { id: number } }[] = [];
  if (hasCategories) {
    const grouped = await prisma.tournamentTeam.groupBy({
      by: ["division"] as const,
      where: { tournamentId: id, status: { in: ["pending", "approved"] } },
      _count: { id: true },
    });
    divisionCounts = grouped;
  }

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
      {/* 헤더 -- 즉시 렌더링 */}
      <Card className="mb-6 rounded-[16px] border border-[#E8ECF0] overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{tournament.name}</h1>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        <p className="mt-2 text-sm text-[#6B7280]">
          {FORMAT_LABEL[tournament.format ?? ""] ?? tournament.format ?? ""}
          {" · "}
          {tournament._count.tournamentTeams}팀
          {tournament.startDate && ` · ${tournament.startDate.toLocaleDateString("ko-KR")}`}
          {tournament.endDate && ` ~ ${tournament.endDate.toLocaleDateString("ko-KR")}`}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {tournament.venue_name && (
            <span className="flex items-center gap-1 text-[#6B7280]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {[tournament.city, tournament.venue_name].filter(Boolean).join(" ")}
            </span>
          )}
          {tournament.entry_fee && Number(tournament.entry_fee) > 0 && (
            <span className="text-[#6B7280]">
              참가비 {Number(tournament.entry_fee).toLocaleString()}원
            </span>
          )}
        </div>
      </Card>

      {/* 접수 정보 + 참가신청 버튼 */}
      {isRegStatus && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">참가접수</h2>
                <Badge variant={isRegistrationOpen ? "success" : isRegistrationSoon ? "info" : "warning"}>
                  {isRegistrationOpen ? "접수중" : isRegistrationSoon ? "접수 예정" : "접수마감"}
                </Badge>
              </div>
              {regOpen && regClose && (
                <p className="mt-1 text-xs text-[#6B7280]">
                  {regOpen.toLocaleDateString("ko-KR")} ~ {regClose.toLocaleDateString("ko-KR")}
                </p>
              )}
              {tournament.entry_fee && Number(tournament.entry_fee) > 0 && (
                <p className="mt-1 text-sm font-medium">
                  참가비 {Number(tournament.entry_fee).toLocaleString()}원
                </p>
              )}
            </div>
            {isRegistrationOpen && (
              <Link
                href={`/tournaments/${id}/join`}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#E31B23] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#C8101E] active:scale-[0.97]"
              >
                참가신청
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            )}
          </div>

          {/* 디비전별 정원 현황 */}
          {hasCategories && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(categories).flatMap(([cat, divs]) =>
                divs.map((div) => {
                  const cap = divCaps[div];
                  const count = divisionCounts.find((d) => d.division === div)?._count.id ?? 0;
                  const remaining = cap ? cap - count : null;
                  const fee = divFees[div] ?? tournament.entry_fee;

                  return (
                    <div
                      key={`${cat}-${div}`}
                      className="rounded-[10px] border border-[#E8ECF0] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B7280]">{cat}</span>
                        {remaining !== null && remaining <= 0 && (
                          <Badge variant={tournament.allow_waiting_list ? "warning" : "error"}>
                            {tournament.allow_waiting_list ? "대기" : "마감"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-bold">{div}</p>
                      {cap && (
                        <div className="mt-1">
                          <div className="flex justify-between text-xs text-[#6B7280]">
                            <span>{count}/{cap}팀</span>
                            {fee && <span>{Number(fee).toLocaleString()}원</span>}
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E8ECF0]">
                            <div
                              className="h-full rounded-full bg-[#1B3C87] transition-all"
                              style={{ width: `${Math.min((count / cap) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Card>
      )}

      {/* 서브 탭 -- 즉시 렌더링 */}
      <div className="mb-6 flex gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const isActiveTab = t.href === `/tournaments/${id}`;
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch={true}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                isActiveTab
                  ? "bg-[#1B3C87] text-white font-semibold"
                  : "border border-[#E8ECF0] text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#111827]"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* 대회 정보 (구조화된 설명) -- 즉시 렌더링 (이미 가져온 데이터) */}
      {tournament.description && (
        <div className="mb-6">
          <DescriptionSections text={tournament.description} />
        </div>
      )}

      {/* 최근 경기 + 순위: Suspense로 스트리밍 (무거운 관계 쿼리 분리) */}
      <Suspense fallback={<MatchesStandingsSkeleton />}>
        <MatchesAndStandings tournamentId={id} />
      </Suspense>
    </div>
  );
}
