"use client";

import type { WizardFormData, GameType, Permissions, UpgradeReason, RecentGame } from "./game-wizard";

/**
 * Step 1. Info (기본 정보)
 * 디자인 시안(bdr_3/bdr_4) 기준으로:
 * - GAME TITLE: 텍스트 입력
 * - TYPE: 드롭다운 (게임 유형 선택)
 * - MAX PLAYERS: 숫자 입력
 * - ENTRY FEE (KRW): 금액 입력 (₩ 접두사)
 * + 지난 경기 복사 기능 유지
 */

// 게임 유형 목록 (드롭다운용)
const GAME_TYPES: {
  value: GameType;
  label: string;
  desc: string;
  lockCheck: keyof Permissions;
  upgradeReason: UpgradeReason;
}[] = [
  {
    value: "1",
    label: "Guest Recruit (게스트 모집)",
    desc: "합류할 분 모집",
    lockCheck: "canCreatePickup",
    upgradeReason: "pickup_hosting",
  },
  {
    value: "0",
    label: "Pickup (픽업)",
    desc: "자유롭게 뛰기",
    lockCheck: "canCreatePickup",
    upgradeReason: "pickup_hosting",
  },
  {
    value: "2",
    label: "Team Match (팀 대결)",
    desc: "정식 대결",
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
  onNext: () => void;
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
  // 유형 변경 시 권한 체크 후 기본 인원 조정
  const handleTypeChange = (value: GameType) => {
    const type = GAME_TYPES.find((t) => t.value === value);
    if (!type) return;

    // 게스트 모집(value=1)은 항상 허용, 나머지는 권한 체크
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
    if (gt === 0) return "Pickup";
    if (gt === 1) return "Guest";
    return "Team";
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
    // 폼 카드 컨테이너 (디자인 시안의 흰색/다크 카드)
    <div className="bg-[var(--color-card)] p-8 rounded-md border border-[var(--color-border)] shadow-sm">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
        Step 1. Info
      </h2>

      <div className="space-y-6">
        {/* GAME TITLE */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            Game Title
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateData("title", e.target.value)}
            placeholder="예: 강남 금요 야간 풋살 매치"
            maxLength={50}
            className="w-full px-4 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-lowest)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-0"
          />
        </div>

        {/* TYPE + MAX PLAYERS (2열) */}
        <div className="grid grid-cols-2 gap-4">
          {/* TYPE 드롭다운 */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
              Type
            </label>
            <select
              value={data.gameType}
              onChange={(e) => handleTypeChange(e.target.value as GameType)}
              className="w-full px-4 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-lowest)] text-[var(--color-text-primary)] text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-0"
            >
              {GAME_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* MAX PLAYERS */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
              Max Players
            </label>
            <input
              type="number"
              value={data.maxParticipants}
              onChange={(e) => updateData("maxParticipants", Math.max(1, Number(e.target.value) || 1))}
              min={1}
              max={100}
              className="w-full px-4 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-lowest)] text-[var(--color-text-primary)] text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* ENTRY FEE (KRW) */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
            Entry Fee (KRW)
          </label>
          <div className="relative">
            {/* ₩ 접두사 */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-bold">
              ₩
            </span>
            <input
              type="number"
              value={data.feePerPerson || ""}
              onChange={(e) => updateData("feePerPerson", Number(e.target.value) || 0)}
              min={0}
              step={1000}
              placeholder="10,000"
              className="w-full pl-8 pr-4 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-lowest)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* 지난 경기 복사 (기존 기능 유지) */}
      <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
        {gamesLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-border)]" />
            <div className="h-10 w-full animate-pulse rounded bg-[var(--color-border)]" />
          </div>
        ) : recentGames.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)]">
              <span className="material-symbols-outlined text-base">content_copy</span>
              지난 경기 복사
            </p>
            <div className="space-y-2">
              {recentGames.map((game, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onCopyGame(game)}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-bright)]"
                >
                  <span className="material-symbols-outlined text-[var(--color-primary)]">
                    {game.game_type === 0 ? "sports_basketball" : game.game_type === 1 ? "group_add" : "swords"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {typeLabel(game.game_type)}
                    </span>
                    <span className="block text-xs text-[var(--color-text-secondary)] truncate">
                      {timeSince(game.scheduled_at)}
                      {game.venue_name && ` · ${game.venue_name}`}
                      {!game.venue_name && game.city && ` · ${game.city}`}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-[var(--color-text-muted)]">arrow_forward</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
