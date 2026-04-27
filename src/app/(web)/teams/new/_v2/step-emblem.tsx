"use client";

// Phase 3 TeamCreate v2 — Step2 엠블럼 · 컬러
// 이유:
//  - 시안의 "tag 미리보기 + 컬러 팔레트(10) + 엠블럼 업로더" 구조 재현
//  - primary_color 는 서버 제출 → 팔레트 클릭으로 변경. secondary_color 도 살려둠 (시안엔 없으나 기존 기능 유지).
//  - 엠블럼 업로더는 BDR+ 전용으로 표시만 (실제 업로드 없음 — DB 컬럼 없음 + S3 파이프라인 미정)
//  - 시안엔 secondary 색상 input 이 없지만, 기존 폼에 있던 기능이라 BDR+ 카드 아래에 보존

import { TEAM_COLORS } from "./team-form";

interface Props {
  // Step1 에서 입력한 tag (or fallback) — 미리보기 텍스트
  tag: string;
  // 대표 색상 (서버 제출)
  primaryColor: string;
  onPrimaryColorChange: (v: string) => void;
  // 보조 색상 (서버 제출, 기존 기능 보존)
  secondaryColor: string;
  onSecondaryColorChange: (v: string) => void;
}

export function StepEmblem({
  tag,
  primaryColor,
  onPrimaryColorChange,
  secondaryColor,
  onSecondaryColorChange,
}: Props) {
  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>엠블럼 · 컬러</h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-mute)" }}>
        지금은 태그+컬러로 시작하고, 등록 후 이미지 엠블럼으로 바꿀 수 있어요.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, alignItems: "flex-start" }}>
        {/* 미리보기 — 큰 정사각형 카드 */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 160,
              height: 160,
              margin: "0 auto",
              background: primaryColor,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 48,
              letterSpacing: "-0.02em",
              borderRadius: 12,
              boxShadow: "var(--sh-lift)",
            }}
          >
            {tag}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, fontFamily: "var(--ff-mono)" }}>
            미리보기
          </div>
        </div>

        {/* 우측: 팔레트 + 엠블럼 업로더 */}
        <div>
          {/* 팀 컬러 팔레트 */}
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}>
            팀 컬러 *
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
            {TEAM_COLORS.map((c) => {
              const selected = primaryColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPrimaryColorChange(c)}
                  aria-label={`팀 컬러 ${c}`}
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    background: c,
                    borderRadius: 6,
                    border: selected ? "3px solid var(--ink)" : "2px solid var(--border)",
                    cursor: "pointer",
                    boxShadow: selected ? "0 0 0 3px var(--bg), 0 0 0 5px var(--ink)" : "none",
                  }}
                />
              );
            })}
          </div>

          {/* 엠블럼 업로더 — UI 만, 실제 업로드 없음 */}
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}>
            엠블럼 이미지 <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(준비 중 · BDR+ 멤버 전용)</span>
          </label>
          <div
            style={{
              padding: "24px",
              border: "2px dashed var(--border)",
              borderRadius: 8,
              textAlign: "center",
              opacity: 0.7,
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>드래그하거나 클릭해서 업로드</div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>PNG·JPG · 정방형 권장 · 최대 2MB</div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 6 }}>BDR+ 멤버 전용 기능 (출시 예정)</div>
          </div>

          {/* 보조 색상 — 기존 기능 보존 (시안 외 항목) */}
          <div style={{ marginTop: 20 }}>
            <label
              style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 6 }}
            >
              보조 색상 <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(유니폼 서브 컬러)</span>
            </label>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => onSecondaryColorChange(e.target.value)}
              style={{
                height: 44,
                width: 80,
                cursor: "pointer",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: 2,
                background: "var(--bg)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
