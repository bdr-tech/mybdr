"use client";

import { useState } from "react";
import { OrgCardV2, type OrgCardData } from "./org-card-v2";

/* ============================================================
 * 단체 목록 V2 — 클라이언트 컨테이너
 *
 * - 종류 필터 chip: 전체 / 리그 / 협회 / 동호회
 *   ⚠️ DB에 kind 필드가 아직 없음 → "전체" 외 클릭 시 alert + 시각적 비활성화
 *      (Phase 3 Orgs에서 organizations.kind 컬럼 추가 후 실제 필터링 구현)
 * - 그리드: auto-fill minmax(300px, 1fr) → 폭 따라 1~3열 자동 배치
 * ============================================================ */

const KINDS = ["전체", "리그", "협회", "동호회"] as const;
type Kind = (typeof KINDS)[number];

export function OrgsListV2({ orgs }: { orgs: OrgCardData[] }) {
  const [filter, setFilter] = useState<Kind>("전체");

  // "전체" 외 클릭 시 준비 중 안내. 실제 필터링은 Phase 3 Orgs까지 보류
  const handleFilterClick = (k: Kind) => {
    if (k === "전체") {
      setFilter("전체");
      return;
    }
    alert("준비 중인 기능입니다");
  };

  return (
    <>
      {/* 필터 chip 그룹 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {KINDS.map((k) => {
          const isActive = filter === k;
          const isDisabled = k !== "전체"; // 전체만 실제 동작
          return (
            <button
              key={k}
              type="button"
              onClick={() => handleFilterClick(k)}
              title={isDisabled ? "준비 중인 기능입니다" : undefined}
              className="rounded border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: isActive
                  ? "var(--color-info)"
                  : "var(--color-surface)",
                color: isActive ? "#fff" : "var(--color-text-primary)",
                borderColor: isActive
                  ? "var(--color-info)"
                  : "var(--color-border)",
                opacity: isDisabled ? 0.55 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* 단체 카드 그리드 */}
      {orgs.length > 0 ? (
        <div
          className="grid gap-3.5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          }}
        >
          {orgs.map((org) => (
            <OrgCardV2 key={org.id} org={org} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--color-text-disabled)]">
            corporate_fare
          </span>
          <p className="mt-2 text-[var(--color-text-muted)]">
            아직 등록된 단체가 없습니다.
          </p>
        </div>
      )}
    </>
  );
}
