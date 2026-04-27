"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

/* ============================================================
 * 단체 상세 탭 v2 — 4탭 (?tab= 쿼리 동기화)
 *
 * 이유(왜):
 *  - 시안은 4탭 (소개/소속팀/대회·이벤트/임원진).
 *  - 새로고침/공유 링크에서도 활성 탭이 유지되도록 URL 쿼리에 ?tab=...
 *    을 동기화한다 (서버가 searchParams를 읽어 초기 active 탭을 결정).
 *  - 클라이언트 useState만 쓰면 URL 공유가 깨진다.
 *
 * 방법(어떻게):
 *  - active prop을 부모(Server Component)가 searchParams.tab 으로 결정해 전달
 *  - 클릭 시 router.replace(`?tab=...`) — 페이지 리로드 없이 쿼리만 갱신
 *  - 부모 페이지가 server component라 클릭 시 SSR 재요청 발생 → 시안 상
 *    탭별 컨텐츠는 서버에서 렌더되므로 OK (data가 서로 다른 grid 레이아웃)
 * ============================================================ */

export const ORG_TABS = [
  { key: "overview", label: "소개" },
  { key: "teams", label: "소속팀" },
  { key: "events", label: "대회·이벤트" },
  { key: "members", label: "임원진" },
] as const;

export type OrgTabKey = (typeof ORG_TABS)[number]["key"];

interface OrgTabsV2Props {
  active: OrgTabKey;
}

export function OrgTabsV2({ active }: OrgTabsV2Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleClick = (key: OrgTabKey) => {
    if (key === active) return;
    // 기존 쿼리는 보존 (예: 미래에 ?page= 등 다른 쿼리 추가될 수 있음)
    const params = new URLSearchParams(searchParams.toString());
    if (key === "overview") {
      // 기본 탭이면 ?tab= 자체를 제거해 URL을 깔끔하게 유지
      params.delete("tab");
    } else {
      params.set("tab", key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className="mb-5 flex border-b-2 border-[var(--color-border)]">
      {ORG_TABS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => handleClick(key)}
            className="relative -mb-0.5 cursor-pointer border-0 bg-transparent px-[18px] py-3 text-sm transition-colors"
            style={{
              // 시안: 활성 탭은 cafe-blue 3px 하단 보더 + ink 색
              borderBottom: isActive
                ? "3px solid var(--color-info)"
                : "3px solid transparent",
              color: isActive
                ? "var(--color-text-primary)"
                : "var(--color-text-muted)",
              fontWeight: isActive ? 700 : 500,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
