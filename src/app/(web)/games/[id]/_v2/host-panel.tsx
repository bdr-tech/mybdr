/* ============================================================
 * HostPanel — BDR v2 호스트 전용 패널 (수정/취소 + 신청자 관리)
 *
 * 왜 이 컴포넌트가 있는가:
 * 기존 구조는 HostActions(수정/취소) 와 HostApplications(신청자 관리)
 * 가 따로 렌더되고 page.tsx에서 분기 분산. v2 재구성에서는
 *   - 상단 헤더: "호스트 메뉴" + 수정/취소 버튼
 *   - 본문: 신청자 목록 관리
 * 를 하나의 .card 로 응집. HostActions/HostApplications 내부 로직은
 * 그대로 재사용해 API/데이터 패칭 경로 변화 0.
 *
 * 클라이언트 컴포넌트 — 하위 컴포넌트 2개가 이미 "use client".
 * ============================================================ */

"use client";

import { HostActions } from "../_components/host-actions";
import { HostApplications } from "../_components/host-applications";

interface HostApplicant {
  id: string;
  status: number;
  nickname: string | null;
  name: string | null;
  phone: string | null;
  position: string | null;
  city: string | null;
  district: string | null;
}

export interface HostPanelProps {
  gameId: string;
  applicants: HostApplicant[];
  maxParticipants: number | null;
}

export function HostPanel({ gameId, applicants, maxParticipants }: HostPanelProps) {
  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* 헤더: 제목 + 수정/취소 버튼 우측 정렬 */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
          호스트 메뉴{" "}
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: "var(--ink-dim)",
              marginLeft: 6,
            }}
          >
            신청자 {applicants.length} / {maxParticipants ?? "?"}명
          </span>
        </div>
        {/* HostActions 내부가 이미 버튼 2개 inline-flex */}
        <HostActions gameId={gameId} />
      </div>

      {/* 신청자 관리 본문 — HostApplications 가 자체 padding 없음 */}
      <div style={{ padding: "14px 20px" }}>
        <HostApplications gameId={gameId} applicants={applicants} />
      </div>
    </section>
  );
}
