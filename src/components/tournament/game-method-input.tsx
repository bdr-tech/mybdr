"use client";

import { useState } from "react";

// 대회 방식 상세 입력 컴포넌트
// "예선 풀리그 + 본선 싱글 엘리미네이션" 같은 상세 방식을 프리셋/커스텀으로 입력

const pillCls = (active: boolean) =>
  `rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer text-left ${
    active
      ? "bg-[var(--color-accent)] text-white"
      : "bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-active)]"
  }`;

// BDR 대회에서 자주 사용하는 방식 프리셋 (4개 + 직접입력)
const METHOD_PRESETS = [
  "조별리그+토너먼트",
  "듀얼토너먼트",
  "토너먼트",
  "풀리그+토너먼트",
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GameMethodInput({ value, onChange }: Props) {
  const [isCustom, setIsCustom] = useState(false);
  const isPreset = METHOD_PRESETS.includes(value);

  function handlePresetClick(method: string) {
    setIsCustom(false);
    onChange(method);
  }

  function handleCustomToggle() {
    setIsCustom(true);
    if (isPreset) onChange("");
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[var(--color-text-secondary)]">
        <span className="material-symbols-outlined align-middle text-base mr-1">schema</span>
        대회 방식 상세
      </label>

      {/* 프리셋 pill 버튼들 (세로 배치 -- 텍스트가 길어서) */}
      <div className="flex flex-col gap-2">
        {METHOD_PRESETS.map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => handlePresetClick(method)}
            className={pillCls(!isCustom && value === method)}
          >
            {method}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustomToggle}
          className={pillCls(isCustom || (!isPreset && !!value))}
        >
          직접 입력
        </button>
      </div>

      {/* 커스텀 입력 */}
      {(isCustom || (!isPreset && !!value)) && (
        <textarea
          value={isPreset ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="대회 방식을 직접 입력하세요&#10;예: 예선 3팀 풀리그 → 각조 1위 + 와일드카드 2팀 → 8강 싱글 엘리미네이션"
          rows={3}
          className="w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
        />
      )}
    </div>
  );
}
