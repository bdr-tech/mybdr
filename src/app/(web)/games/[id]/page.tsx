import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameApplyButton } from "./apply-button";

export const revalidate = 30;

const STATUS_LABEL: Record<number, string> = {
  0: "대기",
  1: "모집중",
  2: "마감",
  3: "진행중",
  4: "완료",
  5: "취소",
};

const GAME_TYPE_LABEL: Record<number, { label: string; emoji: string }> = {
  0: { label: "픽업", emoji: "🏀" },
  1: { label: "용병 모집", emoji: "🤝" },
  2: { label: "팀 대결", emoji: "⚔️" },
};

const SKILL_LEVEL_LABEL: Record<string, string> = {
  all: "전체",
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const RECURRENCE_RULE_LABEL: Record<string, string> = {
  weekly: "매주",
  biweekly: "2주마다",
  monthly: "매월",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[#A0A0A0]">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await prisma.games.findUnique({ where: { uuid: id } }).catch(() => null);
  if (!game) return notFound();

  const applications = await prisma.game_applications
    .findMany({
      where: { game_id: game.id },
      include: { users: { select: { nickname: true } } },
    })
    .catch(() => []);

  const gameTypeInfo = GAME_TYPE_LABEL[game.game_type] ?? { label: "픽업", emoji: "🏀" };
  const locationParts = [game.city, game.district, game.venue_name].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(" ") : "-";

  return (
    <div className="space-y-6">
      {/* Main info card */}
      <Card>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xl">{gameTypeInfo.emoji}</span>
              <Badge variant="default">{gameTypeInfo.label}</Badge>
              <Badge>{STATUS_LABEL[game.status] ?? "대기"}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{game.title}</h1>
          </div>
        </div>

        {/* Core details */}
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <InfoRow label="일시" value={game.scheduled_at?.toLocaleString("ko-KR") ?? "-"} />
          <InfoRow
            label="경기 시간"
            value={game.duration_hours ? `${game.duration_hours}시간` : "-"}
          />
          <InfoRow label="장소" value={locationStr} />
          {game.venue_address && (
            <InfoRow label="주소" value={game.venue_address} />
          )}
          <InfoRow
            label="참가비"
            value={game.fee_per_person ? `${game.fee_per_person.toLocaleString()}원` : "무료"}
          />
          <InfoRow
            label="모집 인원"
            value={`${game.min_participants ?? 4}~${game.max_participants ?? 10}명`}
          />
          <InfoRow
            label="기술 수준"
            value={SKILL_LEVEL_LABEL[game.skill_level ?? "all"] ?? game.skill_level ?? "-"}
          />
          <InfoRow
            label="게스트"
            value={game.allow_guests ? "허용" : "불허"}
          />
        </div>

        {/* Uniform colors */}
        {(game.uniform_home_color || game.uniform_away_color) && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-[#A0A0A0]">유니폼</span>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full border border-white/20"
                style={{ backgroundColor: game.uniform_home_color ?? "#FF0000" }}
                title="홈"
              />
              <span className="text-xs text-[#A0A0A0]">홈</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full border border-white/20"
                style={{ backgroundColor: game.uniform_away_color ?? "#0000FF" }}
                title="어웨이"
              />
              <span className="text-xs text-[#A0A0A0]">어웨이</span>
            </div>
          </div>
        )}

        {/* Recurring badge */}
        {game.is_recurring && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-[#A0A0A0]">반복 경기</span>
            <Badge variant="default">
              🔄 {RECURRENCE_RULE_LABEL[game.recurrence_rule ?? ""] ?? game.recurrence_rule}
            </Badge>
          </div>
        )}

        {/* Description */}
        {game.description && (
          <p className="mt-4 text-sm text-[#A0A0A0]">{game.description}</p>
        )}

        {/* Requirements */}
        {game.requirements && (
          <div className="mt-4 rounded-[12px] bg-[#252525] px-4 py-3">
            <p className="mb-1 text-xs text-[#A0A0A0]">참가 조건</p>
            <p className="text-sm">{game.requirements}</p>
          </div>
        )}

        {/* Notes */}
        {game.notes && (
          <div className="mt-3 rounded-[12px] bg-[#252525] px-4 py-3">
            <p className="mb-1 text-xs text-[#A0A0A0]">비고</p>
            <p className="text-sm">{game.notes}</p>
          </div>
        )}

        <div className="mt-6">
          <GameApplyButton gameId={id} />
        </div>
      </Card>

      {/* Participants card */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">
          참가자 ({applications.length} / {game.max_participants ?? "∞"}명)
        </h2>
        {applications.length > 0 ? (
          <div className="space-y-2">
            {applications.map((a) => (
              <div
                key={a.id.toString()}
                className="flex items-center justify-between rounded-[12px] bg-[#252525] px-4 py-2"
              >
                <span className="text-sm">{a.users?.nickname ?? "익명"}</span>
                <Badge
                  variant={
                    a.status === 1 ? "success" : a.status === 2 ? "error" : "default"
                  }
                >
                  {a.status === 1 ? "승인" : a.status === 2 ? "거부" : "대기"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#A0A0A0]">아직 참가 신청이 없습니다.</p>
        )}
      </Card>
    </div>
  );
}
