/**
 * EnrollStepDocs — Step 4 "서류 제출" 박제 ("준비 중")
 *
 * 왜 이 컴포넌트가 있는가:
 *  시안 TournamentEnroll.jsx Step 4 는 4종 서류 업로드 UI 인데,
 *  현재 DB 에 tournament_documents / 업로드 스토리지 모델이 없다.
 *  사용자 원칙(04-25): "DB 미지원 기능도 제거 금지 — UI 배치 + '준비 중' 표시".
 *
 *  4행 박제(disabled) + 안내 콜아웃 + 헤더에 "준비 중" 라벨.
 *  Stepper 흐름은 유지되어야 하므로 다음 버튼은 활성.
 */

const DOCS_PLACEHOLDER = [
  { l: "선수 경력 확인서", d: "전 선수·아마추어·프로 경력 여부", req: true },
  { l: "신분증 사본 (전원)", d: "주민번호 뒷자리 가림", req: true },
  { l: "대회 참가 동의서", d: "PDF 템플릿 다운로드", req: true },
  { l: "보험 가입 증빙", d: "개별 가입 또는 대회 단체보험", req: false },
] as const;

export function EnrollStepDocs() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>서류 제출</h2>
        {/* 헤더 우측 "준비 중" 라벨 — Phase 3 Teams 패턴 */}
        <span
          className="badge badge--ghost"
          style={{
            fontSize: 10,
            color: "var(--ink-mute)",
            border: "1px dashed var(--border)",
          }}
          title="서류 업로드 시스템 준비 중"
        >
          준비 중
        </span>
      </div>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 13,
          color: "var(--ink-mute)",
        }}
      >
        디비전 검증에 필요한 서류입니다. (시스템 준비 중 — 운영팀 별도 안내)
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DOCS_PLACEHOLDER.map((doc, i) => (
          <div
            key={i}
            style={{
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto",
              gap: 14,
              alignItems: "center",
              opacity: 0.7,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                background: "var(--ink-dim)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              !
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {doc.l}
                {doc.req && (
                  <span
                    style={{
                      color: "var(--err)",
                      fontWeight: 800,
                      marginLeft: 2,
                    }}
                  >
                    *
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                {doc.d}
              </div>
            </div>
            <span
              className="badge badge--ghost"
              style={{ fontSize: 10 }}
              title="준비 중"
            >
              준비 중
            </span>
            <button
              type="button"
              className="btn btn--sm"
              disabled
              title="서류 업로드 시스템 준비 중"
              aria-label="서류 업로드 (준비 중)"
            >
              업로드
            </button>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          background: "color-mix(in oklab, var(--accent) 6%, transparent)",
          borderRadius: 4,
          fontSize: 12,
          color: "var(--ink-soft)",
          lineHeight: 1.6,
        }}
      >
        💡 서류 업로드 시스템은 곧 도입 예정입니다. 현재는 운영팀 메일/공지를 통해 제출해주세요.
      </div>
    </div>
  );
}
