/* ============================================================
 * SeasonStats — /profile v2 본인 시즌 스탯 6열 카드
 *
 * 왜:
 * - v2 Profile.jsx L70~83 "시즌 스탯 2026 Spring" 블록 재현.
 * - 6칸 정보: 경기 / 승률 / PPG / APG / RPG / 레이팅.
 *   · 레이팅 필드가 DB 에 없어서 "★ evaluation_rating" (유저 평가 점수)으로 대체.
 *   · 없는 데이터는 "-" 표시 (시안의 placeholder 규칙 따름 — Stats Strip 패턴).
 * - getPlayerStats 가 돌려주는 careerAverages / winRate 를 그대로 숫자 포맷만 맞춤.
 *
 * 어떻게:
 * - 6열 grid — 시안처럼 border 1px + 셀별 좌측 border 구분선으로 일체감 부여.
 * - 각 셀 숫자는 ff-display(Archivo 900) — 두껍게, letter-spacing -0.01em.
 * - 경기수 0 이면 전체 카드 "-/%"" 폴백 표시 (careerAverages 가 null 이면 동일).
 * ============================================================ */

export interface SeasonStatsData {
  /** 통산 경기 수 (aggregate._count.id) */
  games: number;
  /** 승률(%) — null 이면 "-" */
  winRate: number | null;
  /** 경기당 평균 득점 — null 이면 "-" */
  ppg: number | null;
  /** 경기당 평균 어시스트 */
  apg: number | null;
  /** 경기당 평균 리바운드 */
  rpg: number | null;
  /** ★ 평점 (evaluation_rating, 0~5) — 0 이면 "-" */
  rating: number | null;
}

export interface SeasonStatsProps {
  data: SeasonStatsData;
  /** 카드 우측 상단 표시용 — 없으면 "시즌 스탯" 만 렌더 */
  seasonLabel?: string;
}

// 숫자 포맷 — null / 0 은 "-" 로 표시 (0이 의미 있는 경우 호출자가 0 대신 명시값 전달)
function fmtAvg(v: number | null | undefined, digits = 1): string {
  if (v == null) return "-";
  return v.toFixed(digits);
}

function fmtGames(v: number): string {
  return v > 0 ? v.toLocaleString() : "-";
}

function fmtWinRate(v: number | null): string {
  if (v == null) return "-";
  // winRate 는 이미 %단위 소수점 1자리 — 정수 표시가 시안과 일치 ("63%")
  return `${Math.round(v)}%`;
}

export function SeasonStats({ data, seasonLabel }: SeasonStatsProps) {
  // 6칸 셀 배열 — key 로 React 반복, label 은 ff-display 소문자 uppercase
  const cells: { label: string; value: string }[] = [
    { label: "경기", value: fmtGames(data.games) },
    { label: "승률", value: fmtWinRate(data.winRate) },
    { label: "PPG", value: fmtAvg(data.ppg) },
    { label: "APG", value: fmtAvg(data.apg) },
    { label: "RPG", value: fmtAvg(data.rpg) },
    // 레이팅은 DB 없어서 ★ evaluation_rating 대체. 소수 2자리 (0.00~5.00).
    { label: "레이팅", value: data.rating != null && data.rating > 0 ? data.rating.toFixed(2) : "-" },
  ];

  return (
    <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
          시즌 스탯{" "}
          {seasonLabel && (
            <span
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                fontWeight: 500,
              }}
            >
              {seasonLabel}
            </span>
          )}
        </h2>
      </div>

      {/* 6열 grid — border 1px 바깥틀, 셀 사이 좌측 border */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 0,
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {cells.map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: "14px 10px",
              textAlign: "center",
              borderLeft: i > 0 ? "1px solid var(--border)" : 0,
              background: "var(--bg-alt)",
            }}
          >
            {/* 숫자 — ff-display 900 24px */}
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 24,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
              }}
            >
              {s.value}
            </div>
            {/* 라벨 — 작은 글씨 */}
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 600,
                letterSpacing: ".04em",
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
