"use client";

/* ============================================================
 * V2 Podium — 1·2·3등 카드
 *
 * 시안(Dev/design/BDR v2/screens/Rank.jsx) 그대로 옮긴 컴포넌트.
 * 가운데 1등을 살짝 위로 띄우고(transform translateY(-12px)),
 * 좌측에 2등, 우측에 3등을 배치한다.
 * 이유: 시안이 [2등, 1등, 3등] 순서로 카드를 그려서 시각적으로
 *      1등을 중앙에 강조하기 때문.
 * ============================================================ */

interface PodiumItem {
  rank: number; // 1, 2, 3
  // 1등 강조용 색상 (팀이면 팀 색, 선수면 var(--cafe-blue))
  accentColor: string;
  // 카드 메인 라벨 (팀명 / 선수명)
  displayName: string;
  // 메타 텍스트 (예: "MKZ · 2240" 또는 "RDM · —")
  meta: string;
}

interface V2PodiumProps {
  items: PodiumItem[]; // 길이 3 (1등, 2등, 3등 순)
}

export function V2Podium({ items }: V2PodiumProps) {
  // 데이터가 3개 미만이면 포디움 생략 (UX 안정성)
  if (items.length < 3) return null;

  // 시안의 [1, 0, 2] 순서: 화면에 [2등, 1등, 3등]을 그린다
  // 이유: 가운데 1등을 강조하기 위해 시안이 채택한 배치
  const order = [1, 0, 2];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.1fr 1fr", // 가운데 카드를 살짝 더 넓게
        gap: 12,
        alignItems: "end",
        marginBottom: 24,
      }}
    >
      {order.map((idx) => {
        const item = items[idx];
        const isCenter = idx === 0; // 1등(배열 0번)이 가운데
        return (
          <div
            key={item.rank}
            className="card"
            style={{
              padding: "22px 18px",
              textAlign: "center",
              borderTop: `4px solid ${item.accentColor}`,
              transform: isCenter ? "translateY(-12px)" : "none",
              background: isCenter ? "var(--bg-elev)" : "var(--bg-alt)",
            }}
          >
            {/* 순위 숫자 (디스플레이 폰트로 큼직하게) */}
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: isCenter ? 44 : 34,
                letterSpacing: "-0.02em",
                color: item.accentColor,
                lineHeight: 1,
              }}
            >
              #{item.rank}
            </div>
            {/* 이름 */}
            <div
              style={{
                fontWeight: 800,
                fontSize: isCenter ? 20 : 16,
                marginTop: 10,
                letterSpacing: "-0.01em",
              }}
            >
              {item.displayName}
            </div>
            {/* 메타 (소속/레이팅 등) */}
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                marginTop: 4,
                fontFamily: "var(--ff-mono)",
              }}
            >
              {item.meta}
            </div>
          </div>
        );
      })}
    </div>
  );
}
