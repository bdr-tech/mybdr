/* ============================================================
 * ParticipantList — BDR v2 경기 참가자 목록 (승인된 신청자)
 *
 * 왜 이 컴포넌트가 있는가:
 * 기존 ParticipantsGrid 는 10~12열 아바타 격자로 닉네임만 보였지만,
 * v2 시안은 "리스트 행: 이니셜 아바타 + 닉네임/이름 + position"
 * 구조를 요구. 레벨(skill_level)은 경기 공통 값이라 개별 행에 표시 생략.
 *
 * 데이터 방침(PM 확정):
 *   - 이름/닉네임: 닉네임 > 이름 > "익명" 순으로 폴백
 *   - position  : users.position (없으면 비움 — "-" 표시 안 함)
 *   - level     : 생략
 *
 * 서버 컴포넌트 — 상호작용 없음.
 * ============================================================ */

import { decodeHtmlEntities } from "@/lib/utils/decode-html";

export interface ParticipantListItem {
  id: string;
  nickname: string | null;
  name: string | null;
  position: string | null;
}

export interface ParticipantListProps {
  participants: ParticipantListItem[];
  maxParticipants: number | null;
}

export function ParticipantList({
  participants,
  maxParticipants,
}: ParticipantListProps) {
  const cur = participants.length;
  const max = maxParticipants ?? 0;

  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* 헤더 — "참가자 N/M명" 형식. 카운트는 mono 폰트로 강조 */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
          참가자
        </div>
        <span
          style={{
            fontFamily: "var(--ff-mono)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--ink-soft)",
          }}
        >
          {cur}/{max || "?"}명
        </span>
      </div>

      {/* 본문 — 참가자 없으면 안내 문구, 있으면 리스트 */}
      {cur === 0 ? (
        <div
          style={{
            padding: "28px 20px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-dim)",
          }}
        >
          아직 참가자가 없습니다.
        </div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} />
          ))}
        </ul>
      )}
    </section>
  );
}

// 1행 렌더 — 이니셜 아바타 + 닉네임·이름 + position(옵션)
function ParticipantRow({ participant }: { participant: ParticipantListItem }) {
  const display =
    decodeHtmlEntities(participant.nickname) ||
    decodeHtmlEntities(participant.name) ||
    "익명";
  // 이니셜: 한글/영문 첫 글자. 공백일 경우 "?" fallback
  const initial = display.trim().charAt(0) || "?";

  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 20px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* 이니셜 아바타 — 32x32 원형, cafe-blue soft bg */}
      <div
        aria-hidden
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--bg-alt)",
          color: "var(--cafe-blue)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      {/* 닉네임/이름 — 1줄 ellipsis */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--ink)",
        }}
      >
        {display}
      </div>

      {/* position — 있을 때만 표시(없으면 완전히 비움, "-" 표시 안 함) */}
      {participant.position && (
        <span
          style={{
            fontSize: 12,
            color: "var(--ink-dim)",
            fontFamily: "var(--ff-mono)",
            flexShrink: 0,
          }}
        >
          {participant.position}
        </span>
      )}
    </li>
  );
}
