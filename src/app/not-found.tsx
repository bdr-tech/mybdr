import Link from "next/link";
import type { Metadata } from "next";

// SEO: 404 페이지 메타데이터
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요 | MyBDR",
};

/* ============================================================
 * 404 NotFound — BDR v2 More.jsx L3-20 시안 적용 (Phase 5)
 *
 * 이유(왜):
 *   기존 토스풍 작은 카드형 → v2 시안의 "에어볼!" 농구 메타포 +
 *   거대 404 (120px display 폰트) + 홈/검색/도움말 3버튼 패턴으로 교체.
 *   글로벌 not-found이므로 서버 컴포넌트로 둠 (history.back 제거).
 *
 * 디자인 토큰:
 *   - color: var(--accent) 거대 404, var(--ink) / var(--ink-mute)
 *   - font: var(--ff-display) 거대 숫자, 본문은 시스템
 *   - layout: .page 클래스 + grid placeItems center
 *
 * 버튼 라우팅 (PM 확정안 2026-04-22):
 *   - 홈으로 → /
 *   - 검색  → /search (Phase 2 글로벌 검색 페이지)
 *   - 도움말 → /help/glossary
 * ============================================================ */
export default function NotFound() {
  return (
    <div
      className="page"
      style={{
        // 시안 그대로: 60vh 중앙 정렬
        display: "grid",
        placeItems: "center",
        minHeight: "60vh",
        textAlign: "center",
      }}
    >
      <div>
        {/* 거대 404 — 시안 fontSize:120, fontWeight:900, accent 컬러 */}
        <div
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "var(--accent)",
          }}
        >
          404
        </div>

        {/* 메인 카피 — "에어볼!" 농구 메타포 (시안 그대로) */}
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 14 }}>
          에어볼! 해당 페이지를 찾을 수 없습니다
        </div>

        {/* 보조 설명 */}
        <div
          style={{
            fontSize: 14,
            color: "var(--ink-mute)",
            marginTop: 8,
            maxWidth: 420,
            margin: "8px auto 0",
          }}
        >
          주소가 잘못되었거나, 삭제된 콘텐츠일 수 있습니다. 홈으로 돌아가거나 검색을 이용해주세요.
        </div>

        {/* CTA 3버튼 — Primary 홈 / Default 검색·도움말 */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          {/* Primary CTA: 홈 */}
          <Link href="/" className="btn btn--primary">
            홈으로
          </Link>
          {/* 검색 → Phase 2 글로벌 검색 페이지 */}
          <Link href="/search" className="btn">
            검색
          </Link>
          {/* 도움말 → 기존 용어사전 */}
          <Link href="/help/glossary" className="btn">
            도움말
          </Link>
        </div>
      </div>
    </div>
  );
}
