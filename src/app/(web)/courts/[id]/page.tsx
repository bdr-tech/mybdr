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
  const isIndoor = court.court_type === "indoor";
  const typeLabel = isIndoor ? "실내" : "야외";
  const lat = Number(court.latitude);
  const lng = Number(court.longitude);

  // 카카오맵 URL
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(court.name)},${lat},${lng}`;
  const kakaoNaviUrl = `https://map.kakao.com/link/to/${encodeURIComponent(court.name)},${lat},${lng}`;

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
      {/* 상단 네비게이션 */}
      <Link
        href="/courts"
        className="inline-flex items-center gap-1 text-sm mb-4 transition-colors"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        농구장 목록
      </Link>

      {/* 메인 정보 카드 */}
      <div
        className="rounded-md p-5 sm:p-6 mb-4"
        style={{
          backgroundColor: "var(--color-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* 코트 이름 + 유형 뱃지 */}
        <div className="flex items-start gap-3">
          {/* 유형 아이콘 */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: isIndoor
                ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
                : "color-mix(in srgb, var(--color-success) 15%, transparent)",
            }}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: isIndoor ? "var(--color-info)" : "var(--color-success)" }}
            >
              {isIndoor ? "stadium" : "park"}
            </span>
          </div>

          <div className="flex-1">
            <h1
              className="text-xl font-extrabold sm:text-2xl"
              style={{ color: "var(--color-text-primary)" }}
            >
              {court.name}
            </h1>
            <p
              className="mt-1 flex items-center gap-1 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="material-symbols-outlined text-base">location_on</span>
              {court.address}
            </p>
          </div>
        </div>

        {/* 속성 뱃지 그리드 — null인 필드는 표시하지 않음 */}
        <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
          {/* 코트 유형 (항상 표시) */}
          <InfoBadge
            icon={isIndoor ? "stadium" : "park"}
            label={court.court_type === "unknown" ? "미분류" : typeLabel}
            color={court.court_type === "unknown" ? "var(--color-text-muted)" : isIndoor ? "var(--color-info)" : "var(--color-success)"}
          />
          {/* 코트 크기 — null이면 숨김 */}
          {court.court_size && (
            <InfoBadge
              icon="square_foot"
              label={court.court_size === "fullcourt" ? "풀코트" : court.court_size === "halfcourt" ? "하프코트" : "3x3"}
              color="var(--color-text-secondary)"
            />
          )}
          {/* 바닥재질 — null이면 숨김 */}
          {court.surface_type && (
            <InfoBadge icon="texture" label={court.surface_type} color="var(--color-text-secondary)" />
          )}
          {/* 골대 수 — null이면 숨김 */}
          {court.hoops_count != null && (
            <InfoBadge
              icon="sports_basketball"
              label={`골대 ${court.hoops_count}개`}
              color="var(--color-text-secondary)"
            />
          )}
          {/* 조명 — null(미확인)이면 숨김, true일 때만 표시 */}
          {court.has_lighting === true && (
            <InfoBadge
              icon="lightbulb"
              label={court.lighting_until ? `조명 ~${court.lighting_until}` : "야간 조명"}
              color="var(--color-accent)"
            />
          )}
          {/* 요금 — null(미확인)이면 숨김 */}
          {court.is_free !== null && (
            <InfoBadge
              icon={court.is_free ? "money_off" : "payments"}
              label={
                court.is_free
                  ? "무료"
                  : court.fee
                  ? `${Number(court.fee).toLocaleString()}원`
                  : "유료"
              }
              color={court.is_free ? "var(--color-success)" : "var(--color-warning)"}
            />
          )}
          {/* 화장실 — null(미확인)이면 숨김, true일 때만 표시 */}
          {court.has_restroom === true && (
            <InfoBadge icon="wc" label="화장실" color="var(--color-text-secondary)" />
          )}
          {/* 주차장 — null(미확인)이면 숨김, true일 때만 표시 */}
          {court.has_parking === true && (
            <InfoBadge icon="local_parking" label="주차" color="var(--color-text-secondary)" />
          )}
          {/* 검증 여부 */}
          {court.verified && (
            <InfoBadge icon="verified" label="검증됨" color="var(--color-info)" />
          )}
          {court.average_rating && Number(court.average_rating) > 0 && (
            <InfoBadge
              icon="star"
              label={`${Number(court.average_rating).toFixed(1)} (${court.reviews_count})`}
              color="var(--color-primary)"
            />
          )}
        </div>

        {/* 정보 출처 표시 — 데이터가 어디서 왔는지 사용자에게 알림 */}
        {court.data_source && (
          <div
            className="mt-3 flex items-center gap-1.5 text-[11px]"
            style={{ color: "var(--color-text-disabled)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
              info
            </span>
            정보 출처: {court.data_source === "manual_curation"
              ? "관리자 직접 확인"
              : court.data_source === "kakao_search"
              ? "카카오맵"
              : court.data_source === "google_places"
              ? "구글맵"
              : court.data_source === "ambassador"
              ? "앰배서더 직접 수정"
              : court.data_source}
            {!court.verified && " (미검증 — 실제와 다를 수 있습니다)"}
          </div>
        )}

        {/* 가까운 역 정보 */}
        {court.nearest_station && (
          <div
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-muted)",
            }}
          >
            <span className="material-symbols-outlined text-base" style={{ color: "var(--color-info)" }}>
              train
            </span>
            {court.nearest_station}
          </div>
        )}

        {/* 소개 */}
        {court.description && (
          <p
            className="mt-4 text-sm leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {court.description}
          </p>
        )}

        {/* 편의시설 */}
        {facilities.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              편의시설
            </p>
            <div className="flex flex-wrap gap-1.5">
              {facilities.map((f, i) => (
                <span
                  key={i}
                  className="rounded-[4px] px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: "var(--color-surface-bright)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 카카오맵 버튼 + QR 체크인 */}
        {lat !== 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5 sm:gap-2">
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[4px] px-4 py-2.5 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: "var(--color-surface-bright)",
                color: "var(--color-text-primary)",
              }}
            >
              <span className="material-symbols-outlined text-base">map</span>
              카카오맵에서 보기
            </a>
            <a
              href={kakaoNaviUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[4px] px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined text-base">directions</span>
              길찾기
            </a>
            {/* QR 코드 체크인 버튼 (모달 열기) */}
            <CourtQrCode courtId={court.id.toString()} courtName={court.name} />
          </div>
        )}
      </div>

      {/* 체크인 + 혼잡도 (클라이언트 컴포넌트, 30초 갱신) */}
      <CourtCheckin courtId={court.id.toString()} courtLat={lat} courtLng={lng} />

      {/* 코트 앰배서더 뱃지 + 신청 (클라이언트 컴포넌트 — SWR) */}
      <CourtAmbassador courtId={court.id.toString()} currentUserId={currentUserId} />

      {/* 픽업게임 모집 섹션 (클라이언트 컴포넌트 — SWR) */}
      <CourtPickups courtId={court.id.toString()} currentUserId={currentUserId} />

      {/* 3x3 이벤트 섹션 (클라이언트 컴포넌트 — SWR) */}
      <CourtEvents courtId={court.id.toString()} currentUserId={currentUserId} />

      {/* 이용 현황 카드 */}
      <div
        className="rounded-md p-5 sm:p-6 mb-4"
        style={{
          backgroundColor: "var(--color-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h2 className="text-base font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          이용 현황
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <StatBlock
            label="평점"
            value={
              court.average_rating && Number(court.average_rating) > 0
                ? Number(court.average_rating).toFixed(1)
                : "-"
            }
          />
          <StatBlock label="리뷰" value={`${court.reviews_count}개`} />
          <StatBlock label="체크인" value={`${court.checkins_count}회`} />
        </div>
      </div>

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

// ─────────────────────────────────────────
// InfoBadge — 속성 뱃지 (아이콘 + 텍스트)
// ─────────────────────────────────────────
function InfoBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[4px] px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{icon}</span>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────
// StatBlock — 통계 블록
// ─────────────────────────────────────────
function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: "var(--color-text-primary)" }}>{value}</p>
    </div>
  );
}
