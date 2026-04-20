import type { games } from "@prisma/client";

// 우측 sticky 가격 카드: 가격 + 날짜/시간/잔여석 + 신청버튼 영역 + 약관
// 디자인 시안(bdr_2, bdr_6) 기반 - CSS 변수로 다크/라이트 자동 전환
// 실제 신청 버튼(GameApplyButton 등)은 부모에서 children으로 주입

interface PriceCardProps {
  game: Pick<
    games,
    | "fee_per_person"
    | "entry_fee_note"
    | "scheduled_at"
    | "duration_hours"
    | "max_participants"
    | "current_participants"
  >;
  // 신청/취소 버튼 등 액션 영역을 children으로 받음
  children?: React.ReactNode;
}

export function PriceCard({ game, children }: PriceCardProps) {
  // 참가비 표시 텍스트 결정
  const feeDisplay = game.entry_fee_note
    ? game.entry_fee_note
    : game.fee_per_person && Number(game.fee_per_person) > 0
    ? `${Number(game.fee_per_person).toLocaleString()}`
    : "무료";

  // 원 단위 표시 여부 (숫자 금액일 때만 원/game 표시)
  const isNumericFee = !game.entry_fee_note && game.fee_per_person && Number(game.fee_per_person) > 0;

  // 날짜와 시간을 분리해서 DATE/TIME 카드에 각각 표시
  // 왜: 이전에는 DATE에 "yyyy-mm-dd hh시 mi분 ~ hh시 mi분" 전부 합치고 TIME은 빈 문자열이어서
  //     TIME 카드가 항상 비어 있었음 (구조 낭비 + DATE 시각적 혼잡).
  // 변경: DATE="yyyy-mm-dd (요일)" / TIME="hh:mm ~ hh:mm (N시간)" 구분
  // KST 기준(+9h)은 유지.
  let dateStr = "-";
  let timeStr = "";
  let durationStr = "";
  if (game.scheduled_at) {
    const raw = typeof game.scheduled_at === "string" ? new Date(game.scheduled_at) : game.scheduled_at;
    const start = new Date(raw.getTime() + 9 * 60 * 60 * 1000); // KST
    const y = start.getUTCFullYear();
    const mo = String(start.getUTCMonth() + 1).padStart(2, "0");
    const d = String(start.getUTCDate()).padStart(2, "0");
    const dow = ["일", "월", "화", "수", "목", "금", "토"][start.getUTCDay()];
    const sh = String(start.getUTCHours()).padStart(2, "0");
    const sm = String(start.getUTCMinutes()).padStart(2, "0");

    dateStr = `${y}-${mo}-${d} (${dow})`;

    if (game.duration_hours) {
      const end = new Date(start.getTime() + game.duration_hours * 60 * 60 * 1000);
      const eh = String(end.getUTCHours()).padStart(2, "0");
      const em = String(end.getUTCMinutes()).padStart(2, "0");
      timeStr = `${sh}:${sm} ~ ${eh}:${em}`;
      durationStr = `(${game.duration_hours}시간)`;
    } else {
      timeStr = `${sh}:${sm}`;
    }
  }

  // 잔여석 계산
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const spotsLeft = max > 0 ? max - cur : null;
  // 잔여석이 5명 이하면 긴급 표시
  const isUrgent = spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0;

  return (
    <div className="bg-[var(--color-card)] p-6 rounded-md border border-[var(--color-border)] shadow-lg sticky top-24">
      {/* 가격 영역 */}
      <div className="mb-6">
        <span className="text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-widest">
          Pricing
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-[var(--color-text-primary)]">
            {isNumericFee ? `W${feeDisplay}` : feeDisplay}
          </span>
          {isNumericFee && (
            <span className="text-[var(--color-text-muted)] text-sm">/ game</span>
          )}
        </div>
      </div>

      {/* 정보 리스트 (날짜/시간/잔여석) */}
      <div className="space-y-4 mb-8">
        {/* 날짜 */}
        <div className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-lg">
          <span className="material-symbols-outlined text-[var(--color-accent)]">calendar_today</span>
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">DATE</div>
            <div className="text-sm font-bold text-[var(--color-text-primary)]">{dateStr}</div>
          </div>
        </div>

        {/* 시간 */}
        <div className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-lg">
          <span className="material-symbols-outlined text-[var(--color-accent)]">schedule</span>
          <div>
            <div className="text-xs text-[var(--color-text-muted)]">TIME</div>
            <div className="text-sm font-bold text-[var(--color-text-primary)]">
              {timeStr} {durationStr}
            </div>
          </div>
        </div>

        {/* 잔여석 - 긴급일 때 빨간색 강조 */}
        {spotsLeft !== null && (
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            isUrgent
              ? "bg-red-50 dark:bg-red-900/20 border border-[var(--color-primary)]/10 dark:border-[var(--color-primary)]/30"
              : "bg-[var(--color-surface)]"
          }`}>
            <span className={`material-symbols-outlined ${isUrgent ? "text-[var(--color-primary)]" : "text-[var(--color-accent)]"}`}>
              {isUrgent ? "error" : "group"}
            </span>
            <div>
              <div className={`text-xs font-bold ${isUrgent ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}>
                AVAILABILITY
              </div>
              <div className={`text-sm font-bold ${isUrgent ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"}`}>
                {spotsLeft <= 0
                  ? "마감 (Full)"
                  : `${spotsLeft} spots left!`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 신청 버튼 영역 (부모 컴포넌트에서 주입) */}
      {children}

      {/* 약관 동의 안내 */}
      <p className="mt-4 text-xs text-center text-[var(--color-text-muted)]">
        By applying, you agree to the BDR Sport code of conduct.
      </p>
    </div>
  );
}
