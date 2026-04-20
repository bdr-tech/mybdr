import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 왜 SEO 메타: 시리즈 목록은 검색 유입 타겟이므로 title/description 명시
export const metadata: Metadata = {
  title: "대회 시리즈 | MyBDR",
  description: "정기 대회 시리즈를 확인하고 참가하세요.",
};

// 왜 revalidate 300: 시리즈 목록은 변경이 드물어 5분 ISR로 충분
export const revalidate = 300;

export default async function SeriesListPage() {
  // 왜 is_public 필터: 비공개 시리즈가 목록에 노출되지 않도록 차단
  // 왜 created_at desc: 최신 생성 시리즈가 먼저 보이도록 정렬
  const series = await prisma.tournament_series
    .findMany({
      where: { is_public: true },
      orderBy: { created_at: "desc" },
      take: 20,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logo_url: true,
        tournaments_count: true,
      },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-4xl pb-16">
      {/* 목록 페이지 헤더 — 허브와 동일한 볼드 타이포, 과한 통계 블록은 생략 */}
      <div className="mb-6">
        <h1
          className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          시리즈
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          정기적으로 열리는 대회 시리즈를 모아봤습니다.
        </p>
      </div>

      {/* 카드 그리드 — 허브 회차 리스트의 hover 톤을 재사용해 이동 시 이질감 최소화 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => {
          // 왜 이니셜 폴백: 로고 없을 때도 시각적 앵커 유지 (허브의 원형 회차 넘버와 톤 일치)
          const initial = s.name?.trim().charAt(0) ?? "?";
          return (
            <Link key={s.id.toString()} href={`/series/${s.slug}`}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-[var(--color-surface-bright)]">
                <div className="flex items-start gap-3">
                  {/* 로고 또는 이니셜 — 허브 회차 원형과 동일 사이즈/컬러 체계 */}
                  {s.logo_url ? (
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-surface-bright)]">
                      <Image
                        src={s.logo_url}
                        alt={s.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-bright)] text-sm font-bold text-[var(--color-accent)]">
                      {initial}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-semibold">{s.name}</h3>
                      {/* 회차 수 Badge — 허브 Badge 사용 패턴 차용, 한 눈에 규모 파악 */}
                      <Badge variant="default">
                        {s.tournaments_count ?? 0}회
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}

        {series.length === 0 && (
          <Card className="col-span-full py-12 text-center text-[var(--color-text-muted)]">
            <p className="text-sm">등록된 시리즈가 없습니다.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
