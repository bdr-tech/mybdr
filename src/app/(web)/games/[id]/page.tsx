import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGame, listGameApplications } from "@/lib/services/game";
import { getUserGameProfile } from "@/lib/services/user";
import { GameApplyButton } from "./apply-button";
import { CancelApplyButton } from "./cancel-apply-button";
import { ProfileIncompleteBanner } from "./profile-banner";
import { PickupDetail } from "./_sections/pickup-detail";
import { GuestDetail } from "./_sections/guest-detail";
import { TeamMatchDetail } from "./_sections/team-match-detail";
import { HostApplications } from "./_components/host-applications";
import { HeroBanner } from "./_components/hero-banner";
import { PriceCard } from "./_components/price-card";
import { HostCard } from "./_components/host-card";
import { ParticipantsGrid } from "./_components/participants-grid";
import { getWebSession } from "@/lib/auth/web-session";
import { getMissingFields } from "@/lib/profile/completion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 30;

// SEO: 경기 상세 동적 메타데이터 — 경기 제목을 DB에서 조회하여 title에 반영
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) return { title: "경기 상세 | MyBDR" };
  return {
    title: `${game.title || "경기 상세"} | MyBDR`,
    description: game.description?.slice(0, 100) || "경기 상세 정보를 확인하고 참가 신청하세요.",
  };
}

// 경기 상태 라벨 매핑 (기존 유지)
const STATUS_LABEL: Record<number, string> = {
  0: "대기",
  1: "모집중",
  2: "마감",
  3: "진행중",
  4: "완료",
  5: "취소",
};

// 경기 타입 라벨 매핑 (기존 유지, 아이콘은 Material Symbols로 변경)
const GAME_TYPE_LABEL: Record<number, { label: string; icon: string }> = {
  0: { label: "픽업", icon: "sports_basketball" },
  1: { label: "게스트 모집", icon: "group_add" },
  2: { label: "팀 대결", icon: "emoji_events" },
};

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Phase 1: 게임 조회 + 세션 확인 병렬 실행 (기존 로직 100% 유지)
  const [game, session] = await Promise.all([
    getGame(id),
    getWebSession(),
  ]);

  if (!game) return notFound();

  // Phase 2: 유저 프로필 + 신청자 목록 병렬 조회 (기존 로직 100% 유지)
  const [userRecord, applications] = await Promise.all([
    session
      ? getUserGameProfile(BigInt(session.sub))
      : Promise.resolve(null),
    listGameApplications(game.id).catch(() => []),
  ]);

  const isHost = session ? game.organizer_id === BigInt(session.sub) : false;
  // 로그인 유저의 신청 여부
  const myApplication = session
    ? applications.find((a) => a.user_id === BigInt(session.sub))
    : null;

  // 프로필 완성 여부 판단 (기존 로직 100% 유지)
  let missingFields: string[] = [];
  let profileCompleted = true;
  let showProfileBanner = false;

  if (session && userRecord) {
    missingFields = getMissingFields({
      name: userRecord.name,
      nickname: userRecord.nickname,
      phone: userRecord.phone,
      position: userRecord.position,
      city: userRecord.city,
    });
    profileCompleted = missingFields.length === 0;

    if (!profileCompleted) {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
      );
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      showProfileBanner =
        !userRecord.profileReminderShownAt ||
        userRecord.profileReminderShownAt < todayStart;
    }
  }

  const gameTypeInfo = GAME_TYPE_LABEL[game.game_type] ?? GAME_TYPE_LABEL[0];
  const statusLabel = STATUS_LABEL[game.status] ?? "대기";

  // 승인된 참가자 목록 (아바타 그리드용)
  const approvedParticipants = applications
    .filter((a) => a.status === 1)
    .map((a) => ({
      id: a.id.toString(),
      nickname: a.users?.nickname ?? null,
      name: a.users?.name ?? null,
    }));

  return (
    <div className="space-y-6">
      {/* 프로필 미완성 안내 배너 (1일 1회) */}
      {showProfileBanner && <ProfileIncompleteBanner />}

      {/* 히어로 배너: 경기장 이미지 + 그라디언트 + MATCH DAY 배지 */}
      <HeroBanner game={game} />

      {/* 경기 타입/상태 배지 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="material-symbols-outlined text-[var(--color-accent)]">
          {gameTypeInfo.icon}
        </span>
        <Badge variant="default">{gameTypeInfo.label}</Badge>
        <Badge
          variant={
            game.status === 1
              ? "success"
              : game.status === 4 || game.status === 5
              ? "error"
              : "default"
          }
        >
          {statusLabel}
        </Badge>
      </div>

      {/* 경기 제목 */}
      <h1
        className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl text-[var(--color-text-primary)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {game.title}
      </h1>

      {/* 설명 */}
      {game.description && (
        <p className="text-sm text-[var(--color-text-muted)]">{game.description}</p>
      )}

      {/* 2열 레이아웃: 메인 콘텐츠 + 우측 가격 카드 */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* 좌측: 메인 콘텐츠 */}
        <div className="space-y-8">
          {/* 게임 타입별 상세 섹션 (Amenities + Rules 스타일) */}
          {game.game_type === 0 && <PickupDetail game={game} />}
          {game.game_type === 1 && <GuestDetail game={game} />}
          {game.game_type === 2 && <TeamMatchDetail game={game} />}

          {/* 참여자 아바타 그리드 (호스트 아닌 경우) */}
          {!isHost && (
            <ParticipantsGrid
              participants={approvedParticipants}
              maxParticipants={game.max_participants}
            />
          )}

          {/* 호스트 신청자 관리 패널 (호스트만 보임) */}
          {isHost && (
            <Card>
              <h2
                className="mb-4 text-lg font-semibold uppercase tracking-wide"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                신청자 관리{" "}
                <span className="text-sm font-normal text-[var(--color-text-muted)]">
                  ({applications.length} / {game.max_participants ?? "~"}명)
                </span>
              </h2>
              <HostApplications
                gameId={id}
                applicants={applications.map((a) => ({
                  id: a.id.toString(),
                  status: a.status,
                  nickname: a.users?.nickname ?? null,
                  name: a.users?.name ?? null,
                  phone: a.users?.phone ?? null,
                  position: a.users?.position ?? null,
                  city: a.users?.city ?? null,
                  district: a.users?.district ?? null,
                }))}
              />
            </Card>
          )}
        </div>

        {/* 우측: 가격 카드 + 호스트 카드 (sticky) */}
        <div className="space-y-6">
          <PriceCard game={game}>
            {/* 신청 버튼: 호스트 제외, 미신청자만 */}
            {session && !isHost && !myApplication && (
              <GameApplyButton
                gameId={id}
                profileCompleted={profileCompleted}
                missingFields={missingFields}
                gameStatus={game.status}
              />
            )}

            {/* 신청 취소 버튼: 대기 상태일 때만 */}
            {session && !isHost && myApplication?.status === 0 && (
              <CancelApplyButton gameId={id} />
            )}

            {/* 이미 승인된 경우 */}
            {session && !isHost && myApplication?.status === 1 && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                참가가 승인되었습니다.
              </div>
            )}

            {/* 비로그인 상태 안내 */}
            {!session && (
              <p className="text-sm text-center text-[var(--color-text-muted)]">
                로그인 후 신청할 수 있습니다.
              </p>
            )}
          </PriceCard>

          {/* 호스트 프로필 카드 */}
          <HostCard organizerName={null} />
        </div>
      </div>
    </div>
  );
}
