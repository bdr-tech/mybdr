import Link from "next/link";
import type { Metadata } from "next";

// SEO: About(소개) 페이지 메타데이터
export const metadata: Metadata = {
  title: "소개 | MyBDR",
  description:
    "MyBDR은 다음카페 시절부터 20년을 이어온 서울 3x3 농구 커뮤니티입니다. 흩어져 있던 픽업, 대회, 팀, 코트 정보를 한 곳에 모읍니다.",
};

/* ============================================================
 * About — BDR v2 More.jsx L22-115 시안 전체 적용 (Phase 5)
 *
 * 이유(왜):
 *   기존 AppNav "소개" 링크는 `/about` 라우트가 없어 `/`(홈)로 폴백.
 *   v2 시안 About 섹션을 정적 서버 컴포넌트로 신설.
 *   API/Prisma/서비스 0 변경 — 시안 가데이터를 그대로 노출하되,
 *   사용자 원칙(2026-04-25 추가)에 따라 가데이터는 "예시" 라벨/캡션
 *   으로 명시.
 *
 * 구조 (시안 6 섹션):
 *   1. Hero — eyebrow + 타이틀 + 리드 카피
 *   2. 통계 4셀 — 4년/멤버수/팀수/대회수 (예시)
 *   3. "우리가 만드는 것" 6 카드
 *   4. 운영진 6 — 이니셜 아바타 (예시)
 *   5. 파트너 로고 8 (예시)
 *   6. CTA — 가입/로그인 모두 /login (현재 /signup 별도 시안 있어
 *      Phase 6 회원가입 신설 시 분리 예정)
 *
 * 추후 구현 (scratchpad "🚧 Phase 5 More"):
 *   - 통계 4건 실수치 동적 카운트 (registry 쿼리 또는 정적 갱신)
 *   - 운영진 명단 실제 정보 입력
 *   - 파트너 로고 실제 자산
 * ============================================================ */

// 운영진 가데이터 — 시안 그대로 (실제 명단 확정 후 교체)
const team: { name: string; role: string; since: string }[] = [
  { name: "김승철", role: "대표 / 기획", since: "2022" },
  { name: "이경진", role: "개발총괄", since: "2022" },
  { name: "박상우", role: "운영총괄", since: "2023" },
  { name: "최지혜", role: "디자인", since: "2023" },
  { name: "정혁수", role: "커뮤니티", since: "2024" },
  { name: "한수민", role: "파트너십", since: "2024" },
];

// 통계 4건 — 시안 가데이터 (정확한 수치는 운영팀 확정 후 동적 카운트로 교체)
const stats: { v: string; k: string }[] = [
  { v: "20년", k: "커뮤니티 역사" },
  { v: "48,000+", k: "가입 멤버" },
  { v: "320+", k: "등록 팀" },
  { v: "1,240회", k: "개최 대회" },
];

// 가치 6 — 시안 그대로
const values: { icon: string; t: string; d: string }[] = [
  { icon: "🏀", t: "공정한 매치", d: "레이팅 기반 팀 매칭으로 실력에 맞는 경기를 제공합니다" },
  { icon: "📊", t: "투명한 기록", d: "모든 경기 결과와 개인 스탯이 영구적으로 기록·공개됩니다" },
  { icon: "🌆", t: "지역 연결", d: "동네 코트부터 대회까지, 가까운 농구 활동을 빠르게 찾습니다" },
  { icon: "🤝", t: "열린 커뮤니티", d: "초보부터 선출까지, 누구나 편하게 뛸 수 있는 문화를 지향합니다" },
  { icon: "⚖️", t: "공정한 운영", d: "심판 자격·경기 규정·분쟁 처리 모두 공개된 기준을 따릅니다" },
  { icon: "💡", t: "지속가능성", d: "광고 없는 커뮤니티. 운영은 멤버십과 파트너십으로 충당합니다" },
];

// 파트너 8 — 시안 가데이터 (실제 협력사 자산 확정 후 로고 SVG로 교체)
const partners: string[] = [
  "NIKE",
  "ADIDAS",
  "MOLTEN",
  "SPALDING",
  "UNDER ARMOUR",
  "BODY FRIEND",
  "11번가",
  "BDR STUDIO",
];

export default function AboutPage() {
  return (
    <div className="page">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* ===== 1. Hero ===== */}
        <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
          {/* eyebrow — v2 공통 .eyebrow 클래스 사용 */}
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            소개 · ABOUT
          </div>
          <h1
            style={{
              margin: "10px 0 14px",
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: "-0.025em",
            }}
          >
            서울의 농구를 더 가깝게
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--ink-soft)",
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            MyBDR은 다음카페 시절부터 20년을 이어온 서울 3x3 농구 커뮤니티입니다.
            흩어져 있던 픽업, 대회, 팀, 코트 정보를 한 곳에 모아{" "}
            <strong style={{ color: "var(--ink)" }}>누구나 쉽게 뛸 수 있는 환경</strong>을
            만듭니다.
          </p>
        </div>

        {/* ===== 2. 통계 4셀 — 가데이터(예시) ===== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.k}
              style={{
                padding: "22px 14px",
                textAlign: "center",
                // 첫 칸 제외 좌측 보더로 4분할 구분
                borderLeft: i > 0 ? "1px solid var(--border)" : 0,
                background: "var(--bg-alt)",
              }}
            >
              <div
                className="t-display"
                style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em" }}
              >
                {s.v}
              </div>
              <div
                style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 600, marginTop: 4 }}
              >
                {s.k}
              </div>
            </div>
          ))}
        </div>
        {/* 가데이터 안내 캡션 — 사용자 원칙: "예시" 라벨 명시 */}
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            textAlign: "center",
            marginBottom: 40,
            fontStyle: "italic",
          }}
        >
          ※ 위 수치는 예시이며, 정식 집계 후 실제 데이터로 교체될 예정입니다.
        </div>

        {/* ===== 3. 우리가 만드는 것 (가치 6) ===== */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>우리가 만드는 것</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            {values.map((b) => (
              <div key={b.t} className="card" style={{ padding: "20px 20px" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{b.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{b.t}</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.6 }}>
                  {b.d}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 4. 운영진 6 — 가데이터(예시) ===== */}
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>운영진</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 10,
            }}
          >
            {team.map((m) => (
              <div
                key={m.name}
                className="card"
                style={{ padding: "18px 12px", textAlign: "center" }}
              >
                {/* 이니셜 아바타 — 실제 사진 미준비, 이름 첫 글자 */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    margin: "0 auto 8px",
                    background: "var(--ink-soft)",
                    color: "var(--bg)",
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {m.name[0]}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
                <div
                  style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, marginTop: 2 }}
                >
                  {m.role}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ink-dim)",
                    marginTop: 3,
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  since {m.since}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            textAlign: "center",
            marginBottom: 40,
            fontStyle: "italic",
          }}
        >
          ※ 운영진 명단은 예시이며, 실제 멤버 정보로 교체될 예정입니다.
        </div>

        {/* ===== 5. 파트너 8 — 가데이터(예시) ===== */}
        <div
          style={{
            background: "var(--bg-alt)",
            borderRadius: 8,
            padding: "30px 28px",
            marginBottom: 40,
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>함께하는 파트너</h2>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 16 }}>
            MyBDR의 대회·활동을 지원하는 브랜드들 (예시)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            {partners.map((p) => (
              <div
                key={p}
                style={{
                  padding: "16px 12px",
                  background: "var(--bg)",
                  textAlign: "center",
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--ink-soft)",
                  borderRadius: 4,
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* ===== 6. CTA — 가입/로그인 모두 /login (회원가입 신설 전까지) ===== */}
        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            오늘, 농구할 수 있어요
          </h2>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 16 }}>
            가까운 코트에서 당신을 기다리는 사람들이 있습니다
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {/* PM 지시: 가입/로그인 모두 /login (회원가입 페이지 별도 시안 추후 작업) */}
            <Link href="/login" className="btn btn--primary btn--xl">
              지금 가입하기
            </Link>
            <Link href="/games" className="btn btn--xl">
              경기 둘러보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
