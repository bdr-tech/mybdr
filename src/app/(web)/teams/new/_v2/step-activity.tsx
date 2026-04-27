"use client";

// Phase 3 TeamCreate v2 — Step3 활동 정보
// 이유:
//  - 시안의 "주 활동 코트 / 실력 수준 / 활동 요일 / 공개 설정" 4섹션을 그대로 재현
//  - 모두 DB 컬럼 미지원 → UI 만, 모든 영역에 "준비 중" 표시
//  - 다음 스텝(검토)에서 입력값 미리보기에 사용

import { TEAM_LEVELS, TEAM_DAYS, TEAM_PRIVACY } from "./team-form";

interface Props {
  // 홈코트 (UI 만)
  home: string;
  onHomeChange: (v: string) => void;
  // 실력 수준 (UI 만)
  level: (typeof TEAM_LEVELS)[number];
  onLevelChange: (v: (typeof TEAM_LEVELS)[number]) => void;
  // 활동 요일 다중 선택 (UI 만)
  days: string[];
  onDaysChange: (v: string[]) => void;
  // 공개 설정 (UI 만)
  privacy: "public" | "invite" | "closed";
  onPrivacyChange: (v: "public" | "invite" | "closed") => void;
}

export function StepActivity({
  home,
  onHomeChange,
  level,
  onLevelChange,
  days,
  onDaysChange,
  privacy,
  onPrivacyChange,
}: Props) {
  // 요일 토글 헬퍼 — 이미 선택된 요일은 제거, 아니면 추가
  function toggleDay(d: string) {
    if (days.includes(d)) onDaysChange(days.filter((x) => x !== d));
    else onDaysChange([...days, d]);
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
        활동 정보 <span style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-mute)" }}>(준비 중 · UI 미리보기)</span>
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-mute)" }}>
        다른 팀이 우리 팀을 찾을 때 보여지는 정보예요. 현재는 입력만 가능하며, 등록 후에 표시되지 않습니다.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 주 활동 코트 */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            주 활동 코트
          </label>
          <input
            className="input"
            type="text"
            value={home}
            onChange={(e) => onHomeChange(e.target.value)}
            placeholder="예: 장충체육관, 미사강변체육관"
          />
        </div>

        {/* 실력 수준 — 토글 버튼 */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            실력 수준
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TEAM_LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLevelChange(l)}
                className={`btn btn--sm ${level === l ? "btn--primary" : ""}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 활동 요일 — 다중 선택 */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            활동 요일 <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(복수 선택)</span>
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {TEAM_DAYS.map((d) => {
              const selected = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  style={{
                    padding: "8px 14px",
                    background: selected ? "var(--accent)" : "var(--bg-alt)",
                    color: selected ? "#fff" : "var(--ink)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* 공개 설정 */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            팀 공개 설정
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TEAM_PRIVACY.map((p) => {
              const selected = privacy === p.id;
              return (
                <label
                  key={p.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 12px",
                    background: selected ? "var(--bg-alt)" : "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    cursor: "pointer",
                    alignItems: "flex-start",
                  }}
                >
                  <input
                    type="radio"
                    name="privacy"
                    checked={selected}
                    onChange={() => onPrivacyChange(p.id)}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.l}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>{p.d}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
