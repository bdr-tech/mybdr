/**
 * EnrollPoster — 대회 포스터 placeholder
 *
 * 왜 이 컴포넌트가 있는가:
 *  시안 TournamentEnroll.jsx 의 <Poster> 는 실제 이미지가 아니라
 *  accent 그라데이션 + 거대 워터마크 텍스트로 구성된 카드형 placeholder다.
 *  현재 DB(tournaments) 에 poster_image_url 컬럼이 없으므로 동일하게 박제한다.
 *
 *  추후 poster_image 컬럼 도입 시 props.imageUrl 분기만 추가하면 된다.
 */

interface EnrollPosterProps {
  // 대회명 (워터마크 자리)
  title: string;
  // 회차 라벨 (Vol.12 같은 보조 텍스트). 없으면 ENROLL 표시
  edition?: string | null;
  // accent 색상 (시안 t.accent #DC2626 — 우리는 BDR Red 변수)
  accent?: string;
  // 카드 높이 (시안 step1 메인=240, aside=140)
  height?: number;
  // border-radius (aside 카드는 0 — 카드 상단 풀블리드)
  radius?: number;
}

export function EnrollPoster({
  title,
  edition,
  accent = "var(--accent)",
  height = 240,
  radius = 6,
}: EnrollPosterProps) {
  // 워터마크 텍스트는 대회명 첫 단어를 영문 대문자로 변환 (시안 효과 재현)
  // 한글 대회명일 경우 첫 1글자만 노출 (시안 톤 유지)
  const watermark = (() => {
    const head = title.split(/\s+/)[0] ?? title;
    // 영문/숫자 위주면 그대로, 아니면 첫 1자만
    return /^[a-zA-Z0-9]+$/.test(head) ? head.toUpperCase() : head.slice(0, 1);
  })();

  return (
    <div
      // 시안 Poster — accent 그라데이션 카드 + 우상단 거대 워터마크
      style={{
        position: "relative",
        height,
        borderRadius: radius,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${accent} 0%, color-mix(in oklab, ${accent} 70%, #000) 100%)`,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 20,
      }}
      aria-hidden
    >
      {/* 우상단 워터마크 — 시안 220px 거대 텍스트 (radius 작을 때는 축소) */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -10,
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: height >= 200 ? 180 : 120,
          letterSpacing: "-0.04em",
          opacity: 0.14,
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        {watermark}
      </div>

      {/* 좌하단 라벨 */}
      <div
        style={{
          fontFamily: "var(--ff-mono)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".12em",
          opacity: 0.75,
          marginBottom: 4,
        }}
      >
        {edition ?? "ENROLLMENT"}
      </div>
      <div
        style={{
          fontFamily: "var(--ff-display)",
          fontSize: height >= 200 ? 22 : 16,
          fontWeight: 900,
          letterSpacing: "-0.01em",
          lineHeight: 1.15,
          // 2줄까지 표시
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {title}
      </div>
    </div>
  );
}
