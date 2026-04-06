import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

/**
 * 체육관 상세 페이지 (공개, SEO 최적화)
 * - 서버 컴포넌트로 Prisma 직접 쿼리
 * - 대관 정보, 시설, 위치, 관련 경기 표시
 * - court_infos.id 기반 (slug 필드 없음)
 */

export const revalidate = 300; // 5분 ISR

type PageParams = { slug: string };

// SEO: 동적 메타데이터 생성
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  let courtId: bigint;
  try { courtId = BigInt(slug); } catch { return { title: "체육관 | MyBDR" }; }

  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
    select: { name: true, address: true, court_type: true, rental_available: true },
  }).catch(() => null);

  if (!court) return { title: "체육관 | MyBDR" };

  const typeLabel = court.court_type === "indoor" ? "실내" : "야외";
  const rentalLabel = court.rental_available ? " | 대관 가능" : "";

  return {
    title: `${court.name} | MyBDR`,
    description: `${court.name} — ${typeLabel} 농구장${rentalLabel}. ${court.address}`,
    openGraph: {
      title: `${court.name} | MyBDR`,
      description: `${court.name} — ${typeLabel} 농구장${rentalLabel}`,
    },
  };
}

export default async function VenueDetailPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  let courtId: bigint;
  try { courtId = BigInt(slug); } catch { notFound(); return null; }

  // 코트 상세 조회
  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
  }).catch(() => null);

  if (!court || court.status !== "active") notFound();

  // 관련 다가오는 경기 조회
  const upcomingGames = await prisma.games.findMany({
    where: {
      court_id: court.id,
      scheduled_at: { gte: new Date() },
    },
    orderBy: { scheduled_at: "asc" },
    take: 5,
    select: {
      id: true,
      game_id: true,
      title: true,
      game_type: true,
      scheduled_at: true,
      city: true,
    },
  }).catch(() => []);

  const isIndoor = court.court_type === "indoor";
  const typeLabel = isIndoor ? "실내" : "야외";
  const lat = Number(court.latitude);
  const lng = Number(court.longitude);
  const facilities = Array.isArray(court.facilities) ? court.facilities as string[] : [];

  // 카카오맵 링크
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(court.name)},${lat},${lng}`;

  // 경기 유형 레이블
  const gameTypeLabel = (type: number) => {
    switch (type) {
      case 0: return "픽업게임";
      case 1: return "팀매치";
      case 2: return "대회경기";
      default: return "경기";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 뒤로가기 */}
      <Link
        href="/courts"
        className="inline-flex items-center gap-1 text-sm mb-4 transition-colors"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        농구장 목록
      </Link>

      {/* 히어로 섹션 */}
      <div
        className="rounded-md overflow-hidden mb-6"
        style={{
          background: isIndoor
            ? "linear-gradient(135deg, var(--color-navy, #1B3C87), var(--color-info))"
            : "linear-gradient(135deg, var(--color-primary), #FF6B35)",
        }}
      >
        <div className="p-6 lg:p-8">
          {/* 유형 뱃지 */}
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mb-3"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            <span className="material-symbols-outlined text-sm">
              {isIndoor ? "stadium" : "sports_basketball"}
            </span>
            {typeLabel} 농구장
          </span>

          {/* 체육관 이름 */}
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            {court.name}
          </h1>
          {court.nickname && (
            <p className="text-sm text-white/70 mb-2">{court.nickname}</p>
          )}

          {/* 주소 */}
          <div className="flex items-center gap-1 text-sm text-white/80 mt-2">
            <span className="material-symbols-outlined text-base">location_on</span>
            {court.address}
          </div>

          {/* 평점 + 리뷰 */}
          {court.average_rating && Number(court.average_rating) > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-sm text-yellow-300" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="text-sm text-white font-medium">
                {Number(court.average_rating).toFixed(1)}
              </span>
              <span className="text-xs text-white/60">
                ({court.reviews_count}개 리뷰)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2열 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측: 메인 정보 */}
        <div className="lg:col-span-8 space-y-6">
          {/* 대관 정보 (가장 중요) */}
          {court.rental_available && (
            <section
              className="rounded-lg border p-5"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  대관 정보
                </h2>
                <span
                  className="ml-auto px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--color-success, #22C55E)" }}
                >
                  대관 가능
                </span>
              </div>

              <div className="space-y-3">
                {court.fee && Number(court.fee) > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-text-muted)" }}>payments</span>
                    <div>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>대관 비용</p>
                      <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                        {Number(court.fee).toLocaleString()}원
                      </p>
                    </div>
                  </div>
                )}

                {court.rental_url && (
                  <a
                    href={court.rental_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors active:scale-95 w-full justify-center"
                    style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
                  >
                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                    대관 신청하기
                  </a>
                )}
              </div>
            </section>
          )}

          {/* 설명 */}
          {court.description && (
            <section
              className="rounded-lg border p-5"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>소개</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                {court.description}
              </p>
            </section>
          )}

          {/* 시설 정보 */}
          <section
            className="rounded-lg border p-5"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: "var(--color-info)" }} />
              <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>시설 정보</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* 골대 수 */}
              {court.hoops_count && (
                <InfoChip icon="sports_basketball" label="골대" value={`${court.hoops_count}개`} />
              )}
              {/* 코트 크기 */}
              {court.court_size && (
                <InfoChip icon="straighten" label="코트" value={court.court_size} />
              )}
              {/* 바닥재 */}
              {court.surface_type && (
                <InfoChip icon="texture" label="바닥" value={court.surface_type} />
              )}
              {/* 조명 */}
              <InfoChip
                icon="light"
                label="조명"
                value={court.has_lighting ? "있음" : "없음"}
              />
              {/* 주차장 */}
              <InfoChip
                icon="local_parking"
                label="주차"
                value={court.has_parking ? "가능" : "불가"}
              />
              {/* 화장실 */}
              <InfoChip
                icon="wc"
                label="화장실"
                value={court.has_restroom ? "있음" : "없음"}
              />
              {/* 무료/유료 */}
              <InfoChip
                icon="monetization_on"
                label="이용료"
                value={court.is_free ? "무료" : "유료"}
              />
            </div>

            {/* 추가 시설 */}
            {facilities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {facilities.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }}
                  >
                    {String(f)}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* 다가오는 경기 */}
          {upcomingGames.length > 0 && (
            <section
              className="rounded-lg border p-5"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
                다가오는 경기
              </h2>
              <div className="space-y-2">
                {upcomingGames.map((g) => (
                  <Link
                    key={g.id.toString()}
                    href={`/games/${g.game_id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ backgroundColor: "var(--color-surface)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {g.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {gameTypeLabel(g.game_type)} · {new Date(g.scheduled_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-sm" style={{ color: "var(--color-text-muted)" }}>
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 우측 사이드바 */}
        <div className="lg:col-span-4 space-y-4">
          {/* 위치 */}
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>위치</h3>
            <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
              {court.address}
            </p>
            {court.nearest_station && (
              <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
                <span className="material-symbols-outlined text-sm align-middle mr-1">train</span>
                {court.nearest_station}
              </p>
            )}
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors w-full"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
              }}
            >
              <span className="material-symbols-outlined text-sm">map</span>
              카카오맵에서 보기
            </a>
          </div>

          {/* 체크인 */}
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <h3 className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>활동</h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {court.checkins_count}
                </p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>체크인</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {court.reviews_count}
                </p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>리뷰</p>
              </div>
            </div>
          </div>

          {/* 코트 상세 페이지 링크 */}
          <Link
            href={`/courts/${court.id}`}
            className="flex items-center justify-center gap-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-secondary)",
            }}
          >
            <span className="material-symbols-outlined text-lg">info</span>
            코트 상세 보기 (리뷰/제보/체크인)
          </Link>
        </div>
      </div>
    </div>
  );
}

// 시설 정보 칩 컴포넌트
function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <span className="material-symbols-outlined text-sm" style={{ color: "var(--color-text-muted)" }}>
        {icon}
      </span>
      <div>
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}
