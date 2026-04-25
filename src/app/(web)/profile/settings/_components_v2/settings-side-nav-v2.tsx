"use client";

/* ============================================================
 * SettingsSideNavV2 — Settings 좌측 sticky 네비게이션
 *
 * 왜:
 *  - BDR v2 시안 Settings.jsx의 좌측 220px sticky 네비를 그대로 이식.
 *  - 6개 섹션 버튼 (account / profile / notify / privacy / billing / danger).
 *  - URL 쿼리 ?section=... 으로 활성 상태 결정 → 새로고침/공유/뒤로가기 보존.
 *
 * 어떻게:
 *  - 부모(page.tsx)가 activeSection 과 onChange 핸들러를 내려줌.
 *  - 클릭 시 router.replace 로 ?section= 만 갱신 (히스토리 누적 X).
 *  - 시안과 동일하게 active 시 var(--bg-alt) 배경 + ink primary, 비활성은 투명 + ink-soft.
 *  - 아이콘은 Material Symbols Outlined (CLAUDE.md 규칙: lucide-react 금지).
 * ============================================================ */

import type { SectionKey } from "./section-key";

// 시안에서 절제된 6개 섹션. 라벨/아이콘은 시안 그대로.
export const SECTIONS: ReadonlyArray<{
  id: SectionKey;
  label: string;
  // Material Symbols Outlined 아이콘 키 (lucide-react 금지)
  icon: string;
}> = [
  { id: "account", label: "계정", icon: "person" },
  { id: "profile", label: "프로필", icon: "sports_basketball" },
  { id: "notify", label: "알림", icon: "notifications" },
  { id: "privacy", label: "개인정보·공개", icon: "lock" },
  { id: "billing", label: "결제·멤버십", icon: "credit_card" },
  { id: "danger", label: "계정 관리", icon: "warning" },
] as const;

interface Props {
  activeSection: SectionKey;
  onSectionChange: (id: SectionKey) => void;
}

export function SettingsSideNavV2({ activeSection, onSectionChange }: Props) {
  return (
    <nav
      // 시안: 220px 고정 폭, 카드 형태(padding 8), sticky (top:120 — mybdr 헤더 고려해 96 사용)
      className="card"
      style={{
        padding: 8,
        position: "sticky",
        top: 96,
        // 시안 네비는 토큰 css 의 .card 패턴 사용
      }}
      aria-label="설정 카테고리"
    >
      {SECTIONS.map((s) => {
        const active = activeSection === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSectionChange(s.id)}
            // 시안 그대로의 인라인 스타일. 토큰 변수만 사용 (하드코딩 색 금지)
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 12px",
              background: active ? "var(--bg-alt)" : "transparent",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              borderRadius: 6,
              fontWeight: active ? 700 : 500,
              fontSize: 14,
              color: active ? "var(--ink)" : "var(--ink-soft)",
            }}
            aria-current={active ? "page" : undefined}
          >
            <span
              className="material-symbols-outlined"
              // 시안의 16px 이모지 자리에 동등한 비주얼 — 시각적 무게 동일하게
              style={{ fontSize: 18, color: active ? "var(--ink)" : "var(--ink-mute)" }}
              aria-hidden
            >
              {s.icon}
            </span>
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}
