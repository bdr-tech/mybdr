/**
 * EnrollAside — 우측 sticky aside 3카드 박제
 *
 * 왜 이 컴포넌트가 있는가:
 *  시안 TournamentEnroll.jsx L254~280 의 sticky 사이드바 그대로:
 *   1) 포스터 + 디비전 + 참가팀/로스터/참가비 요약
 *   2) D-카운터 (마감까지)
 *   3) 환불 정책 안내 (정적)
 *
 *  D-카운터는 정적으로 박제 (실 마감일 텍스트는 표시하지만,
 *  D-N 숫자는 registration_end_at 으로 실제 계산해서 표시).
 *  환불 정책은 시안 그대로 (D-3/D-2/당일 mock 안내).
 */

import { EnrollPoster } from "./enroll-poster";

interface EnrollAsideProps {
  // 헤더용 대회 정보
  tournamentName: string;
  edition?: string | null;
  // 디비전 카드용 — 선택 안 했으면 null (placeholder 표시)
  selectedDivisionLabel?: string | null;
  selectedDivisionColor?: string | null;
  // 요약용
  teamName?: string | null;
  rosterCount: number;
  feeText: string;
  // D-카운터: 마감일 (없으면 카드 자체 숨김)
  registrationEndAt: Date | null;
}

// D-day 계산 — v2-registration-sidebar.tsx 와 동일 룰
function computeDaysLeft(endAt: Date): number {
  const now = new Date();
  const diff = endAt.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatEndAt(endAt: Date): string {
  // YYYY.MM.DD HH:MM (시안: 2026.05.01 23:59)
  const y = endAt.getFullYear();
  const m = String(endAt.getMonth() + 1).padStart(2, "0");
  const d = String(endAt.getDate()).padStart(2, "0");
  const hh = String(endAt.getHours()).padStart(2, "0");
  const mm = String(endAt.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${d} ${hh}:${mm}`;
}

export function EnrollAside({
  tournamentName,
  edition,
  selectedDivisionLabel,
  selectedDivisionColor,
  teamName,
  rosterCount,
  feeText,
  registrationEndAt,
}: EnrollAsideProps) {
  // D-N 계산 (지났으면 D+N 또는 마감)
  const dDay = registrationEndAt ? computeDaysLeft(registrationEndAt) : null;
  const dDayLabel = (() => {
    if (dDay === null) return null;
    if (dDay > 0) return `D-${dDay}`;
    if (dDay === 0) return "D-DAY";
    return `D+${Math.abs(dDay)}`;
  })();

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "sticky",
        top: 120,
      }}
    >
      {/* 카드 1: 포스터 + 요약 */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <EnrollPoster
          title={tournamentName}
          edition={edition ?? null}
          height={140}
          radius={0}
        />
        <div style={{ padding: "14px 18px" }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--ink-dim)",
              fontWeight: 800,
              letterSpacing: ".12em",
            }}
          >
            디비전
          </div>
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 18,
              fontWeight: 900,
              color: selectedDivisionColor ?? "var(--ink-mute)",
              marginTop: 2,
            }}
          >
            {selectedDivisionLabel ?? "선택 전"}
          </div>
          <div
            style={{
              borderTop: "1px solid var(--border)",
              marginTop: 12,
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--ink-dim)" }}>참가팀</span>
              <span style={{ fontWeight: 700 }}>{teamName ?? "선택 전"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--ink-dim)" }}>로스터</span>
              <span style={{ fontWeight: 700, fontFamily: "var(--ff-mono)" }}>
                {rosterCount}명
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--ink-dim)" }}>참가비</span>
              <span style={{ fontWeight: 700, fontFamily: "var(--ff-mono)" }}>{feeText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 카드 2: D-카운터 (마감일 있을 때만) */}
      {registrationEndAt && (
        <div className="card" style={{ padding: "16px 18px" }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontWeight: 800,
              letterSpacing: ".1em",
              marginBottom: 8,
            }}
          >
            ⏰ 마감까지
          </div>
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 28,
              fontWeight: 900,
              // D-3 이내면 위험 색, 그 외 accent
              color:
                dDay !== null && dDay <= 3
                  ? "var(--err)"
                  : "var(--accent)",
            }}
          >
            {dDayLabel}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
            }}
          >
            {formatEndAt(registrationEndAt)}
          </div>
        </div>
      )}

      {/* 카드 3: 환불 정책 (정적 안내 — DB 없음, 시안 그대로) */}
      <div className="card" style={{ padding: "16px 18px", background: "var(--bg-alt)" }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            fontWeight: 700,
            letterSpacing: ".1em",
            marginBottom: 6,
          }}
        >
          환불 정책
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-soft)",
            lineHeight: 1.6,
          }}
        >
          · D-3 이전: 100%
          <br />
          · D-2 ~ D-1: 50%
          <br />
          · 당일: 환불불가
        </div>
        {/* 정책 안내는 mock — 실 운영시 주최자별 정책 컬럼 도입 예정 */}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px dashed var(--border)",
            fontSize: 10,
            color: "var(--ink-dim)",
          }}
        >
          ※ 기본 안내. 대회별 정책은 운영팀 공지 우선
        </div>
      </div>
    </aside>
  );
}
