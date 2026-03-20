import { notFound } from "next/navigation";
import { getGame, listGameApplications } from "@/lib/services/game";
import { getUserGameProfile } from "@/lib/services/user";
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

const GAME_TYPE_LABEL: Record<number, { label: string; icon: React.ReactNode; accent: string }> = {
  0: { label: "픽업", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/><path d="M19.07 4.93A10 10 0 0 1 22 12c0 2.76-1.12 5.26-2.93 7.07"/><path d="M4.93 19.07A10 10 0 0 1 2 12c0-2.76 1.12-5.26 2.93-7.07"/></svg>, accent: "#E31B23" },
  1: { label: "게스트 모집", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, accent: "#60A5FA" },
  2: { label: "팀 대결", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 9 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 7 15 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>, accent: "#4ADE80" },
};

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Phase 1: 게임 조회 + 세션 확인 병렬 실행
  const [game, session] = await Promise.all([
    getGame(id),
    getWebSession(),
  ]);

  if (!game) return notFound();

  // Phase 2: 유저 프로필 + 신청자 목록 병렬 조회
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

  // 프로필 완성 여부 판단 — missingFields 기반 실시간 검증
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

  return (
    <div className="space-y-6">
      {/* 프로필 미완성 안내 배너 (1일 1회) */}
      {showProfileBanner && <ProfileIncompleteBanner />}

      {/* 메인 정보 카드 */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[#1B3C87]">{gameTypeInfo.icon}</span>
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
        <h1 className="mb-4 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{game.title}</h1>

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
          <div className="mt-6 flex items-center gap-2 rounded-[12px] bg-green-50 px-4 py-3 text-sm text-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            참가가 승인되었습니다.
          </div>
        )}
      </Card>

      {/* 호스트 신청자 관리 패널 */}
      {isHost && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
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
          <h2 className="mb-4 text-lg font-semibold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
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
