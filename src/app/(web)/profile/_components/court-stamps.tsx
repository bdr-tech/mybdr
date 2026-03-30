"use client";

/**
 * 도장깨기 진행률 카드
 *
 * 방문한 코트 수와 마일스톤 진행 상황을 시각적으로 보여준다.
 * 달성한 마일스톤은 컬러, 미달성은 회색으로 표시한다.
 */

import { TossCard } from "@/components/toss/toss-card";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

interface Milestone {
  count: number;
  name: string;
  icon: string;
  achieved: boolean;
}

interface CourtStampsProps {
  courtCount: number;
  milestones: Milestone[];
  nextMilestone: Milestone | null;
}

export function CourtStamps({ courtCount, milestones, nextMilestone }: CourtStampsProps) {
  return (
    <div>
      <TossSectionHeader title="도장깨기" actionLabel={`${courtCount}곳 방문`} />
      <TossCard>
        {/* 현재 진행 상황 */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-info) 15%, transparent)",
            }}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: "var(--color-info)" }}
            >
              pin_drop
            </span>
          </div>
          <div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {courtCount}곳
            </p>
            {nextMilestone ? (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                다음 목표: {nextMilestone.count}곳 ({nextMilestone.name})
              </p>
            ) : (
              <p className="text-xs" style={{ color: "var(--color-primary)" }}>
                모든 마일스톤 달성!
              </p>
            )}
          </div>
        </div>

        {/* 다음 마일스톤까지 프로그레스 바 */}
        {nextMilestone && (
          <div className="mb-4">
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((courtCount / nextMilestone.count) * 100, 100)}%`,
                  backgroundColor: "var(--color-info)",
                }}
              />
            </div>
            <p className="text-xs mt-1 text-right" style={{ color: "var(--color-text-muted)" }}>
              {courtCount}/{nextMilestone.count}
            </p>
          </div>
        )}

        {/* 마일스톤 목록 */}
        <div className="space-y-2">
          {milestones.map((m) => (
            <div
              key={m.count}
              className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{
                backgroundColor: m.achieved
                  ? "color-mix(in srgb, var(--color-info) 8%, transparent)"
                  : "var(--color-surface)",
              }}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{
                  color: m.achieved ? "var(--color-info)" : "var(--color-text-disabled)",
                }}
              >
                {m.achieved ? m.icon : "lock"}
              </span>
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: m.achieved
                      ? "var(--color-text-primary)"
                      : "var(--color-text-disabled)",
                  }}
                >
                  {m.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {m.count}곳 방문
                </p>
              </div>
              {m.achieved && (
                <span
                  className="material-symbols-outlined text-base"
                  style={{ color: "var(--color-success)" }}
                >
                  check_circle
                </span>
              )}
            </div>
          ))}
        </div>
      </TossCard>
    </div>
  );
}
