"use client";

/* ============================================================
 * GameTypeTabs — /games 상단 경기 유형 탭
 *
 * 왜 필요한가
 *   플로팅 필터 "유형" select로만 유형을 전환할 수 있어 발견성이 낮음.
 *   상단 탭으로 전체/픽업/게스트/연습경기를 한눈에 전환 가능하게 한다.
 *
 * 동작 원칙
 *   - URL 쿼리의 ?type=0|1|2 로만 상태 관리 (별도 state 없음)
 *   - 활성 탭 배경: TYPE_BADGE[X].bg (GameCard 좌상단 뱃지와 동일 시각 언어)
 *   - "전체" 탭: ?type 파라미터 삭제
 *   - q/date/city/skill 등 다른 필터는 그대로 보존
 *
 * [2026-04-19 추가] 건수 뱃지
 *   - props.counts 로 { "0": N, "1": M, "2": K, all: X } 수신
 *   - 활성 탭: 글자색과 같은 색 + opacity-80
 *   - 비활성 탭: --color-text-muted
 *   - counts 가 undefined 면 숫자 숨김(로딩 중이거나 API 응답 누락 대비)
 *   - 0도 표시(0건임을 사용자가 알 수 있어야 함)
 * ============================================================ */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TYPE_BADGE } from "../_constants/game-badges";

// 탭 정의 — value는 URL ?type 값과 동일. "all"은 type 쿼리 삭제를 의미.
// 활성 스타일은 TYPE_BADGE[number].bg / .color를 그대로 재사용한다.
const TABS: Array<{
  value: "all" | "0" | "1" | "2";
  label: string;
  icon: string;
  // "all" 탭은 TYPE_BADGE에 매핑이 없어 배경/글자색을 직접 지정
  activeBg?: string;
  activeColor?: string;
}> = [
  { value: "all", label: "전체", icon: "list",
    activeBg: "var(--color-text-primary)", activeColor: "var(--color-card)" },
  { value: "0",   label: "픽업게임",   icon: "sports_basketball" },
  { value: "1",   label: "게스트",     icon: "group_add" },
  { value: "2",   label: "연습경기",   icon: "fitness_center" },
];

// [2026-04-19 추가] 건수 뱃지 타입 — games-content.tsx 의 TypeCounts 와 동일 형태
export interface GameTypeTabsCounts {
  "0": number;
  "1": number;
  "2": number;
  all: number;
}

export function GameTypeTabs({ counts }: { counts?: GameTypeTabsCounts }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // 현재 활성 탭 판별
  // ?type 값이 "0"|"1"|"2" 중 하나면 해당 탭, 아니면 "all"
  const rawType = params.get("type");
  const currentType: "all" | "0" | "1" | "2" =
    rawType === "0" || rawType === "1" || rawType === "2" ? rawType : "all";

  // 탭 클릭 시 URL 조작 — type만 교체하고 나머지 쿼리는 보존
  const handleClick = useCallback(
    (value: "all" | "0" | "1" | "2") => {
      const sp = new URLSearchParams(params.toString());
      if (value === "all") {
        sp.delete("type"); // 전체: type 파라미터 삭제
      } else {
        sp.set("type", value);
      }
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, params]
  );

  return (
    // 모바일: 가로 스크롤 (scrollbar-hide는 globals.css의 no-scrollbar 유틸과 동일 목적)
    // gap-2 + 좌우 패딩 없음 (games-content의 컨테이너가 이미 패딩 보유)
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
      {TABS.map((tab) => {
        const isActive = currentType === tab.value;
        // 활성: TYPE_BADGE[value].bg (있으면) / 없으면 탭 자체의 activeBg
        // 비활성: 투명 배경 + 보조 텍스트 색 + hover surface-variant
        const badge =
          tab.value !== "all" ? TYPE_BADGE[Number(tab.value)] : undefined;
        const activeBg = badge?.bg ?? tab.activeBg ?? "var(--color-text-primary)";
        const activeColor = badge?.color ?? tab.activeColor ?? "var(--color-card)";

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleClick(tab.value)}
            aria-pressed={isActive}
            // flex-shrink-0 + whitespace-nowrap: 모바일 가로 스크롤에서 한 줄 유지
            // 비활성 탭 hover: Tailwind className으로 처리 (inline bg가 transparent면 hover: 가 덮어쓸 수 있도록 activeBg는 isActive일 때만 inline 주입)
            className={`flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-bold whitespace-nowrap transition-colors${
              isActive ? "" : " bg-transparent hover:bg-[var(--color-surface-bright)]"
            }`}
            style={{
              // 활성 시에만 inline backgroundColor 주입 — 비활성은 className의 hover가 동작해야 하므로 inline에서 bg를 빼야 함 (inline이 hover: 보다 우선)
              ...(isActive && { backgroundColor: activeBg }),
              color: isActive ? activeColor : "var(--color-text-secondary)",
              borderWidth: isActive ? 0 : 1,
              borderStyle: "solid",
              borderColor: "var(--color-border)",
            }}
          >
            <span className="material-symbols-outlined text-base leading-none">
              {tab.icon}
            </span>
            {tab.label}
            {/* 건수 뱃지: counts 가 있을 때만 표시. 0도 표시해서 사용자가 해당 탭이
                비어 있음을 즉시 인지 가능하게 한다. 레이아웃 흔들림 방지를 위해
                숫자는 같은 span 에 margin-left 로 붙인다. */}
            {counts && (
              <span
                className="tabular-nums text-xs font-bold"
                style={{
                  // 활성: 글자색 상속 + opacity로 톤 다운 → 라벨보다 덜 강조
                  // 비활성: muted 톤 고정 → 라벨과 시각 계층 분리
                  color: isActive ? "inherit" : "var(--color-text-muted)",
                  opacity: isActive ? 0.8 : 1,
                }}
              >
                {tab.value === "all"
                  ? counts.all
                  : counts[tab.value as "0" | "1" | "2"]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
