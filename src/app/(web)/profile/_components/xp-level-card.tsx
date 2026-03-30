"use client";

/**
 * XP 진행률 바 + 레벨 + 칭호 카드
 *
 * 현재 XP와 다음 레벨까지의 진행률을 시각적으로 보여준다.
 * 프로그레스 바가 차오르면서 레벨업 근접감을 제공한다.
 */

import { TossCard } from "@/components/toss/toss-card";

interface XpLevelCardProps {
  xp: number;
  level: number;
  title: string;
  emoji: string;
  progress: number;        // 0~100
  nextLevelXp: number | null;
  xpToNextLevel: number;
}

export function XpLevelCard({
  xp,
  level,
  title,
  emoji,
  progress,
  nextLevelXp,
  xpToNextLevel,
}: XpLevelCardProps) {
  return (
    <TossCard>
      {/* 상단: 레벨 + 칭호 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* 레벨 아이콘 (원형 배경) */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
            }}
          >
            {emoji}
          </div>
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Lv.{level} {title}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {xp.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* 우측: 아이콘 */}
        <span
          className="material-symbols-outlined text-2xl"
          style={{ color: "var(--color-primary)" }}
        >
          military_tech
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div
        className="w-full h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: "var(--color-primary)",
          }}
        />
      </div>

      {/* 하단: 다음 레벨까지 정보 */}
      <div className="flex justify-between mt-2">
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {progress}%
        </p>
        {nextLevelXp ? (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            다음 레벨까지 {xpToNextLevel.toLocaleString()} XP
          </p>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-primary)" }}>
            최대 레벨 달성!
          </p>
        )}
      </div>
    </TossCard>
  );
}
