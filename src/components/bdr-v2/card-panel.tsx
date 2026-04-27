/* ============================================================
 * CardPanel — BDR v2 일반 카드 패널 래퍼
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Home 시안에서 "공지·인기글", "열린 대회" 같이 제목 + 더보기
 * 링크가 있는 헤더 바가 달린 카드 섹션 패턴이 반복됨. `.card` 래퍼
 * + 상단 헤더(구분선 1px) + children 본문 구조를 표준화.
 *
 * globals.css의 `.card` / `.board` 클래스를 내부에 자유롭게 배치
 * 가능하도록 padding 0 옵션과 children slot을 제공.
 *
 * 서버 컴포넌트 — 인터랙션 없음.
 * ============================================================ */

import Link from "next/link";

export interface CardPanelProps {
  /** 패널 상단 타이틀 */
  title: string;
  /** "더보기" 링크 — 생략 시 우측 링크 미표시 */
  moreHref?: string;
  /** 더보기 라벨 커스터마이즈 (기본 "더보기 ›") */
  moreLabel?: string;
  /**
   * true면 본문 padding 제거.
   * 내부에 `.board` 등 자체 구조를 가진 자식을 쓸 때 사용.
   */
  noPadding?: boolean;
  /** 본문 내용 */
  children: React.ReactNode;
}

/**
 * 제목 헤더가 있는 카드 패널.
 * 단순 래퍼로, 내부에 BoardRow / 목록 / 일반 컨텐츠 등 자유롭게 배치.
 */
export function CardPanel({
  title,
  moreHref,
  moreLabel = "더보기 ›",
  noPadding = false,
  children,
}: CardPanelProps) {
  return (
    // .card = v2 공통 카드 셸 — noPadding일 때도 border-radius 유지
    <section className="card" style={{ padding: 0 }}>
      {/* 상단 헤더: 제목 + 우측 더보기 링크 */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {moreHref && (
          // 더보기 링크 — 작은 글씨, 기본 링크 컬러 상속
          <Link href={moreHref} style={{ fontSize: 12 }}>
            {moreLabel}
          </Link>
        )}
      </div>

      {/* 본문 slot — noPadding이면 자식이 자체 패딩 관리 */}
      <div style={noPadding ? undefined : { padding: "14px 18px" }}>
        {children}
      </div>
    </section>
  );
}
