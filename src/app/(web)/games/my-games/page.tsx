import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/*
 * W4 M4 후속 정비 (2026-04-20):
 *   "참가 신청한 경기" 섹션은 /profile/activity?tab=games 로 이관 완료.
 *   이 페이지는 "내가 만든 경기"만 다룬다. /my-games 경로는 기존 링크
 *   호환을 위해 유지(redirect 하지 않음 — "만든 경기" 유실 방지).
 *   상단 배너로 통합 뷰 진입 경로를 안내.
 */

export const metadata: Metadata = {
  title: "내 경기 | MyBDR",
  description:
    "내가 만든 경기 현황. 신청한 경기·대회·팀은 내 활동(/profile/activity)에서 확인하세요.",
};

export const dynamic = "force-dynamic";

// 경기 status 코드 → 한글 라벨
const STATUS_LABEL: Record<number, string> = {
  0: "대기",
  1: "모집중",
  2: "마감",
  3: "진행중",
  4: "완료",
  5: "취소",
};

export default async function MyGamesPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  // 내가 만든 경기 (organizer_id 기준)
  const hostedGames = await prisma.games
    .findMany({
      where: { organizer_id: userId },
      orderBy: { scheduled_at: "desc" },
      take: 10,
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        내 경기
      </h1>

      {/* 통합 뷰 진입 배너 — 신청 현황은 /profile/activity 로 일원화 */}
      <Link
        href="/profile/activity?tab=games"
        className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:opacity-90"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-bg-secondary)",
          borderRadius: 4,
          color: "var(--color-text-secondary)",
        }}
      >
        <span>
          신청한 경기·대회·팀을 한 곳에서 보고 싶다면{" "}
          <strong style={{ color: "var(--color-primary)" }}>내 활동 통합 뷰</strong>를 확인하세요.
        </span>
        <span className="material-symbols-outlined text-base" aria-hidden>
          arrow_forward
        </span>
      </Link>

      {/* 내가 만든 경기 */}
      <div>
        <h2
          className="mb-3 text-lg font-semibold uppercase tracking-wide"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          내가 만든 경기
        </h2>
        {hostedGames.length > 0 ? (
          <div className="space-y-2">
            {hostedGames.map((g) => (
              <Link key={g.id.toString()} href={`/games/${g.uuid?.slice(0, 8) ?? g.id}`}>
                <Card className="flex items-center justify-between rounded-[16px] border border-[var(--color-border)] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div>
                    <p className="font-medium">{g.title ?? "제목 없음"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {g.scheduled_at?.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} ·{" "}
                      {g.venue_name ?? g.city ?? "-"}
                    </p>
                  </div>
                  <Badge>{STATUS_LABEL[g.status] ?? "대기"}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center text-[var(--color-text-muted)]">
            <div className="mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-8 w-8 text-[var(--color-text-secondary)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M4.93 4.93l14.14 14.14" />
                <path d="M19.07 4.93A10 10 0 0 1 22 12c0 2.76-1.12 5.26-2.93 7.07" />
                <path d="M4.93 19.07A10 10 0 0 1 2 12c0-2.76 1.12-5.26 2.93-7.07" />
              </svg>
            </div>
            만든 경기가 없습니다.{" "}
            <Link href="/games/new" className="text-[var(--color-primary)] hover:underline">
              경기 만들기
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
