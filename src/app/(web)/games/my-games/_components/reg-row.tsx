"use client";

/* ============================================================
 * RegRow — MyGames 통합 신청 카드 (경기 + 대회)
 *
 * 왜 client 컴포넌트:
 *   - "세부정보 ▼" 펼치기 (expanded state)
 *   - QR 티켓 / 후기 / 호스트 문의 버튼 alert (준비 중 기능)
 *   - 결제 버튼은 /pricing/checkout 으로 Link 이동
 *
 * 시안 MyGames.jsx L166-304 의 RegRow 구조를 그대로 이식하되:
 *   - waitlistNum / no-show 분기는 DB 미지원 → 제거 (Q4 4종 상태만)
 *   - teamSize/teamName (대회) 은 Prisma include 로 얻은 값 사용
 *   - fee 문자열은 서버에서 미리 포맷해서 받음 (₩5,000 / 무료)
 *
 * v2 토큰: .card + accent(대회) / cafe-blue(경기) 날짜 블록 배경
 * ============================================================ */

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, type RegStatus } from "./status-badge";

/** 통합 신청 항목 (경기 신청 + 대회 팀 등록 공통) */
export interface RegItem {
  /** 고유 식별자 (prefix 로 kind 구분: "g-{id}" / "t-{id}") */
  id: string;
  /** 경기(game) / 대회(tournament) */
  kind: "game" | "tournament";
  /** 4종 상태 */
  status: RegStatus;
  /** 타이틀 (경기 title / 대회 name) */
  title: string;
  /** 상세 페이지 경로 */
  href: string;
  /** 일시 — 시안은 "2026.04.22 (토) · 19:00" 형태. null 허용 */
  whenText: string | null;
  /** 월·일 숫자 2개 (날짜 블록 표시용) — "04.22" 또는 "--" */
  dateBlockText: string;
  /** 장소 텍스트 (venue · area) */
  placeText: string | null;
  /** 예약 코드 — 시안의 BDR-G-47821 형태. 실DB 없음 → id 기반 생성 */
  code: string;
  /** 신청일 — 시안의 "2026.04.22" */
  appliedText: string;
  /** 참가비 포맷 문자열 (₩5,000 / 무료) */
  fee: string;
  /** 결제 여부 (null = 미결제, true = 완료) */
  paid: boolean;
  /** 역할 — 시안 expanded 영역에서 표시 (player / guest / team-captain) */
  role: "player" | "guest" | "team-captain";
  /** 팀명 (대회일 때) */
  teamName?: string | null;
  /** 시안의 note — DB 에는 game_applications.message / tournamentTeam.registration_note */
  note?: string | null;
}

export function RegRow({ r }: { r: RegItem }) {
  // 세부정보 토글 — 시안 그대로 useState
  const [expanded, setExpanded] = useState(false);

  const isTour = r.kind === "tournament";
  // 대회=accent(red) / 경기=cafe-blue 의 v2 시안 배색
  const dateBlockBg = isTour ? "var(--accent)" : "var(--cafe-blue)";
  // 날짜 블록 상단 라벨 — 대회/게스트/픽업 구분
  const dateBlockTag = isTour ? "대회" : r.role === "guest" ? "게스트" : "픽업";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* 메인 행: 3열 grid (날짜 / 본문 / 액션) */}
      <div
        style={{
          padding: "18px 20px",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 16,
          alignItems: "center",
        }}
      >
        {/* 좌측: 컬러 날짜 블록 (72px 고정폭) */}
        <div
          style={{
            width: 72,
            textAlign: "center",
            padding: "10px 6px",
            background: dateBlockBg,
            color: "#fff",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".1em",
              opacity: 0.85,
            }}
          >
            {dateBlockTag}
          </div>
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 22,
              lineHeight: 1.1,
              marginTop: 4,
            }}
          >
            {r.dateBlockText}
          </div>
        </div>

        {/* 중앙: 본문 (배지/제목/메타) — minWidth:0 으로 truncate 작동 */}
        <div style={{ minWidth: 0 }}>
          {/* 배지 줄 */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <StatusBadge status={r.status} />
            {/* 결제 필요 배지 — 미결제 + 예정 상태일 때만 */}
            {!r.paid && (r.status === "pending" || r.status === "confirmed") && (
              <span
                className="badge"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
              >
                결제 필요
              </span>
            )}
            {/* 결제 완료 배지 — 금액 표시 */}
            {r.paid && (
              <span className="badge badge--ghost">결제완료 {r.fee}</span>
            )}
            {/* 팀명 (대회일 때) */}
            {r.teamName && (
              <span className="badge badge--red">팀 {r.teamName}</span>
            )}
          </div>

          {/* 제목 — Link 로 상세 이동 */}
          <Link
            href={r.href}
            style={{
              display: "block",
              fontWeight: 700,
              fontSize: 15.5,
              color: "var(--ink)",
              marginBottom: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            {r.title}
          </Link>

          {/* 메타 라인 — 일시 / 장소 / 예약번호 (시안의 📅/📍 이모지 그대로) */}
          <div
            style={{
              fontSize: 12.5,
              color: "var(--ink-mute)",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {r.whenText && <span>📅 {r.whenText}</span>}
            {r.placeText && <span>📍 {r.placeText}</span>}
            <span style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-dim)" }}>
              {r.code}
            </span>
          </div>
        </div>

        {/* 우측: 액션 버튼 스택 (140px min) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "stretch",
            minWidth: 140,
          }}
        >
          {/* 상태별 액션 분기 — 시안 그대로 4분기 */}
          {r.status === "confirmed" && (
            <>
              <Link
                href={r.href}
                className="btn btn--primary btn--sm"
                style={{ textAlign: "center", textDecoration: "none" }}
              >
                상세보기
              </Link>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => alert("준비 중인 기능입니다")}
              >
                QR 티켓
              </button>
              <button
                type="button"
                className="btn btn--sm"
                style={{ color: "var(--danger)" }}
                onClick={() => alert("준비 중인 기능입니다")}
              >
                취소하기
              </button>
            </>
          )}
          {r.status === "pending" && (
            <>
              {!r.paid && (
                // 결제하기 — /pricing/checkout 존재 확인됨. 그대로 라우팅.
                <Link
                  href="/pricing/checkout"
                  className="btn btn--accent btn--sm"
                  style={{ textAlign: "center", textDecoration: "none" }}
                >
                  결제하기 · {r.fee}
                </Link>
              )}
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => alert("준비 중인 기능입니다")}
              >
                호스트 문의
              </button>
              <button
                type="button"
                className="btn btn--sm"
                style={{ color: "var(--danger)" }}
                onClick={() => alert("준비 중인 기능입니다")}
              >
                신청 철회
              </button>
            </>
          )}
          {r.status === "completed" && (
            <>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => alert("준비 중인 기능입니다")}
              >
                후기 작성
              </button>
              <Link
                href={r.href}
                className="btn btn--sm"
                style={{ textAlign: "center", textDecoration: "none" }}
              >
                기록 보기
              </Link>
            </>
          )}
          {r.status === "cancelled" && (
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => alert("준비 중인 기능입니다")}
            >
              영수증
            </button>
          )}

          {/* 공통 — 세부정보 토글 */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "transparent",
              border: 0,
              fontSize: 11,
              color: "var(--ink-dim)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            {expanded ? "접기 ▲" : "세부정보 ▼"}
          </button>
        </div>
      </div>

      {/* 펼친 영역 — 4열 grid (신청일/역할/참가비/예약번호) + note 있으면 추가 행 */}
      {expanded && (
        <div
          style={{
            padding: "14px 20px",
            background: "var(--bg-alt)",
            borderTop: "1px solid var(--border)",
            fontSize: 12.5,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          <ExpandCol label="신청일" mono value={r.appliedText || "—"} />
          <ExpandCol
            label="역할"
            value={
              r.role === "guest"
                ? "게스트 지원"
                : r.role === "team-captain"
                  ? `팀장${r.teamName ? ` (${r.teamName})` : ""}`
                  : "개인 참가"
            }
          />
          <ExpandCol
            label="참가비"
            value={`${r.fee} · ${r.paid ? "결제완료" : "미결제"}`}
          />
          <ExpandCol label="예약번호" mono value={r.code} />
          {r.note && (
            <div
              style={{
                gridColumn: "1 / -1",
                marginTop: 4,
                padding: "8px 10px",
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  color: "var(--ink-dim)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                내가 남긴 메모
              </div>
              <div>{r.note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 펼친 영역 컬럼 — 라벨(eyebrow) + 값 */
function ExpandCol({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          color: "var(--ink-dim)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: 600,
          marginTop: 2,
          fontFamily: mono ? "var(--ff-mono)" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
