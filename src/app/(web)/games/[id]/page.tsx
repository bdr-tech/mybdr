import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameApplyButton } from "./apply-button";
import { CancelApplyButton } from "./cancel-apply-button";
import { ProfileIncompleteBanner } from "./profile-banner";
import { PickupDetail } from "./_sections/pickup-detail";
import { GuestDetail } from "./_sections/guest-detail";
import { TeamMatchDetail } from "./_sections/team-match-detail";
import { HostApplications } from "./_components/host-applications";
import { getWebSession } from "@/lib/auth/web-session";
import { getMissingFields } from "@/lib/profile/completion";

export const revalidate = 30;

const STATUS_LABEL: Record<number, string> = {
  0: "대기",
  1: "모집중",
  2: "마감",
  3: "진행중",
  4: "완료",
  5: "취소",
};

const GAME_TYPE_LABEL: Record<number, { label: string; emoji: string; accent: string }> = {
  0: { label: "픽업",        emoji: "🏀", accent: "#F4A261" },
  1: { label: "게스트 모집",  emoji: "🤝", accent: "#60A5FA" },
  2: { label: "팀 대결",     emoji: "⚔️", accent: "#4ADE80" },
};

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Phase 1: UUID 조회 + 세션 확인 병렬 실행
  const [uuidRows, session] = await Promise.all([
    id.length === 8
      ? prisma.$queryRaw<{ uuid: string }[]>`
          SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
        `.catch(() => [] as { uuid: string }[])
      : Promise.resolve([{ uuid: id }] as { uuid: string }[]),
    getWebSession(),
  ]);

  const fullUuid = uuidRows[0]?.uuid;
  if (!fullUuid) return notFound();

  // Phase 2: 게임 + 유저 프로필 병렬 조회
  const [game, userRecord] = await Promise.all([
    prisma.games.findUnique({ where: { uuid: fullUuid } }).catch(() => null),
    session
      ? prisma.user
          .findUnique({
            where: { id: BigInt(session.sub) },
            select: {
              name: true,
              nickname: true,
              phone: true,
              position: true,
              city: true,
              district: true,
              profile_completed: true,
              profileReminderShownAt: true,
            },
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!game) return notFound();

  // Phase 3: 신청자 목록 조회 (game.id 필요)
  const applications = await prisma.game_applications
    .findMany({
      where: { game_id: game.id },
      include: {
        users: {
          select: { nickname: true, name: true, phone: true, position: true, city: true, district: true },
        },
      },
      orderBy: { created_at: "asc" },
    })
    .catch(() => []);

  const isHost = session ? game.organizer_id === BigInt(session.sub) : false;
  // 로그인 유저의 신청 여부
  const myApplication = session
    ? applications.find((a) => a.user_id === BigInt(session.sub))
    : null;

  // 프로필 완성 여부 판단
  let profileCompleted = true;
  let missingFields: string[] = [];
  let showProfileBanner = false;

  if (session && userRecord) {
    profileCompleted = userRecord.profile_completed;
    missingFields = getMissingFields({
      name: userRecord.name,
      nickname: userRecord.nickname,
      phone: userRecord.phone,
      position: userRecord.position,
      city: userRecord.city,
      district: userRecord.district,
    });

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

  return (
    <div className="space-y-6">
      {/* 프로필 미완성 안내 배너 (1일 1회) */}
      {showProfileBanner && <ProfileIncompleteBanner />}

      {/* 메인 정보 카드 */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xl">{gameTypeInfo.emoji}</span>
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
        <h1 className="mb-4 text-2xl font-bold">{game.title}</h1>

        {/* 게임 타입별 상세 섹션 */}
        {game.game_type === 0 && <PickupDetail game={game} />}
        {game.game_type === 1 && <GuestDetail game={game} />}
        {game.game_type === 2 && <TeamMatchDetail game={game} />}

        {/* 설명 */}
        {game.description && (
          <p className="mt-4 text-sm text-[#6B7280]">{game.description}</p>
        )}

        {/* 신청 버튼: 호스트 본인 제외, 미신청자만 */}
        {session && !isHost && !myApplication && (
          <div className="mt-6">
            <GameApplyButton
              gameId={id}
              profileCompleted={profileCompleted}
              missingFields={missingFields}
              gameStatus={game.status}
            />
          </div>
        )}
        {/* 신청 취소 버튼: 내가 신청한 경우 (대기 상태만) */}
        {session && !isHost && myApplication?.status === 0 && (
          <div className="mt-6">
            <CancelApplyButton gameId={id} />
          </div>
        )}
        {/* 이미 승인된 경우 */}
        {session && !isHost && myApplication?.status === 1 && (
          <div className="mt-6 rounded-[12px] bg-green-50 px-4 py-3 text-sm text-green-700">
            ✅ 참가가 승인되었습니다.
          </div>
        )}
      </Card>

      {/* 호스트 신청자 관리 패널 */}
      {isHost && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">
            신청자 관리{" "}
            <span className="text-sm font-normal text-[#6B7280]">
              ({applications.length} / {game.max_participants ?? "∞"}명)
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

      {/* 일반 참가자 목록 (호스트 제외 모두에게 공개) */}
      {!isHost && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">
            참가자 ({applications.filter((a) => a.status === 1).length} / {game.max_participants ?? "∞"}명)
          </h2>
          {applications.filter((a) => a.status === 1).length > 0 ? (
            <div className="space-y-2">
              {applications
                .filter((a) => a.status === 1)
                .map((a) => (
                  <div
                    key={a.id.toString()}
                    className="flex items-center justify-between rounded-[12px] bg-[#EEF2FF] px-4 py-2"
                  >
                    <span className="text-sm">{a.users?.nickname ?? a.users?.name ?? "익명"}</span>
                    <Badge variant="success">승인</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">아직 승인된 참가자가 없습니다.</p>
          )}
        </Card>
      )}
    </div>
  );
}
