import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { CourtCheckin } from "./_components/court-checkin";
import { CourtReviews } from "./_components/court-reviews";
import { CourtReports } from "./_components/court-reports";
import { CourtRankings } from "./_components/court-rankings";
import { CourtEditSuggest } from "./_components/court-edit-suggest";
import { CourtPickups } from "./_components/court-pickups";
import { CourtQrCode } from "./_components/court-qr-code";
import { CourtAmbassador } from "./_components/court-ambassador";
import { CourtEvents } from "./_components/court-events";
// Phase 3 Court 상세 v2 시안 (헤더 + 시간대별 혼잡도 + Side(KakaoMap+시설+CTA))
import { CourtDetailV2 } from "./_components/court-detail-v2";

export const revalidate = 300;

// SEO: 코트 상세 동적 메타데이터
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const court = await prisma.court_infos.findUnique({
    where: { id: BigInt(id) },
    select: { name: true, address: true, city: true, court_type: true },
  }).catch(() => null);
  if (!court) return { title: "코트 상세 | MyBDR" };
  const typeLabel = court.court_type === "indoor" ? "실내" : "야외";
  return {
    title: `${court.name} | MyBDR`,
    description: `${court.name} — ${typeLabel} 농구장. ${court.address}`,
  };
}

type Params = { id: string };

export default async function CourtDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  // 현재 로그인 유저 ID 조회 (리뷰/제보 컴포넌트에 전달)
  const session = await getWebSession();
  const currentUserId = session?.sub ?? undefined;

  // 코트 상세 정보 조회
  const court = await prisma.court_infos.findUnique({
    where: { id: BigInt(id) },
    include: {
      // court_reviews는 CourtReviews 클라이언트 컴포넌트가 SWR로 직접 패치
      court_checkins: {
        orderBy: { created_at: "desc" },
        take: 5,
        include: { users: { select: { nickname: true } } },
      },
    },
  }).catch(() => null);

  if (!court) notFound();

  // 같은 코트 또는 같은 도시의 경기 조회 (최근 5건)
  const relatedGames = await prisma.games.findMany({
    where: {
      OR: [
        { court_id: court.id },
        { city: court.city, district: court.district ?? undefined },
      ],
    },
    orderBy: { scheduled_at: "desc" },
    take: 5,
    select: {
      id: true,
      game_id: true,
      title: true,
      game_type: true,
      scheduled_at: true,
      city: true,
      venue_name: true,
    },
  }).catch(() => []);

  // 같은 장소 이름을 가진 대회 조회 (최근 3건)
  const relatedTournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { venue_name: { contains: court.name } },
        { venue_name: court.name },
        { venue_address: { contains: court.address.split(" ").slice(0, 3).join(" ") } },
      ],
    },
    orderBy: { startDate: "desc" },
    take: 3,
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      venue_name: true,
    },
  }).catch(() => []);

  const facilities = Array.isArray(court.facilities) ? court.facilities as string[] : [];
  const lat = Number(court.latitude);
  const lng = Number(court.longitude);

  // v2 시안 카드용 직렬화 데이터 — page 내부에서만 사용 (BigInt → string, Decimal → number)
  // 이유: 클라 컴포넌트 props 직렬화 제약 + Prisma Decimal/BigInt 노출 차단
  const courtV2Data = {
    id: court.id.toString(),
    name: court.name,
    address: court.address,
    city: court.city,
    district: court.district,
    description: court.description,
    court_type: court.court_type,
    surface_type: court.surface_type,
    hoops_count: court.hoops_count,
    is_free: court.is_free,
    fee: court.fee !== null ? Number(court.fee) : null,
    has_lighting: court.has_lighting,
    lighting_until: court.lighting_until,
    has_restroom: court.has_restroom,
    has_parking: court.has_parking,
    verified: court.verified,
    data_source: court.data_source,
    nearest_station: court.nearest_station,
    facilities,
    average_rating: court.average_rating !== null ? Number(court.average_rating) : null,
    reviews_count: court.reviews_count,
    checkins_count: court.checkins_count,
    pickup_count: 0, // courts 상세 데이터에는 pickup_count 집계 없음. 0 으로 시작 (CourtPickups 가 SWR 로 별도 패치)
    latitude: lat,
    longitude: lng,
    // Phase A 코트 대관 — booking_mode 분기 CTA 표시용
    booking_mode: court.booking_mode,
    rental_url: court.rental_url,
  };

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
    <div>
      {/* 상단 네비게이션 (보존 — v2 브레드크럼과 별개로 모바일 back 동선 유지) */}
      <Link
        href="/courts"
        className="inline-flex items-center gap-1 text-sm mb-4 transition-colors"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        농구장 목록
      </Link>

      {/* ─── Phase 3 Court v2 시안 헤더 + 혼잡도 + Side ─── */}
      {/* 기존 메인 정보 카드(헤더+뱃지+CTA+QR+이용현황) 영역을 v2 시안 1컴포넌트로 교체 */}
      {/* 단, QR 체크인 버튼은 시안 외 핵심 기능 → 별도 박스로 보존 (아래 CourtCheckin 위) */}
      <CourtDetailV2 court={courtV2Data} />

      {/* QR 체크인 버튼 (모달) — 시안 외이지만 운영 핵심 기능이라 보존 */}
      {lat !== 0 && (
        <div className="mb-4 flex justify-end">
          <CourtQrCode courtId={court.id.toString()} courtName={court.name} />
        </div>
      )}

      {/* (구) 메인 정보 카드 영역 — Phase 3 v2 도입으로 CourtDetailV2 컴포넌트로 흡수됨 */}

      {/* 체크인 + 혼잡도 (클라이언트 컴포넌트, 30초 갱신) */}
      <CourtCheckin courtId={court.id.toString()} courtLat={lat} courtLng={lng} />

      {/* 코트 앰배서더 뱃지 + 신청 (클라이언트 컴포넌트 — SWR) */}
      <CourtAmbassador courtId={court.id.toString()} currentUserId={currentUserId} />

      {/* 픽업게임 모집 섹션 (클라이언트 컴포넌트 — SWR) */}
      <CourtPickups courtId={court.id.toString()} currentUserId={currentUserId} />

      {/* 3x3 이벤트 섹션 (클라이언트 컴포넌트 — SWR) */}
      <CourtEvents courtId={court.id.toString()} currentUserId={currentUserId} />

      {/* (구) 이용 현황 3통계 카드 — v2 Side MiniStat 가 흡수. 아래 블록 제거. */}

      {/* 체크인 랭킹 TOP 10 (클라이언트 컴포넌트 — SWR 자동 갱신) */}
      <CourtRankings courtId={court.id.toString()} />

      {/* 근처 경기 섹션 */}
      {relatedGames.length > 0 && (
        <div
          className="rounded-md p-5 sm:p-6 mb-4"
          style={{
            backgroundColor: "var(--color-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
            <span className="material-symbols-outlined text-base align-middle mr-1" style={{ color: "var(--color-primary)" }}>
              sports_basketball
            </span>
            근처 경기 ({relatedGames.length}건)
          </h2>
          <div className="space-y-2">
            {relatedGames.map((game) => (
              <Link
                key={game.id.toString()}
                href={`/games/${game.game_id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {game.title || "경기"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {gameTypeLabel(game.game_type)} · {new Date(game.scheduled_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })}
                  </p>
                </div>
                <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-disabled)" }}>
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 관련 대회 섹션 */}
      {relatedTournaments.length > 0 && (
        <div
          className="rounded-md p-5 sm:p-6 mb-4"
          style={{
            backgroundColor: "var(--color-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
            <span className="material-symbols-outlined text-base align-middle mr-1" style={{ color: "var(--color-navy)" }}>
              emoji_events
            </span>
            이 코트에서 열린 대회 ({relatedTournaments.length}건)
          </h2>
          <div className="space-y-2">
            {relatedTournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {t.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {t.startDate
                      ? new Date(t.startDate).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })
                      : "날짜 미정"}
                  </p>
                </div>
                <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-disabled)" }}>
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 최근 체크인 */}
      {court.court_checkins.length > 0 && (
        <div
          className="rounded-md p-5 sm:p-6 mb-4"
          style={{
            backgroundColor: "var(--color-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
            최근 체크인
          </h2>
          <div className="space-y-2">
            {court.court_checkins.map((c) => (
              <div
                key={c.id.toString()}
                className="flex items-center justify-between text-sm"
              >
                <span style={{ color: "var(--color-text-primary)" }}>
                  {c.users?.nickname ?? "사용자"}
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {new Date(c.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 리뷰 섹션 (클라이언트 컴포넌트 — SWR 자동 갱신) */}
      <CourtReviews courtId={court.id.toString()} currentUserId={currentUserId} />

      {/* 상태 제보 섹션 (클라이언트 컴포넌트) */}
      <CourtReports courtId={court.id.toString()} currentUserId={currentUserId} />

      {/* 유저 위키: 코트 정보 수정 제안 (클라이언트 컴포넌트) */}
      <CourtEditSuggest courtId={court.id.toString()} currentUserId={currentUserId} />
    </div>
  );
}

// (구) InfoBadge / StatBlock — Phase 3 v2 도입으로 CourtDetailV2 가 흡수. 제거.

