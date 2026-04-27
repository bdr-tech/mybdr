"use client";

/**
 * 대진표 v2 — 우측 "우승 예측 (커뮤니티)" 카드
 *
 * 시안: Bracket.jsx L218~238
 *  - 팀별 예측 % 가로 바
 *  - 하단 "내 예측 투표" 버튼
 *
 * 사용자 원칙 (이번 세션 결정 #3):
 *  - DB 미지원 기능도 자리는 유지
 *  - 투표 시스템이 아직 없으므로 "투표 준비 중" placeholder + 투표 버튼 disabled
 *  - 추후 실제 데이터 연결 시 props만 채우면 동작하도록 prediction 인자 보존
 */

interface Prediction {
  teamName: string;
  pct: number;
  // 시안은 팀 컬러바 — DB 컬러 없을 수 있어 옵셔널
  color?: string | null;
}

interface V2BracketPredictionProps {
  // 데이터가 있으면 표시. 현재는 항상 빈 배열 → "준비 중" 안내
  predictions?: Prediction[];
}

export function V2BracketPrediction({ predictions = [] }: V2BracketPredictionProps) {
  // 데이터 없으면 placeholder 모드
  const isReady = predictions.length > 0;

  return (
    <div
      // 시안 .card
      className="rounded-md border p-5"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
        우승 예측 (커뮤니티)
      </h3>

      {isReady ? (
        // 데이터가 있을 때 — 시안 그대로 가로 % 바
        <div className="flex flex-col gap-2.5">
          {predictions.map((p) => (
            <div key={p.teamName}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {p.teamName}
                </span>
                <span className="font-mono" style={{ color: "var(--color-text-muted)" }}>
                  {p.pct}%
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(p.pct, 100)}%`,
                    backgroundColor: p.color ?? "var(--color-primary)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 데이터 없을 때 placeholder — "투표 준비 중" 안내 영역
        // 사용자 원칙: 시안 자리(가로바 시각 흐름)를 보존한 dim 상태
        <div
          className="flex flex-col items-center justify-center rounded py-6 text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px dashed var(--color-border)",
          }}
        >
          <span
            className="material-symbols-outlined mb-1 text-2xl"
            style={{ color: "var(--color-text-disabled)" }}
          >
            how_to_vote
          </span>
          <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            투표 준비 중
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            커뮤니티 우승 예측 시스템 준비 중입니다
          </p>
        </div>
      )}

      {/* 투표 버튼 — 데이터 준비 시점에 자동 활성. 현재는 disabled */}
      <button
        type="button"
        disabled
        className="mt-3 w-full rounded border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-elevated)",
          color: "var(--color-text-secondary)",
        }}
        title="투표 시스템 준비 중"
      >
        내 예측 투표
      </button>
    </div>
  );
}

export type { Prediction };
