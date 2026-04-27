"use client";

/* ============================================================
 * ConditionsSection — BDR v2 신청 조건 카드 (시안 3번 카드)
 *
 * 왜 이 컴포넌트가 필요한가:
 * 시안은 6개 체크박스(초보 환영 / 레이팅 1400 이상 / 여성 우대 /
 * 학생 우대 / 자차 가능자 / 프로필 공개 필수)로 "신청 조건"을 받음.
 * DB에는 `requirements`라는 자유 텍스트 필드 1개만 있으므로,
 * 체크된 항목을 **줄바꿈으로 JOIN**해서 requirements에 저장.
 *
 * 재진입 시 기존 문자열에 알려진 키워드가 포함돼 있으면
 * 해당 체크박스를 자동 복원.
 * 기타 조건(키워드 외 텍스트)은 하단 "기타" 입력란에 그대로 노출.
 * ============================================================ */

import { useEffect, useState } from "react";

// 시안 고정 체크박스 6개 — 순서 유지 (label = requirements에 저장될 실제 문자열)
export const CONDITION_OPTIONS = [
  "초보 환영",
  "레이팅 1400 이상",
  "여성 우대",
  "학생 우대",
  "자차 가능자",
  "프로필 공개 필수",
] as const;

type ConditionOption = (typeof CONDITION_OPTIONS)[number];

interface Props {
  // requirements 문자열 전체(체크박스 + 기타)
  value: string;
  onChange: (v: string) => void;
}

/**
 * requirements 문자열 → { checked: Set<체크박스>, extra: 기타 문자열 }
 * 줄바꿈으로 split 후 CONDITION_OPTIONS에 있는 줄은 체크박스,
 * 나머지는 "기타"로 간주.
 */
function parseRequirements(raw: string): { checked: Set<ConditionOption>; extra: string } {
  const checked = new Set<ConditionOption>();
  const extras: string[] = [];
  if (!raw) return { checked, extra: "" };

  // 줄바꿈 또는 쉼표로 split (기존 저장 데이터가 쉼표로 들어있을 수 있음)
  const tokens = raw.split(/\n|,/).map((t) => t.trim()).filter(Boolean);
  for (const t of tokens) {
    if ((CONDITION_OPTIONS as readonly string[]).includes(t)) {
      checked.add(t as ConditionOption);
    } else {
      extras.push(t);
    }
  }
  return { checked, extra: extras.join("\n") };
}

/** checked + extra → requirements 문자열(줄바꿈 JOIN) */
function buildRequirements(checked: Set<ConditionOption>, extra: string): string {
  // string[]로 유지해야 extra(자유 텍스트) push 가능
  const parts: string[] = CONDITION_OPTIONS.filter((opt) => checked.has(opt));
  const extraTrim = extra.trim();
  if (extraTrim) parts.push(extraTrim);
  return parts.join("\n");
}

export function ConditionsSection({ value, onChange }: Props) {
  // 최초 1회 value 파싱 → 로컬 상태로 분리 관리
  const [checked, setChecked] = useState<Set<ConditionOption>>(() => parseRequirements(value).checked);
  const [extra, setExtra] = useState<string>(() => parseRequirements(value).extra);

  // 체크박스 or 기타 텍스트 변경 시 상위 onChange 호출 (requirements 재합성)
  useEffect(() => {
    onChange(buildRequirements(checked, extra));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, extra]);

  // 외부에서 value가 바뀔 수 있음(예: 지난 경기 복사) — 재동기화
  useEffect(() => {
    const parsed = parseRequirements(value);
    setChecked(parsed.checked);
    setExtra(parsed.extra);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const toggle = (opt: ConditionOption) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  return (
    <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
        3. 신청 조건
      </h2>

      {/* 2열 체크박스 그리드 — 시안과 동일 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
        }}
      >
        {CONDITION_OPTIONS.map((opt) => {
          const isChecked = checked.has(opt);
          return (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "var(--bg-alt)",
                borderRadius: 6,
                cursor: "pointer",
                border: isChecked ? "1px solid var(--cafe-blue)" : "1px solid transparent",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(opt)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{opt}</span>
            </label>
          );
        })}
      </div>

      {/* 기타 조건 — 시안에 없지만 기존 자유 텍스트 입력 보존 */}
      <div style={{ marginTop: 14 }}>
        <label className="label">
          기타 조건 <span style={{ color: "var(--ink-dim)", fontWeight: 400 }}>(선택)</span>
        </label>
        <textarea
          className="textarea"
          rows={2}
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="예: 3점슈터 우대, 20~30대 선호"
          style={{ minHeight: 64, resize: "vertical" }}
        />
      </div>
    </section>
  );
}
