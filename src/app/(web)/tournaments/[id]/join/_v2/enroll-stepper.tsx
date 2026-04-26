/**
 * EnrollStepper — 시안 5-step / 4-step 인디케이터 박제
 *
 * 왜 이 컴포넌트가 있는가:
 *  시안 TournamentEnroll.jsx L64~74 의 stepper 를 그대로 박제.
 *  기존 page.tsx 의 inline stepper 는 7×7 동그라미 단순형이었으나,
 *  시안은 32px 원 + 라벨 + 활성 단계 ring + 사이 연결선이 정교하다.
 *
 *  4-step / 5-step adaptive: hasCategories=false 면 디비전 단계 생략.
 */

export interface StepDef {
  // 1부터 시작하는 단계 번호 (시안과 동일)
  n: number;
  // 한글 라벨 ("대회 확인" / "디비전" / "로스터" / "서류" / "결제")
  l: string;
}

interface EnrollStepperProps {
  steps: StepDef[];
  // 현재 활성 단계 번호
  current: number;
}

export function EnrollStepper({ steps, current }: EnrollStepperProps) {
  return (
    <div
      // 시안 컨테이너 — 좌우 padding 10, 하단 28
      style={{ display: "flex", marginBottom: 28, padding: "0 10px" }}
    >
      {steps.map((s, i) => {
        // 시안 분기: step >= s.n 이면 활성 색, step > s.n 이면 체크
        const isActive = current === s.n;
        const isDone = current > s.n;
        const isReached = current >= s.n;
        return (
          <div key={s.n} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* 32px 원 — 활성 시 accent 배경 + ring */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isReached ? "var(--accent)" : "var(--bg-alt)",
                  color: isReached ? "#fff" : "var(--ink-dim)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 800,
                  fontSize: 12,
                  // 시안 활성 단계 ring (3px outline alpha 30%)
                  border: isActive
                    ? "3px solid color-mix(in oklab, var(--accent) 30%, transparent)"
                    : "0",
                }}
              >
                {isDone ? "✓" : s.n}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isReached ? "var(--ink)" : "var(--ink-dim)",
                  whiteSpace: "nowrap",
                }}
              >
                {s.l}
              </div>
            </div>
            {/* 사이 연결선 — 마지막 단계 제외 */}
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  // 시안: step > s.n (현재 단계 지난 connector)면 accent, 아니면 border 회색
                  background: current > s.n ? "var(--accent)" : "var(--border)",
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
