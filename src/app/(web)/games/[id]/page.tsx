import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameApplyButton } from "./apply-button";
import { ProfileIncompleteBanner } from "./profile-banner";
import { PickupDetail } from "./_sections/pickup-detail";
import { GuestDetail } from "./_sections/guest-detail";
import { TeamMatchDetail } from "./_sections/team-match-detail";
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

  // 8자리 short ID → full UUID
  let game = null;
  if (id.length === 8) {
    const rows = await prisma.$queryRaw<{ uuid: string }[]>`
      SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
    `;
    const fullUuid = rows[0]?.uuid;
    if (fullUuid) {
      game = await prisma.games
        .findUnique({ where: { uuid: fullUuid } })
        .catch(() => null);
    }
  } else {
    game = await prisma.games
      .findUnique({ where: { uuid: id } })
      .catch(() => null);
  }
  if (!game) return notFound();

  // 로그인 유저 → 프로필 완성 여부 확인
  const session = await getWebSession();
  let profileCompleted = true;
  let missingFields: string[] = [];
  let showProfileBanner = false;

  if (session) {
    const user = await prisma.user
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
      .catch(() => null);

    if (user) {
      profileCompleted = user.profile_completed;
      missingFields = getMissingFields({
        name: user.name,
        nickname: user.nickname,
        phone: user.phone,
        position: user.position,
        city: user.city,
        district: user.district,
      });

      // 1일 1회 안내 배너 판단 (KST 기준 오늘 0시)
      if (!profileCompleted) {
        const now = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
        );
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        showProfileBanner =
          !user.profileReminderShownAt ||
          user.profileReminderShownAt < todayStart;
      }
    }
  }

  const applications = await prisma.game_applications
    .findMany({
      where: { game_id: game.id },
      include: { users: { select: { nickname: true } } },
    })
    .catch(() => []);

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

        {/* 신청 버튼 (로그인 유저에게만) */}
        {session && (
          <div className="mt-6">
            <GameApplyButton
              gameId={id}
              profileCompleted={profileCompleted}
              missingFields={missingFields}
              gameStatus={game.status}
            />
          </div>
        )}
      </Card>

      {/* 참가자 카드 */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">
          참가자 ({applications.length} / {game.max_participants ?? "∞"}명)
        </h2>
        {applications.length > 0 ? (
          <div className="space-y-2">
            {applications.map((a) => (
              <div
                key={a.id.toString()}
                className="flex items-center justify-between rounded-[12px] bg-[#EEF2FF] px-4 py-2"
              >
                <span className="text-sm">{a.users?.nickname ?? "익명"}</span>
                <Badge
                  variant={
                    a.status === 1
                      ? "success"
                      : a.status === 2
                      ? "error"
                      : "default"
                  }
                >
                  {a.status === 1 ? "승인" : a.status === 2 ? "거부" : "대기"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280]">아직 참가 신청이 없습니다.</p>
        )}
      </Card>
    </div>
  );
}
