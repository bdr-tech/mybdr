// 검색 결과 페이지 로딩 스켈레톤 — BDR v2 톤
// 왜: Phase 2 일관 .page 쉘 + v2 변수(--bg-elev / --border) 사용으로 페이지 로딩 중
//      화면 어긋남 최소화. 탭 7개 + 카드 3장 형태로 실제 레이아웃 근사화.
export default function SearchLoading() {
  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <div className="animate-pulse" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 제목 + 검색바 스켈레톤 */}
        <div>
          <div
            style={{
              height: 28,
              width: 80,
              marginBottom: 12,
              borderRadius: 4,
              background: "var(--bg-elev)",
            }}
          />
          <div
            style={{
              height: 44,
              width: "100%",
              borderRadius: 8,
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
            }}
          />
        </div>

        {/* 탭 7개 스켈레톤 — border-bottom 구분선 */}
        <div
          style={{
            display: "flex",
            gap: 16,
            paddingBottom: 10,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 16,
                width: 36,
                borderRadius: 4,
                background: "var(--bg-elev)",
              }}
            />
          ))}
        </div>

        {/* 카테고리별 결과 섹션 스켈레톤 (3장) */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}
          >
            {/* 섹션 헤더 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "var(--bg-elev)",
                }}
              />
              <div
                style={{
                  height: 16,
                  width: 80,
                  borderRadius: 4,
                  background: "var(--bg-elev)",
                }}
              />
            </div>
            {/* 리스트 아이템 3개 */}
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "10px 4px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    height: 14,
                    width: "60%",
                    borderRadius: 4,
                    background: "var(--bg-elev)",
                  }}
                />
                <div
                  style={{
                    height: 12,
                    width: "40%",
                    borderRadius: 4,
                    background: "var(--bg-elev)",
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
