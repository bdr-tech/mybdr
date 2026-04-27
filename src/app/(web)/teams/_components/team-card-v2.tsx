import Link from "next/link";

// Phase 3 Teams — v2 시안 카드
// 이유: 시안 Team.jsx의 "상단 컬러 블록 + 3열 stat + 하단 btn--sm 2개" 구조를
// 현 DB 스키마(rating 없음)에 맞춰 재구성. rating=wins, founded=created_at 연도, tag=fallback.
// API/Prisma 변경 없음 — 기존 team-card.tsx 는 보존하고 신규 컴포넌트만 추가.

interface TeamCardV2Data {
  id: string;
  name: string;
  name_en: string | null;
  // primary/secondary 색상 — 카드 상단 accent 블록 배경용
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  wins: number;
  losses: number;
  accepting_members: boolean | null;
  created_at: string | null;
  // 목록 내 랭크 (wins desc sort index + 1). 시안 우측 상단 #랭크 표시용.
  rankIndex: number;
}

// 기존 team-card.tsx 의 resolveAccent 와 동일 로직.
// 이유: PM이 "재사용"하라고 했으나 원본이 export 되어 있지 않고, 기존 카드는 보존해야 함 → 로컬 복사.
// #ffffff 같은 너무 밝은 primary 는 가독성 떨어져 secondary 또는 BDR 빨강으로 대체.
function resolveAccent(primary: string | null, secondary: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "#E31B23";
  }
  return primary;
}

// tag 생성: 영문명이 있으면 그 첫 3글자, 없으면 한글 첫 3글자를 대문자로.
// 이유: DB에 tag 컬럼 없음 → 시안 스타일 지키려면 fallback 필요.
function buildTag(name: string, nameEn: string | null): string {
  const src = (nameEn && nameEn.trim()) || name;
  return src.trim().slice(0, 3).toUpperCase();
}

// created_at → 창단 연도
function foundedYear(createdAt: string | null): string {
  if (!createdAt) return "—";
  const y = new Date(createdAt).getFullYear();
  return Number.isFinite(y) ? String(y) : "—";
}

export function TeamCardV2({ team }: { team: TeamCardV2Data }) {
  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const tag = buildTag(team.name, team.name_en);
  const founded = foundedYear(team.created_at);
  const location = [team.city, team.district].filter(Boolean).join(" ");

  // 시안은 t.color + t.ink 2개로 ink 대비를 맞춤.
  // DB에는 ink 필드 없음 → accent 배경 위 흰 글자가 가장 안전 (primary 색상은 보통 중간~진한 채도).
  const inkOnAccent = "#FFFFFF";

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 상단 accent 블록: 로고 + tag + 팀명 + 창단 + 랭크 */}
      <div
        style={{
          background: accent,
          color: inkOnAccent,
          padding: "18px 18px 14px",
          position: "relative",
          minHeight: 98,
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        {/* 로고 또는 이니셜 박스 */}
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부 이미지 최적화 불필요 (v2 시안 일관성)
          <img
            src={team.logoUrl}
            alt=""
            style={{
              width: 54,
              height: 54,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              background: "rgba(255,255,255,.18)",
            }}
          />
        ) : (
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 8,
              flexShrink: 0,
              background: "rgba(255,255,255,.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: ".06em",
            }}
          >
            {tag}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 우측 상단 #랭크 (mono 폰트) */}
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              fontWeight: 700,
              opacity: 0.75,
            }}
          >
            #{team.rankIndex}
          </div>

          {/* tag (small, display font) */}
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: ".12em",
              opacity: 0.8,
            }}
          >
            {tag}
          </div>

          {/* 팀명 */}
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {team.name}
          </div>

          {/* 창단 연도 + (location 있으면 · 로 이어서) */}
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6 }}>
            창단 {founded}
            {location ? ` · ${location}` : ""}
          </div>
        </div>
      </div>

      {/* 3열 stat: 레이팅(=wins) / 승 / 패 */}
      <div
        style={{
          padding: "14px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-dim)",
              fontWeight: 700,
            }}
          >
            레이팅
          </div>
          {/* PM 결정: 가짜 수치 금지. 레이팅 박스에 wins 표시 */}
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 20,
              fontWeight: 900,
              marginTop: 2,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {team.wins}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-dim)",
              fontWeight: 700,
            }}
          >
            승
          </div>
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 20,
              fontWeight: 900,
              marginTop: 2,
              color: "var(--ok)",
            }}
          >
            {team.wins}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-dim)",
              fontWeight: 700,
            }}
          >
            패
          </div>
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 20,
              fontWeight: 900,
              marginTop: 2,
              color: "var(--ink-mute)",
            }}
          >
            {team.losses}
          </div>
        </div>
      </div>

      {/* 하단 액션 바: 상세(Link) + 매치 신청(UI only) */}
      <div
        style={{
          padding: "10px 16px 14px",
          display: "flex",
          gap: 6,
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
        }}
      >
        {/* 상세: 기존 팀 상세 라우트로 이동 (기존 team-card 와 동일 경로) */}
        <Link
          href={`/teams/${team.id}`}
          className="btn btn--sm"
          style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
        >
          상세
        </Link>
        {/* 매치 신청: UI only (리디자인 원칙 — 미구현 기능은 UI만 배치). disabled 로 명시 */}
        <button
          type="button"
          className="btn btn--sm"
          style={{ flex: 1, opacity: 0.55, cursor: "not-allowed" }}
          disabled
          aria-label="매치 신청 (준비 중)"
          title="준비 중인 기능입니다"
        >
          매치 신청
        </button>
      </div>
    </div>
  );
}
