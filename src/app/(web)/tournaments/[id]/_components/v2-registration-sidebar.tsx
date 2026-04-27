/**
 * V2RegistrationSidebar — Phase 2 Match 상세 v2 사이드바 (래퍼 컴포넌트)
 *
 * 왜 이 컴포넌트가 있는가:
 * 시안 Match.jsx L242~276의 sticky 사이드바는 기존 RegistrationStickyCard와
 * 정보 밀도·시각 톤이 다르다(D-day 대형 숫자, 참가비/상금 2열, 진행바).
 * 기존 컴포넌트를 건드리지 않고 v2 스킨만 새로 만든다.
 *
 * 6상태 CTA 분기 로직은 기존 RegistrationStickyCard와 동일하게 유지:
 *  1) 비로그인 → 로그인 페이지 + next
 *  2) 로그인 + 접수중 → /tournaments/[id]/join
 *  3) 로그인 + 접수중 아님 → 상태 라벨 disabled 버튼
 *
 * 데이터 원칙:
 * - page.tsx가 이미 RegistrationStickyCard에 넘기던 props 그대로 사용
 * - 새 DB 필드 요구 금지 (상금 prize는 시안에만 있는 필드 → 하드코딩 대신 생략)
 *
 * 클라이언트 컴포넌트 아님 — 순수 렌더링(Link만). getWebSession은 서버에서 처리.
 */

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
  // 접수 기간 문자열 (시안 L250) — page.tsx에서 start/end 조합해서 전달
  periodText?: string | null;
}

// ---- 유틸: D-day 계산 (기존과 동일) ----
function computeDaysLeft(endAt: Date): number {
  const now = new Date();
  const diffMs = endAt.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ---- 유틸: 참가비 텍스트 (기존과 동일) ----
function formatFee(entryFee: number | null, divFees: Record<string, number> | null): string {
  const divValues = Object.values(divFees ?? {});
  if (divValues.length > 0) {
    const min = Math.min(...divValues);
    const max = Math.max(...divValues);
    if (min === 0 && max === 0) return "무료";
    if (min === max) return `${min.toLocaleString("ko-KR")}원`;
    return `${min.toLocaleString("ko-KR")}원 ~ ${max.toLocaleString("ko-KR")}원`;
  }
  if (entryFee !== null) {
    if (entryFee === 0) return "무료";
    return `${entryFee.toLocaleString("ko-KR")}원`;
  }
  return "미정";
}

export function V2RegistrationSidebar({
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
  periodText,
}: Props) {
  // ---- D-day 계산 ----
  const daysLeft = registrationEndAt ? computeDaysLeft(registrationEndAt) : null;
  let dDayText: string | null = null;
  let dDayEmphasis = false;
  if (daysLeft !== null) {
    if (daysLeft > 0) dDayText = `D-${daysLeft}`;
    else if (daysLeft === 0) dDayText = "오늘 마감";
    else dDayText = "마감";
    dDayEmphasis = daysLeft >= 0 && daysLeft <= 7;
  }

  // ---- 정원/신청수 ----
  const divCapsMap = divCaps ?? {};
  const totalCapFromDivCaps = Object.values(divCapsMap).reduce((a, b) => a + b, 0);
  const totalCap = totalCapFromDivCaps > 0 ? totalCapFromDivCaps : null;
  const signupCount = divisionCounts.reduce((sum, d) => sum + d._count.id, 0);
  const progressPct = totalCap !== null ? Math.min((signupCount / totalCap) * 100, 100) : null;

  // ---- 참가비 ----
  const feeText = formatFee(entryFee, divFees);

  // ---- CTA 분기 (6상태) ----
  const statusLabel = TOURNAMENT_STATUS_LABEL[status] ?? status;

  // 현재 상태 배너 색상 — 접수중이면 accent, 아니면 ink-dim
  const topLabelColor = isRegistrationOpen ? "var(--accent, #E31B23)" : "var(--ink-dim)";
  const topLabel = isRegistrationOpen
    ? "접수중"
    : statusLabel;

  return (
    // 시안 Match.jsx L243: card padding:0 + overflow:hidden + 3단 구조
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* 상단: 상태 라벨 + D-day 대형 숫자 + 접수 기간 (시안 L244~251) */}
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* 상태 라벨 — 접수중은 accent, 그 외는 회색 */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".1em",
            color: topLabelColor,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {topLabel}
        </div>

        {/* D-day 대형 숫자 + "마감까지" 서브 */}
        {dDayText && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: dDayEmphasis ? "var(--accent, #E31B23)" : "var(--ink)",
                lineHeight: 1,
              }}
            >
              {dDayText}
            </span>
            {daysLeft !== null && daysLeft > 0 && (
              <span style={{ color: "var(--ink-mute)", fontSize: 12 }}>마감까지</span>
            )}
          </div>
        )}

        {/* 접수 기간 — 시안 L250 */}
        {periodText && (
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>{periodText}</div>
        )}
      </div>

      {/* 중단: 참가비 + 신청현황 (시안 L252~270, 상금은 DB 없어 생략) */}
      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 14,
        }}
      >
        {/* 참가비 행 */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontWeight: 600,
              letterSpacing: ".04em",
            }}
          >
            참가비 (팀)
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 2 }}>{feeText}</div>
        </div>

        {/* 접수 현황: 진행바 + 카운트 (시안 L261~269) */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--ink-dim)" }}>접수 현황</span>
            <span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>
              {signupCount}
              {totalCap !== null && `/${totalCap}`}팀
            </span>
          </div>
          {progressPct !== null ? (
            <div
              style={{
                height: 8,
                background: "var(--bg-alt)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  // 90% 넘으면 accent, 아니면 cafe-blue
                  background:
                    progressPct >= 90
                      ? "var(--accent, #E31B23)"
                      : "var(--cafe-blue, #2563eb)",
                }}
              />
            </div>
          ) : (
            // 정원 미정 — 진행바 대신 안내만
            <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>정원 미정</div>
          )}
        </div>
      </div>

      {/* 하단: CTA 버튼 (시안 L271~273) — 6상태 분기 유지 */}
      <div style={{ padding: "0 20px 20px" }}>
        {!isLoggedIn ? (
          <Link
            href={`/login?next=/tournaments/${tournamentId}/join`}
            className="btn btn--primary"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            로그인 후 신청
          </Link>
        ) : isRegistrationOpen ? (
          <Link
            href={`/tournaments/${tournamentId}/join`}
            className="btn btn--primary"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            팀으로 신청하기
          </Link>
        ) : (
          // 접수중 아님 — 상태 라벨 disabled
          <button
            type="button"
            disabled
            className="btn"
            style={{
              display: "block",
              width: "100%",
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "not-allowed",
              opacity: 0.5,
              background: "var(--bg-alt)",
              color: "var(--ink-mute)",
              border: "1px solid var(--border)",
            }}
          >
            {statusLabel}
          </button>
        )}

        {/* 이미 신청한 경우: 내 신청 보기 링크 */}
        {myApplicationsCount > 0 && (
          <Link
            href="/profile/basketball#my-tournaments"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 8,
              padding: "10px",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ok, #10b981)",
              background: "transparent",
              border: "1px dashed var(--ok, #10b981)",
              borderRadius: 4,
              textDecoration: "none",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              check_circle
            </span>
            {myApplicationsCount === 1
              ? "신청 완료 — 내 신청 보기"
              : `${myApplicationsCount}건 신청 완료 — 내 신청 보기`}
          </Link>
        )}
      </div>
    </div>
  );
}
