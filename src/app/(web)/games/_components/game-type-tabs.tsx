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

export function GameTypeTabs() {
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
            className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-bold whitespace-nowrap transition-colors"
            style={{
              // 활성/비활성 배경·글자색 동시 제어 (hover는 별도 CSS가 어려워 inline에서 onMouseEnter/Leave 대신 Tailwind 유지가 어려움 → 간단하게 둠)
              backgroundColor: isActive ? activeBg : "transparent",
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
          </button>
        );
      })}
    </div>
  );
}
