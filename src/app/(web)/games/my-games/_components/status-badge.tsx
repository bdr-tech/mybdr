/* ============================================================
 * StatusBadge — MyGames 전용 4종 상태 배지
 *
 * 왜: v2 MyGames 시안의 상태 배지는 색 점(●) + 라벨 구조. Q4 확정 기준
 *     DB 4종 상태(confirmed / pending / completed / cancelled)로 단순화.
 *     waitlist / no-show 는 DB에 없으므로 제거.
 *
 * 색상:
 *   - confirmed(확정) → var(--ok) 녹색
 *   - pending(승인 대기) → var(--warn) 주황
 *   - completed(완료) → var(--ink-soft) 무채
 *   - cancelled(취소) → var(--ink-dim) 더 연한 무채
 * ============================================================ */

export type RegStatus = "confirmed" | "pending" | "completed" | "cancelled";

interface StatusConfig {
  label: string;
  color: string; // 텍스트 + 점 색
  bg: string; // 배지 배경 (color-mix 로 투명도 조절)
}

// 4종 상태 매핑 — 시안 statusMap 에서 DB 에 없는 waitlist/no-show 제외
const STATUS_MAP: Record<RegStatus, StatusConfig> = {
  confirmed: {
    label: "참가 확정",
    color: "var(--ok)",
    bg: "color-mix(in srgb, var(--ok) 12%, transparent)",
  },
  pending: {
    label: "승인 대기",
    color: "var(--warn)",
    bg: "color-mix(in srgb, var(--warn) 14%, transparent)",
  },
  completed: {
    label: "완료",
    color: "var(--ink-soft)",
    bg: "var(--bg-alt)",
  },
  cancelled: {
    label: "취소",
    color: "var(--ink-dim)",
    bg: "var(--bg-alt)",
  },
};

export function StatusBadge({ status }: { status: RegStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: ".04em",
        color: s.color,
        background: s.bg,
        borderRadius: 4,
      }}
    >
      {/* 좌측 색 점 — 6px 원형 */}
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.color,
        }}
      />
      {s.label}
    </span>
  );
}
