/* ============================================================
 * ApplyPanel — BDR v2 경기 신청 우측 사이드 패널
 *
 * 왜 이 컴포넌트가 있는가:
 * 기존 PriceCard 는 가격 강조 + 버튼 slot 구조였으나, v2 시안은
 *   [상단: 비용 요약] +
 *   [메인: 참가 신청 / 신청 취소 / 승인 상태 CTA] +
 *   [보조 3버튼: 한마디 / 저장 / 문의] +
 *   [하단: 참가자 n/최대]
 * 형태로 응집도 높은 하나의 패널. "한마디/저장/문의"는 DB 연결 없이
 * alert 동작만 배치(PM 확정 — UI만 우선 배치).
 *
 * 클라이언트 컴포넌트 — 기존 GameApplyButton/CancelApplyButton 를
 * 내부에 그대로 재사용해 API/데이터 패칭 경로를 건드리지 않는다.
 * ============================================================ */

"use client";

import { GameApplyButton } from "../apply-button";
import { CancelApplyButton } from "../cancel-apply-button";

export interface ApplyPanelProps {
  gameId: string;
  gameStatus: number;
  /** 비용(원) — 0 / null 이면 "무료" */
  feePerPerson: number | string | null;
  entryFeeNote: string | null;
  maxParticipants: number | null;
  currentParticipants: number | null;
  /** 세션 유무 */
  isLoggedIn: boolean;
  /** 호스트 여부 — 본인이면 신청/취소 CTA 미노출 */
  isHost: boolean;
  /** 내 신청 상태: null(미신청) / 0(대기) / 1(승인) / 2(거절) */
  myApplicationStatus: number | null;
  /** 프로필 완성 여부 (GameApplyButton 필요) */
  profileCompleted: boolean;
  missingFields: string[];
}

export function ApplyPanel({
  gameId,
  gameStatus,
  feePerPerson,
  entryFeeNote,
  maxParticipants,
  currentParticipants,
  isLoggedIn,
  isHost,
  myApplicationStatus,
  profileCompleted,
  missingFields,
}: ApplyPanelProps) {
  const feeNum = feePerPerson != null ? Number(feePerPerson) : 0;
  const isFree = !feePerPerson || feeNum === 0;
  const cur = currentParticipants ?? 0;
  const max = maxParticipants ?? 0;

  // 알림만 띄우는 3버튼 핸들러 (PM 확정안 — 실제 DB 연동은 차후)
  function handleMessage() {
    alert("한마디 남기기 기능은 준비 중입니다.");
  }
  function handleSave() {
    alert("경기 저장 기능은 준비 중입니다.");
  }
  function handleContact() {
    alert("호스트에게 문의 기능은 준비 중입니다.");
  }

  return (
    <aside
      className="card"
      style={{
        padding: "18px 20px",
        position: "sticky",
        top: 16,
        // sticky 는 부모에 overflow 걸리면 무효화되지만,
        // layout 구조상 문제 없음. lg에서만 실제 sticky 효과 발생
      }}
    >
      {/* 1. 비용 요약 — mono 폰트 + 큰 글씨 */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            textTransform: "uppercase",
            letterSpacing: 0.3,
            marginBottom: 2,
          }}
        >
          참가비
        </div>
        <div
          style={{
            fontFamily: "var(--ff-mono)",
            fontWeight: 700,
            fontSize: 24,
            color: isFree ? "var(--ok)" : "var(--ink)",
            lineHeight: 1.1,
          }}
        >
          {isFree ? "무료" : `₩${feeNum.toLocaleString()}`}
        </div>
        {entryFeeNote && (
          <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 4 }}>
            {entryFeeNote}
          </div>
        )}
      </div>

      {/* 2. 메인 CTA — 호스트 / 비로그인 / 신청상태별 분기 */}
      <div style={{ marginBottom: 12 }}>
        {!isLoggedIn && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-dim)",
              textAlign: "center",
              margin: 0,
              padding: "12px 0",
            }}
          >
            로그인 후 신청할 수 있습니다.
          </p>
        )}

        {isLoggedIn && isHost && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-dim)",
              textAlign: "center",
              margin: 0,
              padding: "12px 0",
            }}
          >
            내가 개설한 경기입니다.
          </p>
        )}

        {/* 로그인 + 호스트 아님 + 미신청 → 신청 버튼 */}
        {isLoggedIn && !isHost && myApplicationStatus == null && (
          <GameApplyButton
            gameId={gameId}
            profileCompleted={profileCompleted}
            missingFields={missingFields}
            gameStatus={gameStatus}
          />
        )}

        {/* 로그인 + 호스트 아님 + 대기중 → 취소 버튼 */}
        {isLoggedIn && !isHost && myApplicationStatus === 0 && (
          <CancelApplyButton gameId={gameId} />
        )}

        {/* 로그인 + 호스트 아님 + 승인됨 → 성공 배지 */}
        {isLoggedIn && !isHost && myApplicationStatus === 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 12px",
              borderRadius: 6,
              background: "rgba(22,163,74,0.10)",
              border: "1px solid var(--ok)",
              color: "var(--ok)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              check_circle
            </span>
            참가가 승인되었습니다.
          </div>
        )}

        {/* 거절당한 경우 (myApplicationStatus === 2) */}
        {isLoggedIn && !isHost && myApplicationStatus === 2 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 12px",
              borderRadius: 6,
              background: "rgba(220,38,38,0.10)",
              border: "1px solid var(--bdr-red)",
              color: "var(--bdr-red)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              cancel
            </span>
            신청이 거절되었습니다.
          </div>
        )}
      </div>

      {/* 3. 보조 3버튼: 한마디 / 저장 / 문의 — alert 동작 (PM 확정안) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          className="btn btn--sm"
          onClick={handleMessage}
          style={{ fontSize: 12 }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, marginRight: 2 }}
          >
            chat_bubble
          </span>
          한마디
        </button>
        <button
          type="button"
          className="btn btn--sm"
          onClick={handleSave}
          style={{ fontSize: 12 }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, marginRight: 2 }}
          >
            bookmark
          </span>
          저장
        </button>
        <button
          type="button"
          className="btn btn--sm"
          onClick={handleContact}
          style={{ fontSize: 12 }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, marginRight: 2 }}
          >
            mail
          </span>
          문의
        </button>
      </div>

      {/* 4. 하단 인원 요약 */}
      <div
        style={{
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--ink-dim)",
        }}
      >
        <span>현재 인원</span>
        <span
          style={{
            fontFamily: "var(--ff-mono)",
            fontWeight: 700,
            color: "var(--ink-soft)",
          }}
        >
          {cur}/{max || "?"}명
        </span>
      </div>
    </aside>
  );
}
