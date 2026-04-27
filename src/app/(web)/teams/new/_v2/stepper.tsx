"use client";

// Phase 3 TeamCreate v2 — 스텝 진행 표시
// 이유: 시안 TeamCreate.jsx 의 4스텝 stepper UI 추출 — 36px 원형 + 연결선
// 현재 스텝까진 accent, 이후는 bg-alt. 활성 스텝은 외곽 3px ring.

const STEPS = [
  { n: 1 as const, l: "기본정보" },
  { n: 2 as const, l: "엠블럼" },
  { n: 3 as const, l: "활동정보" },
  { n: 4 as const, l: "검토" },
];

export function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div style={{ display: "flex", marginBottom: 28, padding: "0 10px" }}>
      {STEPS.map((s, i) => {
        const reached = step >= s.n; // 도달 또는 통과
        const active = step === s.n; // 현재
        const done = step > s.n; // 완료
        return (
          <div key={s.n} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            {/* 원형 + 라벨 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", zIndex: 1 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: reached ? "var(--accent)" : "var(--bg-alt)",
                  color: reached ? "#fff" : "var(--ink-dim)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 800,
                  fontSize: 13,
                  // 활성 스텝은 시안의 외곽 ring 효과
                  border: active ? "3px solid color-mix(in oklab, var(--accent) 30%, transparent)" : 0,
                }}
              >
                {done ? "✓" : s.n}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: reached ? "var(--ink)" : "var(--ink-dim)" }}>
                {s.l}
              </div>
            </div>
            {/* 연결선 — 마지막 스텝 제외 */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: step > s.n ? "var(--accent)" : "var(--border)",
                  margin: "0 8px",
                  marginBottom: 18,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
