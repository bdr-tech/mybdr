import Link from "next/link";

/**
 * TeamTabsV2
 * ─────────────────────────────────────────────────────────
 * v2 시안 `TeamDetail.jsx`의 탭 네비.
 *
 * 이유(왜): 기존 탭은 빨간 하단선 + text-primary 강조(BDR red 시절 규칙).
 * v2 시안은 `3px solid var(--cafe-blue)` 하단선 + `var(--ink)` 텍스트 +
 * `var(--ink-mute)` 비활성 으로 커뮤니티 계열 스타일과 통일한다.
 *
 * 방법(어떻게):
 * - `border-bottom: 2px solid var(--border)` 컨테이너
 * - 활성 탭: `border-bottom: 3px solid var(--cafe-blue)` + `color: var(--ink)` + `font-weight: 700`
 * - 비활성: transparent border + `var(--ink-mute)` + 500
 * - sticky 적용 (스크롤 시 상단 고정) — 기존 `top-14` 유지
 * - 탭 4종: overview / roster / recent(최근 경기) / stats(기록)
 *   → 기존 라우트 키 `games/tournaments`를 `recent/stats`로 재명명
 *     (URL tab 파라미터는 page.tsx에서 별도 매핑)
 */

type Tab = "overview" | "roster" | "recent" | "stats";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "개요" },
  { key: "roster", label: "로스터" },
  { key: "recent", label: "최근 경기" },
  { key: "stats", label: "기록" },
];

export function TeamTabsV2({
  teamId,
  currentTab,
}: {
  teamId: string;
  currentTab: Tab;
}) {
  return (
    <nav
      className="sticky top-14 z-30 bg-[var(--color-background)]/95 backdrop-blur-sm"
      style={{
        borderBottom: "2px solid var(--border)",
        marginBottom: 20,
      }}
    >
      <div className="flex">
        {TABS.map((t) => {
          const active = currentTab === t.key;
          return (
            <Link
              key={t.key}
              href={`/teams/${teamId}?tab=${t.key}`}
              // scroll=false: sticky 상태에서 탭 전환 시 상단 튐 방지
              scroll={false}
              style={{
                padding: "12px 18px",
                background: "transparent",
                borderBottom: active
                  ? "3px solid var(--cafe-blue)"
                  : "3px solid transparent",
                color: active ? "var(--ink)" : "var(--ink-mute)",
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                textDecoration: "none",
                marginBottom: -2, // 컨테이너 2px border 위에 탭 3px border를 겹쳐 쌓는다
                cursor: "pointer",
                transition: "color 120ms ease",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export type TeamTabKey = Tab;
export const TEAM_TAB_KEYS: Tab[] = TABS.map((t) => t.key);
