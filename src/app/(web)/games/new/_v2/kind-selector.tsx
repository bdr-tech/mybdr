"use client";

/* ============================================================
 * KindSelector — BDR v2 경기 종류 선택 카드 (시안 1번 카드)
 *
 * 왜 이 컴포넌트가 필요한가:
 * 기존 위자드는 드롭다운으로 유형을 골랐으나, 시안은 3버튼 카드
 * (픽업/게스트/스크림)로 즉시 보이게끔 변경.
 * - 시안 id값: pickup / guest / scrimmage
 * - DB game_type: 0=픽업 / 1=게스트 / 2=팀대결(=스크림)
 * - 권한 체크는 기존 로직 그대로(UpgradeModal 재사용)
 *
 * 선택 시 화면에서 버튼 테두리 하이라이트(파란색) + 배경 틴트.
 * 권한 부족이면 onUpgrade 콜백을 호출 → 상위에서 모달 오픈.
 * ============================================================ */

import type { GameType, Permissions, UpgradeReason } from "./game-form";

// 시안 3가지 종류 + DB game_type 매핑
const KINDS: {
  value: GameType;
  label: string;
  desc: string;
  lockCheck: keyof Permissions;
  upgradeReason: UpgradeReason;
}[] = [
  // 픽업 — 개인 단위 즉석 경기
  { value: "0", label: "픽업", desc: "개인 단위 즉석 경기", lockCheck: "canCreatePickup", upgradeReason: "pickup_hosting" },
  // 게스트 — 우리 팀에 일회성 게스트 모집 (권한 프리)
  { value: "1", label: "게스트", desc: "우리 팀에 일회성 게스트 모집", lockCheck: "canCreatePickup", upgradeReason: "pickup_hosting" },
  // 스크림 — 팀 vs 팀 연습경기 (= 팀 대결)
  { value: "2", label: "스크림", desc: "팀 vs 팀 연습경기", lockCheck: "canCreateTeamMatch", upgradeReason: "team_creation" },
];

interface KindSelectorProps {
  value: GameType;
  onChange: (v: GameType) => void;
  permissions: Permissions;
  onUpgrade: (reason: UpgradeReason) => void;
}

export function KindSelector({ value, onChange, permissions, onUpgrade }: KindSelectorProps) {
  // 종류 클릭 핸들러 — 권한 체크 후 허용 시에만 onChange 호출
  const handleClick = (k: (typeof KINDS)[number]) => {
    // 게스트(1)는 항상 허용, 나머지는 권한 체크 (기존 로직 유지)
    if (k.value !== "1") {
      const allowed = permissions[k.lockCheck];
      if (!allowed) {
        onUpgrade(k.upgradeReason);
        return;
      }
    }
    onChange(k.value);
  };

  return (
    <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
      {/* 시안 섹션 제목 */}
      <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
        1. 경기 종류
      </h2>

      {/* 3열 버튼 카드 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {KINDS.map((k) => {
          const selected = value === k.value;
          return (
            <button
              key={k.value}
              type="button"
              onClick={() => handleClick(k)}
              style={{
                padding: "16px 14px",
                textAlign: "left",
                cursor: "pointer",
                // 선택 시 cafe-blue 연한 틴트 + 2px 실선 테두리
                background: selected
                  ? "color-mix(in oklab, var(--cafe-blue) 8%, transparent)"
                  : "var(--bg-alt)",
                border: selected
                  ? "2px solid var(--cafe-blue)"
                  : "2px solid var(--border)",
                borderRadius: 8,
                color: "var(--ink)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{k.desc}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
