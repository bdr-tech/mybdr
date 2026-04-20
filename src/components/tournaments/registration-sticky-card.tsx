// 대회 상세 페이지 데스크톱(lg+) 우측 sticky 신청 카드.
// 이유:
//   - 모바일은 하단 고정 CTA(lg:hidden, page.tsx L387~)가 이미 존재한다.
//   - 데스크톱에서는 탭(개요/일정/순위/대진)을 전환해도 항상 "참가신청"이 보여야
//     전환율이 오른다. 그래서 페이지 레벨에서 sticky로 부착한다.
//   - 이 컴포넌트는 순수 렌더링(인터랙티브 요소는 Next.js <Link>만). 따라서
//     "use client" 없는 서버 컴포넌트로 두고, 데이터는 page.tsx에서 한 번에 주입한다.
//
// 레이아웃은 부모가 지정한다 (sticky/top-20 등) — 이 파일은 카드 내부만 책임진다.

import Link from "next/link";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";

interface Props {
  tournamentId: string;
  registrationEndAt: Date | null;
  status: string;
  /** Decimal → Number 변환된 값 (page.tsx에서 처리) */
  entryFee: number | null;
  divFees: Record<string, number> | null;
  divCaps: Record<string, number> | null;
  divisionCounts: Array<{ division: string | null; _count: { id: number } }>;
  isRegistrationOpen: boolean;
  myApplicationsCount: number;
  isLoggedIn: boolean;
}

// ----- 유틸: D-day 계산 -----
// 이유: Date 차이를 일(day) 단위로 올림(ceil)해서 "오늘 마감/D-N"을 산출한다.
// Math.ceil을 쓰는 이유 — 마감 직전 몇 시간이 남았을 때 "D-0"이 아니라 "오늘 마감"으로
// 표시하기 위함 (지시문 스펙: daysLeft === 0 → "오늘 마감").
function computeDaysLeft(endAt: Date): number {
  const now = new Date();
  const diffMs = endAt.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ----- 유틸: 금액 표기 -----
// 이유: entryFee / divFees 조합을 한 군데에서 처리한다.
//   - entryFee === 0 → "무료"
//   - divFees가 여러 키를 가지면 min/max 범위 표기 (모두 같으면 단일값)
//   - divFees null이면 entryFee 단일값 사용
//   - 둘 다 null → "미정"
function formatFee(entryFee: number | null, divFees: Record<string, number> | null): string {
  const divValues = Object.values(divFees ?? {});
  if (divValues.length > 0) {
    const min = Math.min(...divValues);
    const max = Math.max(...divValues);
    if (min === 0 && max === 0) return "무료";
    if (min === max) {
      return `${min.toLocaleString("ko-KR")}원`;
    }
    return `${min.toLocaleString("ko-KR")}원 ~ ${max.toLocaleString("ko-KR")}원`;
  }
  if (entryFee !== null) {
    if (entryFee === 0) return "무료";
    return `${entryFee.toLocaleString("ko-KR")}원`;
  }
  return "미정";
}

export function RegistrationStickyCard({
  tournamentId,
  registrationEndAt,
  status,
  entryFee,
  divFees,
  divCaps,
  divisionCounts,
  isRegistrationOpen,
  myApplicationsCount,
  isLoggedIn,
}: Props) {
  // ----- D-day 계산 -----
  // registrationEndAt이 null이면 D-day 표기를 생략한다.
  const daysLeft = registrationEndAt ? computeDaysLeft(registrationEndAt) : null;
  let dDayText: string | null = null;
  let dDayEmphasis = false; // 7일 이내(마감 임박) → BDR Red 강조
  if (daysLeft !== null) {
    if (daysLeft > 0) dDayText = `D-${daysLeft}`;
    else if (daysLeft === 0) dDayText = "오늘 마감";
    else dDayText = "마감";
    // 마감 전(0 이상) 그리고 7일 이내만 강조. 이미 마감(-)은 회색.
    dDayEmphasis = daysLeft >= 0 && daysLeft <= 7;
  }

  // ----- 잔여석 계산 -----
  // 이유: divCaps(디비전별 정원) 합계가 총원. 신청 합계는 divisionCounts를 누적.
  // divCaps이 비어 있으면 0이 반환되어 "{count} / 0팀"이 될 수 있으므로,
  // 빈 객체면 null 취급하여 상위에서 maxTeams fallback을 탄다.
  const divCapsMap = divCaps ?? {};
  const totalCapFromDivCaps = Object.values(divCapsMap).reduce((a, b) => a + b, 0);
  const totalCap = totalCapFromDivCaps > 0 ? totalCapFromDivCaps : null;
  const signupCount = divisionCounts.reduce((sum, d) => sum + d._count.id, 0);
  const remaining = totalCap !== null ? totalCap - signupCount : null;
  const isFull = remaining !== null && remaining <= 0;

  // ----- 참가비 텍스트 -----
  const feeText = formatFee(entryFee, divFees);

  // ----- CTA 라벨/링크 결정 (6가지 상태 분기) -----
  // 1) 비로그인 → /login?next=.../join
  // 2) 로그인 + 접수중 → /tournaments/[id]/join
  // 3) 로그인 + 접수중 아님 → disabled 버튼 + 상태 라벨
  const statusLabel = TOURNAMENT_STATUS_LABEL[status] ?? status;

  return (
    <div
      className="rounded border p-5 space-y-4"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* 제목 */}
      <h3
        className="text-[14px] font-semibold"
        style={{ color: "var(--color-text-muted)" }}
      >
        참가신청
      </h3>

      {/* 정보 행: D-day / 잔여석 / 참가비 */}
      <dl className="space-y-2.5 text-sm">
        {/* D-day (registrationEndAt이 있을 때만) */}
        {dDayText && (
          <div className="flex items-center justify-between">
            <dt style={{ color: "var(--color-text-muted)" }}>마감</dt>
            <dd
              className={
                dDayEmphasis
                  ? "font-bold text-[var(--color-primary)]"
                  : "font-medium"
              }
              style={dDayEmphasis ? undefined : { color: "var(--color-text-muted)" }}
            >
              {dDayText}
            </dd>
          </div>
        )}

        {/* 잔여석 + 총원 */}
        <div className="flex items-center justify-between">
          <dt style={{ color: "var(--color-text-muted)" }}>잔여석</dt>
          <dd className="flex items-center gap-2">
            {totalCap !== null ? (
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                {signupCount} / {totalCap}팀
              </span>
            ) : (
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                {signupCount}팀
              </span>
            )}
            {isFull && (
              // 잔여 0 → 빨강 "마감" 배지
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                }}
              >
                마감
              </span>
            )}
          </dd>
        </div>

        {/* 참가비 */}
        <div className="flex items-center justify-between">
          <dt style={{ color: "var(--color-text-muted)" }}>참가비</dt>
          <dd className="font-medium" style={{ color: "var(--color-text-primary)" }}>
            {feeText}
          </dd>
        </div>
      </dl>

      {/* CTA 버튼: 상태별 분기 */}
      {!isLoggedIn ? (
        // ----- 비로그인: 로그인 페이지로 유도, next 파라미터로 join 경로 보존 -----
        <Link
          href={`/login?next=/tournaments/${tournamentId}/join`}
          className="block w-full rounded py-3 px-4 text-center font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
          }}
        >
          로그인 후 신청
        </Link>
      ) : isRegistrationOpen ? (
        // ----- 로그인 + 접수중: 신청 페이지로 -----
        <Link
          href={`/tournaments/${tournamentId}/join`}
          className="block w-full rounded py-3 px-4 text-center font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
          }}
        >
          신청하기 →
        </Link>
      ) : (
        // ----- 로그인 + 접수중 아님: 상태 라벨 표기 비활성 버튼 -----
        <button
          type="button"
          disabled
          className="w-full rounded py-3 px-4 text-center font-semibold cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-surface-bright)",
            color: "var(--color-text-muted)",
          }}
        >
          {statusLabel}
        </button>
      )}

      {/* 이미 신청한 건이 있으면 하단에 배지 링크. */}
      {/* 스타일 참고: tournament-hero.tsx L176~198 (success 배경 + check_circle 아이콘) */}
      {myApplicationsCount > 0 && (
        <Link
          href="/profile/basketball#my-tournaments"
          className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-bold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--color-success)",
            color: "var(--color-on-primary)", // success 위 텍스트도 primary와 동일 on-color 사용
          }}
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
          {myApplicationsCount === 1
            ? "신청 완료 — 내 신청 보기"
            : `${myApplicationsCount}건 신청 완료 — 내 신청 보기`}
        </Link>
      )}
    </div>
  );
}
