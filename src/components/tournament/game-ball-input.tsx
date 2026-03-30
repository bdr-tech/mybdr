"use client";

import { useState } from "react";

// 경기구(농구공) 선택 컴포넌트
// BDR 대회에서 자주 사용하는 공 프리셋 제공

const pillCls = (active: boolean) =>
  `rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
    active
      ? "bg-[var(--color-accent)] text-white"
      : "bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-active)]"
  }`;

// 경기구 프리셋 (1개 + 직접입력)
const BALL_PRESETS = [
  "몰텐 BG4500",
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GameBallInput({ value, onChange }: Props) {
  // "기타" 선택 시 직접 입력 모드
  const [isCustom, setIsCustom] = useState(false);
  // 프리셋에 없는 값이면 기타 모드로 시작
  const isPreset = BALL_PRESETS.includes(value);

  function handlePresetClick(ball: string) {
    setIsCustom(false);
    onChange(ball);
  }

  function handleCustomToggle() {
    setIsCustom(true);
    // 프리셋 값이었으면 초기화
    if (isPreset) onChange("");
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[var(--color-text-secondary)]">
        <span className="material-symbols-outlined align-middle text-base mr-1">sports_basketball</span>
        경기구
      </label>

      {/* 프리셋 pill 버튼들 */}
      <div className="flex flex-wrap gap-2">
        {BALL_PRESETS.map((ball) => (
          <button
            key={ball}
            type="button"
            onClick={() => handlePresetClick(ball)}
            className={pillCls(!isCustom && value === ball)}
          >
            {ball}
          </button>
        ))}
        {/* 기타 버튼 */}
        <button
          type="button"
          onClick={handleCustomToggle}
          className={pillCls(isCustom || (!isPreset && !!value))}
        >
          기타
        </button>
      </div>

      {/* 기타 선택 시 직접 입력 필드 */}
      {(isCustom || (!isPreset && !!value)) && (
        <input
          type="text"
          value={isPreset ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="경기구 직접 입력"
          className="w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
        />
      )}

      {/* 현재 선택된 값 표시 */}
      {value && (
        <p className="text-xs text-[var(--color-text-muted)]">
          선택: <span className="font-medium text-[var(--color-text-primary)]">{value}</span>
        </p>
      )}
    </div>
  );
}
