import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const revalidate = 300;

// SEO: 코트 상세 동적 메타데이터 — 코트명을 DB에서 조회하여 title에 반영
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const court = await prisma.court_infos.findUnique({
    where: { id: BigInt(id) },
    select: { name: true, address: true },
  }).catch(() => null);
  if (!court) return { title: "코트 상세 | MyBDR" };
  return {
    title: `${court.name} | MyBDR`,
    description: court.address ? `${court.name} — ${court.address}` : `${court.name} 코트 정보와 리뷰를 확인하세요.`,
  };
}

type Params = { id: string };

export default async function CourtDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const court = await prisma.court_infos.findUnique({
    where: { id: BigInt(id) },
    include: {
      court_reviews: {
        orderBy: { created_at: "desc" },
        take: 10,
        include: { users: { select: { nickname: true } } },
      },
      court_checkins: {
        orderBy: { created_at: "desc" },
        take: 5,
        include: { users: { select: { nickname: true } } },
      },
    },
  }).catch(() => null);

  if (!court) notFound();

  const facilities = Array.isArray(court.facilities) ? court.facilities as string[] : [];

  return (
    <div>
      <div className="mb-6">
        <Link href="/courts" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 코트 목록
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">{court.name}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{court.address}</p>
      </div>

      {/* 기본 정보 */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">코트 정보</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">유형</span>
              <span>{court.court_type === "indoor" ? "실내" : court.court_type === "outdoor" ? "야외" : court.court_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">바닥재</span>
              <span>{court.surface_type ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">골대 수</span>
              <span>{court.hoops_count ?? 2}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">이용료</span>
              <span>
                {court.is_free
                  ? "무료"
                  : court.fee
                  ? `${Number(court.fee).toLocaleString()}원`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">지역</span>
              <span>{court.city}{court.district ? ` ${court.district}` : ""}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">이용 현황</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">평점</span>
              <span>
                {court.average_rating && Number(court.average_rating) > 0
                  ? `⭐ ${Number(court.average_rating).toFixed(1)}`
                  : "평점 없음"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">리뷰 수</span>
              <span>{court.reviews_count}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">체크인 수</span>
              <span>{court.checkins_count}회</span>
            </div>
          </div>

          {facilities.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">편의시설</p>
              <div className="flex flex-wrap gap-1">
                {facilities.map((f, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-[var(--color-surface-bright)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 설명 */}
      {court.description && (
        <Card className="mb-4">
          <h2 className="mb-2 font-semibold">소개</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{court.description}</p>
        </Card>
      )}

      {/* 지도 링크 */}
      {Number(court.latitude) !== 0 && (
        <Card className="mb-4">
          <h2 className="mb-3 font-semibold">위치</h2>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">{court.address}</p>
          <a
            href={`https://map.kakao.com/link/map/${encodeURIComponent(court.name)},${court.latitude},${court.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            카카오맵에서 보기 ↗
          </a>
        </Card>
      )}

      {/* 최근 체크인 */}
      {court.court_checkins.length > 0 && (
        <Card className="mb-4">
          <h2 className="mb-3 font-semibold">최근 체크인</h2>
          <div className="space-y-2">
            {court.court_checkins.map((c) => (
              <div key={c.id.toString()} className="flex items-center justify-between text-sm">
                <span>{c.users?.nickname ?? "사용자"}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {new Date(c.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 리뷰 */}
      <Card>
        <h2 className="mb-3 font-semibold">리뷰 ({court.reviews_count})</h2>
        {court.court_reviews.length > 0 ? (
          <div className="space-y-3">
            {court.court_reviews.map((r) => (
              <div key={r.id.toString()} className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {r.users?.nickname ?? "사용자"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-primary)]">
                      {"⭐".repeat(Math.min(r.rating, 5))}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(r.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
                {r.content && <p className="text-sm text-[var(--color-text-muted)]">{r.content}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">아직 리뷰가 없습니다.</p>
        )}
      </Card>
    </div>
  );
}
