/**
 * TeamSideCardV2
 * ─────────────────────────────────────────────────────────
 * v2 시안 `TeamDetail.jsx` 우측 aside 2카드 재현.
 *
 * 이유(왜): 시안의 탭/스탯/소개 영역은 좌측 1fr, 우측 320px sticky aside에
 * "최근 폼 + 게스트 지원/매치 신청" 카드와 "연락 카드"를 얹는다.
 * 기존 페이지에는 사이드 영역 자체가 없어 새로 추가한다.
 *
 * 방법(어떻게):
 * - 2개 `.card`를 세로 스택. 상단 카드는 position:sticky top:120
 *   (시안 기준; mybdr 헤더 높이 고려해 96px 정도로 조정)
 * - 최근 폼: 28×28 칸 5개, W→var(--ok) L→var(--ink-dim) "—"→border only.
 * - 버튼: "게스트 지원" (btn--primary btn--xl) + "팀 매치 신청" (btn 전폭).
 *   둘 다 DB/기능 미구현 → disabled + title="준비 중"
 * - 연락 카드: 팀장 닉네임 + 응답시간("준비 중")
 *   + "쪽지 보내기" 버튼 (btn--sm 전폭, disabled).
 *
 * DB 매핑 / 미지원:
 * - 최근 폼 → computeRecentForm (recent-tab-v2.tsx에서 import)
 * - 게스트 지원 / 팀 매치 신청 / 쪽지 → 전부 준비 중
 * - 응답시간 → "준비 중" 텍스트로 대체
 */

type Props = {
  recentForm: ("W" | "L" | "-")[]; // 최대 5개
  captainName: string | null;
};

export function TeamSideCardV2({ recentForm, captainName }: Props) {
  // 정확히 5칸을 유지 (빈 칸은 "-"로 채움) — 시안 일관성 위해
  const cells: ("W" | "L" | "-")[] = [...recentForm];
  while (cells.length < 5) cells.push("-");
  const filled = cells.slice(0, 5);

  return (
    <aside
      className="flex flex-col gap-3.5"
      style={{ position: "sticky", top: 96 }}
    >
      {/* ── 카드 1: 최근 폼 + 지원/매치신청 ── */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "var(--ink-dim)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          최근 폼
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {filled.map((r, i) => {
            const isW = r === "W";
            const isL = r === "L";
            return (
              <span
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-display)",
                  fontWeight: 900,
                  fontSize: 13,
                  color: isW || isL ? "#fff" : "var(--ink-mute)",
                  background: isW
                    ? "var(--ok)"
                    : isL
                    ? "var(--ink-dim)"
                    : "transparent",
                  border:
                    isW || isL
                      ? "none"
                      : "1px dashed var(--border)",
                  borderRadius: 4,
                }}
              >
                {r}
              </span>
            );
          })}
        </div>

        {/* 게스트 지원 — 준비 중 (game_applications는 경기 단위, 팀 단위 지원은 미구현) */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="준비 중인 기능입니다"
          className="btn btn--primary btn--xl"
          style={{ marginBottom: 8, opacity: 0.6, cursor: "not-allowed" }}
        >
          게스트 지원
        </button>
        {/* 팀 매치 신청 — 준비 중 (team_match_requests 테이블 미구현) */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="준비 중인 기능입니다"
          className="btn"
          style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
        >
          팀 매치 신청
        </button>
      </div>

      {/* ── 카드 2: 연락 ── */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "var(--ink-dim)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          연락
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            lineHeight: 1.7,
          }}
        >
          팀장 · {captainName ?? "—"}
          <br />
          {/* 응답시간 집계는 미구현 (메시지/쪽지 응답 로그 집계 필요) */}
          <span style={{ color: "var(--ink-mute)" }}>응답시간 · 준비 중</span>
        </div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="준비 중인 기능입니다"
          className="btn btn--sm"
          style={{
            marginTop: 10,
            width: "100%",
            opacity: 0.6,
            cursor: "not-allowed",
          }}
        >
          쪽지 보내기
        </button>
      </div>
    </aside>
  );
}
