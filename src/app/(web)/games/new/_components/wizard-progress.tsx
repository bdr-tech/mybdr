"use client";

interface WizardProgressProps {
  steps: { label: string; shortLabel: string }[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="bg-white">
      {/* Progress bar */}
      <div
        className="h-1 bg-[#E8ECF0]"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${steps.length}단계 중 ${currentStep + 1}단계`}
      >
        <div
          className="h-full bg-[#F4A261] transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators (desktop only) */}
      <div className="hidden xl:flex justify-center gap-2 py-2">
        {steps.map((s, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          const isClickable = i < currentStep;

          return (
            <button
              key={i}
              type="button"
              onClick={() => isClickable && onStepClick(i)}
              disabled={!isClickable}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                isActive
                  ? "bg-[#0066FF] font-semibold text-white"
                  : isCompleted
                    ? "bg-[rgba(74,222,128,0.15)] text-[#22C55E] cursor-pointer hover:bg-[rgba(74,222,128,0.25)]"
                    : "bg-[#F5F7FA] text-[#9CA3AF] cursor-not-allowed"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {isCompleted && <span>✓</span>}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
