"use client";

/**
 * 연속 출석 연속 출석 카드
 *
 * 불꽃 아이콘 + 연속 일수를 크게 표시한다.
 * 7일 달성 시 보너스 XP 안내 메시지를 보여준다.
 */

import { TossCard } from "@/components/toss/toss-card";

interface StreakCardProps {
  streak: number;
}

export function StreakCard({ streak }: StreakCardProps) {
  // 연속 출석이 0이면 시작 유도 메시지
  if (streak === 0) {
    return (
      <TossCard>
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-3xl"
            style={{ color: "var(--color-text-disabled)" }}
          >
            local_fire_department
          </span>
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              연속 출석 시작하기
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              매일 체크인하면 7일 연속 달성 시 50 XP 보너스!
            </p>
          </div>
        </div>
      </TossCard>
    );
  }

  return (
    <TossCard>
      <div className="flex items-center gap-3">
        {/* 불꽃 아이콘: 연속 출석이 높을수록 강조 */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: streak >= 7
              ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
              : "color-mix(in srgb, var(--color-accent) 15%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{
              color: streak >= 7 ? "var(--color-primary)" : "var(--color-accent)",
            }}
          >
            local_fire_department
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {streak}일
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              연속 출석
            </p>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {streak >= 7
              ? "7일 연속 달성! 보너스 XP 획득!"
              : `${7 - streak}일 더 하면 50 XP 보너스`}
          </p>
        </div>
      </div>
    </TossCard>
  );
}
