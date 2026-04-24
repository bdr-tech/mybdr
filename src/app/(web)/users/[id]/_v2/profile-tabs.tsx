"use client";

/* ============================================================
 * ProfileTabs — /users/[id] v2 탭 스위처 (개요 / 최근 경기)
 *
 * 왜:
 * - v2 PlayerProfile.jsx L120~137 탭 스위처 재현. PM 확정 D-P5: 2개 탭만 유지
 *   (개요 + 최근 경기). 시즌별 평균·vs 나와의 전적 탭은 제외.
 * - 데이터는 페이지(서버)에서 모두 prefetch 해두고, 클라이언트는 렌더 영역만 토글.
 *   → SSR 유지 + 탭 전환 빠름.
 *
 * 어떻게:
 * - React.useState 로 로컬 state (URL ?tab= 안 씀 — 2개뿐이라 단순화).
 * - v2 시안 스타일: border-bottom 1px + 활성 탭 2px solid cafe-blue 밑줄.
 * - children 은 {overview, games} 두 개의 ReactNode prop 으로 주입.
 * ============================================================ */

import { useState } from "react";
import type { ReactNode } from "react";

export interface ProfileTabsProps {
  overview: ReactNode;
  games: ReactNode;
}

// 탭 정의 (id, label) — 추가/순서 변경 시 여기만 수정
const TABS = [
  { id: "overview", label: "개요" },
  { id: "games", label: "최근 경기" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProfileTabs({ overview, games }: ProfileTabsProps) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <>
      {/* 탭 스위처 */}
      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: "1px solid var(--border)",
          marginBottom: 16,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              style={{
                padding: "12px 18px",
                background: "transparent",
                border: 0,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? "var(--cafe-blue-deep)" : "var(--ink-mute)",
                borderBottom: active ? "2px solid var(--cafe-blue)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 활성 탭의 내용만 렌더 (hidden 처리 대신 조건 렌더 — 초기 렌더 비용 최소) */}
      {tab === "overview" && overview}
      {tab === "games" && games}
    </>
  );
}
