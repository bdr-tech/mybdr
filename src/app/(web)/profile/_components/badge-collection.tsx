"use client";

/**
 * 뱃지 컬렉션 그리드
 *
 * 유저가 획득한 모든 뱃지를 3열 그리드로 보여준다.
 * 뱃지가 없으면 빈 상태 메시지를 표시한다.
 */

import { TossCard } from "@/components/toss/toss-card";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

interface Badge {
  id: string;
  badgeType: string;
  badgeName: string;
  earnedAt: string;
}

interface BadgeCollectionProps {
  badges: Badge[];
}

// 뱃지 타입별 아이콘 매핑
function getBadgeIcon(badgeType: string): string {
  if (badgeType.startsWith("court_explorer_")) return "explore";
  if (badgeType === "streak_7") return "local_fire_department";
  if (badgeType.startsWith("level_")) return "military_tech";
  return "emoji_events";
}

// 뱃지 타입별 색상 매핑
function getBadgeColor(badgeType: string): string {
  if (badgeType.startsWith("court_explorer_")) return "var(--color-info)";
  if (badgeType === "streak_7") return "var(--color-accent)";
  if (badgeType.startsWith("level_")) return "var(--color-primary)";
  return "var(--color-tertiary)";
}

export function BadgeCollection({ badges }: BadgeCollectionProps) {
  return (
    <div>
      <TossSectionHeader
        title="획득 뱃지"
        actionLabel={`${badges.length}개`}
      />
      <TossCard>
        {badges.length === 0 ? (
          // 빈 상태
          <div className="py-6 text-center">
            <span
              className="material-symbols-outlined text-3xl mb-2 block"
              style={{ color: "var(--color-text-disabled)" }}
            >
              emoji_events
            </span>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              아직 획득한 뱃지가 없어요
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              체크인, 리뷰, 제보로 뱃지를 모아보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => {
              const icon = getBadgeIcon(badge.badgeType);
              const color = getBadgeColor(badge.badgeType);

              return (
                <div
                  key={badge.id}
                  className="flex flex-col items-center text-center py-3"
                >
                  {/* 원형 뱃지 아이콘 */}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full mb-2"
                    style={{ backgroundColor: color }}
                  >
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={{ color: "#FFFFFF" }}
                    >
                      {icon}
                    </span>
                  </div>
                  {/* 뱃지 이름 */}
                  <p
                    className="text-xs font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {badge.badgeName}
                  </p>
                  {/* 획득일 */}
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {new Date(badge.earnedAt).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </TossCard>
    </div>
  );
}
