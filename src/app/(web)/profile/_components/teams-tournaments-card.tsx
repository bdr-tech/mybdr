"use client";

/* ============================================================
 * TeamsTournamentsCard — /profile 허브 대시보드 "팀/대회 요약" 카드
 *
 * 왜:
 *  - 허브에서 내 소속팀 개수, 참가 대회 횟수, 다음 경기까지 남은 D-N을
 *    한눈에 보여주기 위함. 상세는 좌측 네비의 "내 농구" 탭에서 확인.
 *
 * 어떻게:
 *  - D-N 계산: KST 기준 오늘 00:00 ~ 경기 시각 차이를 ceil(ms → day).
 *    scheduledAt이 이미 지났으면(음수) "예정된 경기 없음" 처리.
 *  - 아이콘은 Material Symbols (groups / emoji_events / sports_basketball).
 * ============================================================ */

import Link from "next/link";

export interface NextGameSummary {
  id: string;
  title: string | null;
  scheduled_at: string | null; // ISO 문자열
  venue_name: string | null;
}

export interface TeamsTournamentsCardProps {
  teamsCount: number;
  tournamentsCount: number;
  nextGame: NextGameSummary | null;
}

/** D-N 계산 — KST 기준 오늘 자정부터의 일수 차이.
 *  오늘이면 D-0, 내일이면 D-1 ... 과거면 null (카드에서 "없음" 처리). */
function calcDDay(scheduledAtIso: string): number | null {
  const now = new Date();
  const target = new Date(scheduledAtIso);
  if (isNaN(target.getTime())) return null;

  // 한국 시간 기준으로 "오늘 00:00" 계산 (KST offset +09:00)
  // toISOString은 UTC라서 KST로 shift 후 잘라낸다.
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const nowKst = new Date(now.getTime() + KST_OFFSET_MS);
  const targetKst = new Date(target.getTime() + KST_OFFSET_MS);

  const todayKst = Date.UTC(
    nowKst.getUTCFullYear(),
    nowKst.getUTCMonth(),
    nowKst.getUTCDate()
  );
  const targetDay = Date.UTC(
    targetKst.getUTCFullYear(),
    targetKst.getUTCMonth(),
    targetKst.getUTCDate()
  );

  const diffDays = Math.round((targetDay - todayKst) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return null;
  return diffDays;
}

export function TeamsTournamentsCard({
  teamsCount,
  tournamentsCount,
  nextGame,
}: TeamsTournamentsCardProps) {
  const dDay = nextGame?.scheduled_at ? calcDDay(nextGame.scheduled_at) : null;

  return (
    <section
      className="rounded-lg border p-4 sm:p-5"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        borderRadius: "4px",
      }}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          팀 · 대회
        </h2>
        {/* 상세는 내 농구 탭에서 — 바로가기 */}
        <Link
          href="/profile/basketball"
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--color-primary)" }}
        >
          상세보기
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </header>

      <ul className="space-y-2.5 text-sm">
        {/* 1) 소속팀 수 */}
        <Row
          icon="groups"
          label="소속팀"
          value={`${teamsCount}개`}
        />
        {/* 2) 참가 대회 수 */}
        <Row
          icon="emoji_events"
          label="참가 대회"
          value={`${tournamentsCount}회`}
        />
        {/* 3) 다음 경기 — nextGame 있으면 D-N + 제목, 없으면 "예정된 경기 없음" */}
        <Row
          icon="sports_basketball"
          label="다음 경기"
          value={
            nextGame && dDay !== null
              ? dDay === 0
                ? `D-DAY${nextGame.title ? ` · ${nextGame.title}` : ""}`
                : `D-${dDay}${nextGame.title ? ` · ${nextGame.title}` : ""}`
              : "예정된 경기 없음"
          }
          muted={!nextGame}
        />
      </ul>
    </section>
  );
}

/** 한 행 — 아이콘 + 라벨(좌) + 값(우) */
function Row({
  icon,
  label,
  value,
  muted,
}: {
  icon: string;
  label: string;
  value: string;
  // 값이 "없음" 계열일 때 회색 톤
  muted?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span
        className="flex items-center gap-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-base">{icon}</span>
        {label}
      </span>
      <span
        className="text-right font-medium"
        style={{
          color: muted
            ? "var(--color-text-muted)"
            : "var(--color-text-primary)",
        }}
      >
        {value}
      </span>
    </li>
  );
}
