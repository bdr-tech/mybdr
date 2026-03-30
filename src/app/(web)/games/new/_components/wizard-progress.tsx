"use client";

/**
 * WizardProgress - 3단계 스텝 인디케이터
 * 디자인 시안(bdr_3/bdr_4)에 맞춰 원형 번호 + 연결선 스타일로 변경
 * 활성: bg-[#E31B23] text-white / 완료: 체크 표시 / 비활성: 회색
 */

interface WizardProgressProps {
  steps: { label: string; shortLabel: string }[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  return (
    // 전체 스텝 인디케이터 컨테이너
    <div className="relative flex items-center justify-between">
      {/* 스텝 사이 연결선 (배경) */}
      <div className="absolute top-5 left-0 w-full h-0.5 bg-[var(--color-border)] -z-10" />

      {steps.map((s, i) => {
        const isCompleted = i < currentStep; // 이전 스텝은 완료 상태
        const isActive = i === currentStep;  // 현재 스텝은 활성 상태
        const isClickable = i < currentStep; // 이전 스텝만 클릭 가능

        return (
          <button
            key={i}
            type="button"
            onClick={() => isClickable && onStepClick(i)}
            disabled={!isClickable}
            className="flex flex-col items-center gap-3"
            aria-current={isActive ? "step" : undefined}
          >
            {/* 원형 번호 */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
                  : isCompleted
                    ? "bg-[var(--color-primary)] text-white cursor-pointer"
                    : "bg-[var(--color-surface-high)] text-[var(--color-text-muted)]"
              }`}
            >
              {/* 완료된 스텝은 체크 아이콘, 아니면 번호 */}
              {isCompleted ? (
                <span className="material-symbols-outlined text-lg">check</span>
              ) : (
                i + 1
              )}
            </div>
            {/* 스텝 라벨 */}
            <span
              className={`text-xs font-medium whitespace-nowrap ${
                isActive
                  ? "font-bold text-[var(--color-primary)]"
                  : isCompleted
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)]"
              }`}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
