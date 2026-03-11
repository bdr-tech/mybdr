"use client";

import type { WizardFormData, GameType, Permissions, UpgradeReason, RecentGame } from "./game-wizard";

const GAME_TYPES: {
  value: GameType;
  label: string;
  emoji: string;
  desc: string;
  lockCheck: keyof Permissions;
  upgradeReason: UpgradeReason;
}[] = [
  {
    value: "1",
    label: "게스트 모집",
    emoji: "🤝",
    desc: "우리 팀에 합류할 분을 찾아요",
    lockCheck: "canCreatePickup", // 게스트 모집은 제한 없음 (항상 true처럼)
    upgradeReason: "pickup_hosting",
  },
  {
    value: "0",
    label: "픽업 게임",
    emoji: "🏀",
    desc: "자유롭게 모여 나누어 뛰어요",
    lockCheck: "canCreatePickup",
    upgradeReason: "pickup_hosting",
  },
  {
    value: "2",
    label: "팀 대결",
    emoji: "⚔️",
    desc: "팀 간 정식 대결을 열어요",
    lockCheck: "canCreateTeamMatch",
    upgradeReason: "team_creation",
  },
];

interface StepTypeProps {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
  permissions: Permissions;
  onUpgrade: (reason: UpgradeReason) => void;
  recentGames: RecentGame[];
  gamesLoading: boolean;
  onCopyGame: (game: RecentGame) => void;
}

export function StepType({
  data,
  updateData,
  permissions,
  onUpgrade,
  recentGames,
  gamesLoading,
  onCopyGame,
}: StepTypeProps) {
  const handleSelect = (type: (typeof GAME_TYPES)[number]) => {
    // 게스트 모집(value=1)은 항상 허용
    if (type.value !== "1") {
      const canCreate = permissions[type.lockCheck];
      if (!canCreate) {
        onUpgrade(type.upgradeReason);
        return;
      }
    }
    updateData("gameType", type.value);
    // 유형에 따라 기본 인원 조정
    if (type.value === "1") updateData("maxParticipants", 5);
    else if (type.value === "2") updateData("maxParticipants", 5);
    else updateData("maxParticipants", 10);
  };

  const typeLabel = (gt: number) => {
    if (gt === 0) return "픽업 게임";
    if (gt === 1) return "게스트 모집";
    return "팀 대결";
  };

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  return (
    <div aria-live="polite">
      <h2 className="mb-2 text-2xl font-bold text-[#111827]">어떤 경기를 만들까요?</h2>
      <p className="mb-6 text-sm text-[#9CA3AF]">유형을 선택하면 딱 맞는 설정만 보여드려요.</p>

      {/* Game type cards */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
        {GAME_TYPES.map((type) => {
          const isSelected = data.gameType === type.value;
          // 게스트 모집은 잠금 없음
          const isLocked =
            type.value !== "1" && !permissions[type.lockCheck];

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleSelect(type)}
              aria-label={
                isLocked
                  ? `${type.label} - ${type.value === "0" ? "픽업 호스트" : "팀장"} 등급 필요`
                  : type.label
              }
              className={`relative flex items-start gap-3 rounded-[16px] border-2 p-4 text-left transition-all md:flex-col md:items-center md:text-center ${
                isSelected
                  ? "border-[#F4A261] bg-[#F4A261]/10"
                  : isLocked
                    ? "border-[#E8ECF0] bg-[#F5F7FA] opacity-50"
                    : "border-[#E8ECF0] bg-white hover:border-[#F4A261]/50 hover:bg-[#F4A261]/5"
              }`}
            >
              {isLocked && (
                <span className="absolute right-3 top-3 rounded-full bg-[#F4A261]/20 px-2 py-0.5 text-[10px] font-medium text-[#F4A261]">
                  🔒 {type.value === "0" ? "픽업 호스트" : "팀장"}
                </span>
              )}
              {isSelected && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#F4A261] text-[10px] text-white">
                  ✓
                </span>
              )}
              <span className="text-3xl md:text-4xl">{type.emoji}</span>
              <div>
                <span className="block font-semibold text-[#111827]">{type.label}</span>
                <span className="block text-xs text-[#9CA3AF] mt-0.5">{type.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Copy last game */}
      <div className="mt-6">
        {gamesLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[#E8ECF0]" />
            <div className="h-10 w-full animate-pulse rounded-[12px] bg-[#E8ECF0]" />
          </div>
        ) : recentGames.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#F4A261]">
              🔄 지난 경기 복사
            </p>
            <div className="space-y-2">
              {recentGames.map((game, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onCopyGame(game)}
                  className="flex w-full items-center gap-3 rounded-[12px] border border-[#E8ECF0] bg-white px-4 py-3 text-left transition-colors hover:border-[#F4A261]/50 hover:bg-[#F4A261]/5"
                >
                  <span className="text-lg">
                    {game.game_type === 0 ? "🏀" : game.game_type === 1 ? "🤝" : "⚔️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[#111827] truncate">
                      {typeLabel(game.game_type)}
                    </span>
                    <span className="block text-xs text-[#9CA3AF] truncate">
                      {timeSince(game.scheduled_at)}
                      {game.venue_name && ` · ${game.venue_name}`}
                      {!game.venue_name && game.city && ` · ${game.city}`}
                    </span>
                  </div>
                  <span className="text-xs text-[#9CA3AF]">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
