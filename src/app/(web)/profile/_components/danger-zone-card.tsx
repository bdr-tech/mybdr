"use client";

/* ============================================================
 * DangerZoneCard — /profile 허브 대시보드 "위험 영역" 카드
 *
 * 왜:
 *  - 회원 탈퇴 같은 되돌릴 수 없는 액션을 다른 카드들과 시각적으로 분리.
 *  - border를 error 톤으로 살짝 강조해 사용자가 실수로 누르지 않도록.
 *  - 실제 탈퇴 플로우(모달·비밀번호 검증 등)는 이미 /profile/edit 에 구현되어 있으므로
 *    여기서는 #danger 앵커로 이동만 한다. (신규 모달 구현은 스코프 밖)
 * ============================================================ */

import Link from "next/link";

export function DangerZoneCard() {
  return (
    <section
      className="rounded-lg border p-4 sm:p-5"
      // border를 error 톤(연하게)으로 — 하드코딩 금지 규칙에 따라 color-mix로 연하게 섞기
      style={{
        backgroundColor: "var(--color-card)",
        borderColor:
          "color-mix(in srgb, var(--color-error, #EF4444) 40%, var(--color-border))",
        borderRadius: "4px",
      }}
    >
      <header className="mb-2 flex items-center gap-2">
        <span
          className="material-symbols-outlined text-base"
          style={{ color: "var(--color-error, #EF4444)" }}
        >
          warning
        </span>
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--color-error, #EF4444)" }}
        >
          위험 영역
        </h2>
      </header>

      {/* 주의 안내 1줄 */}
      <p
        className="mb-3 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        탈퇴 시 계정 데이터는 복구할 수 없습니다.
      </p>

      {/* 회원 탈퇴 버튼 — /profile/edit 의 탈퇴 섹션으로 앵커 이동 */}
      <Link
        href="/profile/edit#danger"
        className="inline-flex items-center gap-1.5 rounded border px-3 py-2 text-xs font-semibold transition-colors hover:bg-[var(--color-surface)]"
        style={{
          borderColor: "var(--color-error, #EF4444)",
          color: "var(--color-error, #EF4444)",
          borderRadius: "4px",
        }}
      >
        <span className="material-symbols-outlined text-sm">person_remove</span>
        회원 탈퇴
      </Link>
    </section>
  );
}
