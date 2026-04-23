"use client";

/* ============================================================
 * FilterChipBar — BDR v2 Games 필터 칩 7종
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Games.jsx 시안의 ['오늘','이번주','주말','서울','경기','무료','초보환영']
 * 7개 필터 칩을 1줄(+flex-wrap)로 렌더한다.
 *
 * DQ2 확정안에 따라 동작을 2종류로 나눠 처리:
 *   A. URL 조작 칩 (서버 재요청): 오늘 / 이번주 / 서울 / 경기
 *        - 오늘 ⇄ ?date=today
 *        - 이번주 ⇄ ?date=week
 *        - 서울 ⇄ ?city=서울
 *        - 경기 ⇄ ?city=경기
 *     (활성 상태를 토글 방식으로 운용 — 같은 칩 재클릭 시 쿼리 삭제)
 *
 *   B. 클라이언트 필터 칩 (부모의 state 수정): 주말 / 무료 / 초보환영
 *        - 부모의 activeClientFilters: Set<"weekend"|"free"|"beginner"> 를 토글
 *        - 실제 필터링은 GamesClient 에서 JS 로 배열을 slice
 *
 * 두 그룹의 활성 판정 근원이 다르므로 판정 로직을 칩 별로 분기한다.
 *
 * 서버 컴포넌트가 아닌 클라이언트("use client") — useSearchParams / useRouter
 * 사용 + 상위 콜백 호출 때문.
 * ============================================================ */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** 클라이언트 전용 필터 키 — 부모가 상태로 관리 */
export type ClientFilterKey = "weekend" | "free" | "beginner";

export interface FilterChipBarProps {
  /** 부모에서 관리하는 현재 활성 클라 필터 집합 */
  activeClientFilters: Set<ClientFilterKey>;
  /** 클라 필터 토글 콜백 — 부모가 Set 업데이트 */
  onToggleClientFilter: (key: ClientFilterKey) => void;
}

// 칩 타입 식별용 상수. URL 그룹은 param 키/값 명시, 클라 그룹은 key.
type ChipDef =
  | {
      kind: "url";
      label: string;
      param: "date" | "city";
      value: string;
    }
  | {
      kind: "client";
      label: string;
      key: ClientFilterKey;
    };

// 시안 원본 순서 유지: 오늘 · 이번주 · 주말 · 서울 · 경기 · 무료 · 초보환영
const CHIPS: ChipDef[] = [
  { kind: "url", label: "오늘", param: "date", value: "today" },
  { kind: "url", label: "이번주", param: "date", value: "week" },
  { kind: "client", label: "주말", key: "weekend" },
  { kind: "url", label: "서울", param: "city", value: "서울" },
  { kind: "url", label: "경기", param: "city", value: "경기" },
  { kind: "client", label: "무료", key: "free" },
  { kind: "client", label: "초보환영", key: "beginner" },
];

export function FilterChipBar({
  activeClientFilters,
  onToggleClientFilter,
}: FilterChipBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // URL 칩 활성 판정 — 현재 query 의 param 값이 칩 value 와 같으면 활성
  // (city 는 부분 매칭 허용. 예: ?city=서울특별시 는 "서울" 칩도 활성으로 본다)
  const isUrlChipActive = useCallback(
    (param: "date" | "city", value: string): boolean => {
      const current = params.get(param);
      if (!current) return false;
      if (param === "city") {
        // "서울" 칩은 "서울특별시" 같은 확장 매칭도 활성으로 처리
        return current.includes(value);
      }
      return current === value;
    },
    [params],
  );

  // URL 칩 클릭 — 활성 상태면 해당 param 삭제(토글), 아니면 주입
  const handleUrlChipClick = useCallback(
    (param: "date" | "city", value: string) => {
      const sp = new URLSearchParams(params.toString());
      const active = isUrlChipActive(param, value);
      if (active) sp.delete(param);
      else sp.set(param, value);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, params, isUrlChipActive],
  );

  return (
    // v2 시안과 동일한 flex + wrap 배치. 모바일에서 줄바꿈 자연스럽게 발생.
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      {CHIPS.map((chip) => {
        const isActive =
          chip.kind === "url"
            ? isUrlChipActive(chip.param, chip.value)
            : activeClientFilters.has(chip.key);

        // 클릭 핸들러 분기
        const handleClick = () => {
          if (chip.kind === "url") {
            handleUrlChipClick(chip.param, chip.value);
          } else {
            onToggleClientFilter(chip.key);
          }
        };

        return (
          <button
            key={chip.label}
            type="button"
            onClick={handleClick}
            className="btn btn--sm"
            aria-pressed={isActive}
            // 활성 칩은 cafe-blue 배경 + 흰 텍스트. 비활성은 기본 .btn.btn--sm 스타일.
            // inline style 로 활성 색상만 주입해서 globals.css 의 hover 등은 유지.
            style={
              isActive
                ? {
                    background: "var(--cafe-blue)",
                    color: "#fff",
                    borderColor: "var(--cafe-blue)",
                  }
                : undefined
            }
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
