"use client";

import { useState, useEffect } from "react";

// 경기시간 프리셋 빌더
// "7분 4쿼터 논스탑" 같은 문자열을 pill 버튼 조합으로 생성

// pill 버튼 스타일 (선택/미선택)
const pillCls = (active: boolean) =>
  `rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
    active
      ? "bg-[var(--color-accent)] text-white"
      : "bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-active)]"
  }`;

// 쿼터 방식 옵션
const PERIOD_OPTIONS = [
  { value: "4Q", label: "4쿼터" },
  { value: "2H", label: "전후반" },
];

// 시간(분) 옵션
const TIME_OPTIONS = [5, 7, 8, 10, 12];

// 데드타임 옵션
const DEAD_OPTIONS = [
  { value: "nonstop", label: "논스탑" },
  { value: "alldead", label: "올데드" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GameTimeInput({ value, onChange }: Props) {
  // 커스텀 입력 모드 토글
  const [isCustom, setIsCustom] = useState(false);
  // pill 선택 상태
  const [period, setPeriod] = useState("4Q");
  const [minutes, setMinutes] = useState(7);
  const [dead, setDead] = useState("nonstop");

  // pill 조합으로 결과 문자열 생성
  useEffect(() => {
    if (isCustom) return; // 커스텀 모드면 pill 변경 무시
    const periodLabel = period === "4Q" ? "4쿼터" : "전후반";
    const deadLabel = dead === "nonstop" ? "논스탑" : "올데드";
    onChange(`${minutes}분 ${periodLabel} ${deadLabel}`);
  }, [period, minutes, dead, isCustom, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          <span className="material-symbols-outlined align-middle text-base mr-1">timer</span>
          경기시간
        </label>
        {/* 커스텀 입력 토글 */}
        <button
          type="button"
          onClick={() => setIsCustom(!isCustom)}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          {isCustom ? "프리셋 선택" : "직접 입력"}
        </button>
      </div>

      {isCustom ? (
        // 직접 입력 모드
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="예: 10분 4쿼터 올데드"
          className="w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
        />
      ) : (
        <div className="space-y-2">
          {/* 쿼터 방식 선택 */}
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={pillCls(period === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 시간(분) 선택 */}
          <div className="flex gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMinutes(t)}
                className={pillCls(minutes === t)}
              >
                {t}분
              </button>
            ))}
          </div>

          {/* 데드타임 선택 */}
          <div className="flex gap-2">
            {DEAD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDead(opt.value)}
                className={pillCls(dead === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 현재 결과 표시 */}
          <p className="text-xs text-[var(--color-text-muted)]">
            결과: <span className="font-medium text-[var(--color-text-primary)]">{value || "미설정"}</span>
          </p>
        </div>
      )}
    </div>
  );
}
