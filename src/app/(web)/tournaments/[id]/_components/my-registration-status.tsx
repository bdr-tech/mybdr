"use client";

/**
 * 내 대회 참가 상태 트래킹 컴포넌트
 *
 * 대회 사이드바에 표시되는 스텝 인디케이터:
 * 신청완료 -> 승인대기 -> 입금확인 -> 참가확정
 *
 * 현재: UI만 구현. 데이터는 /api/web/tournaments/[id]/my-status API가 필요.
 * TODO: API 구현 후 실제 데이터 연결
 */

import useSWR from "swr";

// 참가 상태 스텝 정의
const STEPS = [
  { key: "submitted", label: "신청완료", icon: "edit_square" },
  { key: "pending", label: "승인대기", icon: "hourglass_top" },
  { key: "payment", label: "입금확인", icon: "payments" },
  { key: "confirmed", label: "참가확정", icon: "check_circle" },
] as const;

// TournamentTeam의 status/payment_status를 스텝 인덱스로 매핑
function getStepIndex(status: string | null, paymentStatus: string | null): number {
  // status 기반 스텝 결정
  if (status === "approved" && paymentStatus === "paid") return 3; // 참가확정
  if (status === "approved" && paymentStatus !== "paid") return 2; // 입금확인 단계
  if (status === "pending") return 1; // 승인대기
  return 0; // 신청완료
}

// API 응답 타입
interface MyStatusResponse {
  registered: boolean;
  status: string | null;
  payment_status: string | null;
  team_name: string | null;
}

interface Props {
  tournamentId: string;
}

export function MyRegistrationStatus({ tournamentId }: Props) {
  // 현재 유저의 참가 상태 조회
  // TODO: /api/web/tournaments/[id]/my-status API 구현 필요
  const { data, isLoading } = useSWR<MyStatusResponse>(
    `/api/web/tournaments/${tournamentId}/my-status`,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      // API 미구현 시 에러 무시
      onError: () => {},
    }
  );

  // 로딩 중이거나 데이터 없으면 아무것도 표시하지 않음
  if (isLoading || !data || !data.registered) return null;

  const currentStep = getStepIndex(data.status, data.payment_status);

  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
    >
      <div className="p-4">
        {/* 섹션 제목 */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="material-symbols-outlined text-base"
            style={{ color: "var(--color-info)" }}
          >
            assignment_turned_in
          </span>
          <h3 className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
            내 참가 현황
          </h3>
        </div>

        {/* 팀명 표시 */}
        {data.team_name && (
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
            <span className="font-medium" style={{ color: "var(--color-text-secondary)" }}>
              {data.team_name}
            </span>
            (으)로 참가
          </p>
        )}

        {/* 스텝 인디케이터: 가로 배치 */}
        <div className="flex items-start justify-between">
          {STEPS.map((step, idx) => {
            // 완료: 현재 스텝보다 이전
            const isDone = idx <= currentStep;
            // 현재 진행 중: 정확히 현재 스텝
            const isCurrent = idx === currentStep;
            // 진행선 색상 (현재 스텝까지 컬러)
            const lineActive = idx < currentStep;

            return (
              <div key={step.key} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                {/* 연결선 (첫 번째 제외) */}
                {idx > 0 && (
                  <div
                    className="absolute top-3 -left-1/2 w-full h-0.5"
                    style={{
                      backgroundColor: lineActive
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    }}
                  />
                )}

                {/* 원형 아이콘 */}
                <div
                  className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isDone ? "var(--color-primary)" : "var(--color-surface)",
                    border: isCurrent ? "2px solid var(--color-primary)" : "none",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "14px",
                      color: isDone ? "#FFFFFF" : "var(--color-text-disabled)",
                    }}
                  >
                    {isDone ? "check" : step.icon}
                  </span>
                </div>

                {/* 라벨 */}
                <span
                  className="mt-1.5 text-[10px] text-center leading-tight"
                  style={{
                    color: isDone
                      ? "var(--color-text-primary)"
                      : "var(--color-text-disabled)",
                    fontWeight: isCurrent ? 700 : 400,
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
