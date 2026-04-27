"use client";

/* ============================================================
 * KindTabBar — BDR v2 Games 상단 종류 탭
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Games.jsx 시안의 "all / pickup / guest / scrimmage" 4개 탭.
 * 기존 game-type-tabs.tsx 와 기능 동일하지만 v2 시안 스타일(border-bottom
 * 밑줄 탭 + mono 숫자)을 쓰기 위해 별도 구현.
 *
 * 동작:
 * - URL `?type=0|1|2` 로만 상태 관리. "all" 은 ?type 삭제.
 * - 활성: 하단 3px var(--cafe-blue) 밑줄 + ink(최진 텍스트)
 * - 비활성: 투명 밑줄 + ink-mute
 * - counts 가 있으면 라벨 옆 mono 숫자 표시 (0도 표시해 빈 탭 인식)
 * ============================================================ */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// 탭 정의 — value 는 URL ?type 값과 동일. "all" 은 type 쿼리 삭제.
const TABS: Array<{ value: "all" | "0" | "1" | "2"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "0", label: "픽업" },
  { value: "1", label: "게스트 모집" },
  { value: "2", label: "연습경기" },
];

export interface KindTabBarCounts {
  "0": number;
  "1": number;
  "2": number;
  all: number;
}

export interface KindTabBarProps {
  counts?: KindTabBarCounts;
}

export function KindTabBar({ counts }: KindTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // 현재 활성 탭 — ?type 이 유효값이면 해당, 아니면 "all"
  const rawType = params.get("type");
  const currentType: "all" | "0" | "1" | "2" =
    rawType === "0" || rawType === "1" || rawType === "2" ? rawType : "all";

  // 탭 클릭 → URL ?type 교체 (다른 쿼리는 보존)
  const handleClick = useCallback(
    (value: "all" | "0" | "1" | "2") => {
      const sp = new URLSearchParams(params.toString());
      if (value === "all") sp.delete("type");
      else sp.set("type", value);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, params],
  );

  return (
    // v2 시안 스타일 — display:flex + 하단 border 1px, 각 탭의 하단 3px 밑줄로 활성화
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 16,
        borderBottom: "1px solid var(--border)",
        // 모바일에서 가로 스크롤 허용 (탭 4개라 400px 이하에서 간혹 넘칠 수 있음)
        overflowX: "auto",
        // 스크롤바 숨김 — globals.css 의 no-scrollbar 유틸 재사용
      }}
      className="no-scrollbar"
    >
      {TABS.map((tab) => {
        const isActive = currentType === tab.value;
        const count =
          counts === undefined
            ? undefined
            : tab.value === "all"
              ? counts.all
              : counts[tab.value as "0" | "1" | "2"];

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleClick(tab.value)}
            aria-pressed={isActive}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              // 활성 탭은 cafe-blue 밑줄 3px, 비활성은 투명 3px(레이아웃 흔들림 방지)
              borderBottom: isActive
                ? "3px solid var(--cafe-blue)"
                : "3px solid transparent",
              color: isActive ? "var(--ink)" : "var(--ink-mute)",
              fontWeight: isActive ? 700 : 500,
              fontSize: 14,
              // border-bottom 이 상위 container 의 1px과 겹치도록 -1px offset
              marginBottom: -1,
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {count !== undefined && (
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  marginLeft: 4,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
