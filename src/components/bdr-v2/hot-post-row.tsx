/* ============================================================
 * HotPostRow — BDR v2 "공지·인기글" 리스트 한 줄
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Home.jsx의 HOT_POSTS 섹션은 BoardRow(6열 테이블)과 달리
 * **3열 grid(56px 배지 / 1fr 제목 / auto 조회수)** 간략 리스트 구조다.
 * "방금 올라온 글"은 풀 테이블(BoardRow), "공지·인기글"은 간략 리스트(HotPostRow)로
 * 정보 밀도가 명확히 다르므로, 조건부 분기 대신 별도 컴포넌트로 분리한다.
 *
 * 원본 참조: Dev/design/BDR v2/screens/Home.jsx L44~53
 * 원본 구조:
 *   <a grid[56px/1fr/auto] padding="11px 18px" borderBottom>
 *     <span badge--soft>{카테고리}</span>
 *     <span ellipsis>{title} [{comments}]</span>
 *     <span muted>👁 {views}</span>
 *   </a>
 *
 * 서버 컴포넌트 — Link만 사용.
 * ============================================================ */

import Link from "next/link";

export interface HotPostRowProps {
  /** 카테고리 한글 라벨 (예: "공지", "자유") — 좌측 배지에 표시 */
  category: string;
  /** 제목 */
  title: string;
  /** 댓글 수 — >0이면 제목 뒤에 accent 컬러 [N] */
  commentsCount?: number;
  /** 조회수 */
  views: number | string;
  /** 클릭 시 이동 경로 */
  href: string;
  /**
   * 공지 여부 — true면 배지를 `badge--red`로 강조, 아니면 `badge--soft`.
   * v2 시안 기본은 soft. 공지 카테고리만 red로 분기.
   */
  isNotice?: boolean;
}

/**
 * v2 Home "공지·인기글" 카드 패널 내부에 사용되는 한 줄 리스트 아이템.
 * 단독 사용 가능 — 외부 `.board` 컨테이너 필요 없음 (BoardRow와 다름).
 */
export function HotPostRow({
  category,
  title,
  commentsCount = 0,
  views,
  href,
  isNotice = false,
}: HotPostRowProps) {
  // 공지 카테고리는 red 배지로 강조, 나머지는 soft
  const badgeClass = isNotice ? "badge badge--red" : "badge badge--soft";

  return (
    // Link 자체가 row — v2 원본 <a> 태그와 동일 의미
    <Link
      href={href}
      style={{
        // 3열 그리드: 배지 고정폭 56px / 제목 유연 1fr / 조회수 auto
        display: "grid",
        gridTemplateColumns: "56px 1fr auto",
        gap: 10,
        padding: "11px 18px",
        borderBottom: "1px solid var(--border)",
        alignItems: "center",
        cursor: "pointer",
        color: "var(--ink)",
        textDecoration: "none",
      }}
    >
      {/* 1열: 카테고리 배지 — globals.css의 .badge 기본 스타일 활용 */}
      <span className={badgeClass} style={{ justifySelf: "start" }}>
        {category}
      </span>

      {/* 2열: 제목 + 댓글수. 긴 제목은 말줄임 처리 */}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
        {commentsCount > 0 && (
          // 댓글이 있으면 accent 컬러로 [N] 표시 (v2 원본과 동일 스타일)
          <span
            style={{
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: 12,
              marginLeft: 4,
            }}
          >
            [{commentsCount}]
          </span>
        )}
      </span>

      {/* 3열: 조회수 — Material Symbols visibility 아이콘 + 숫자 */}
      <span
        style={{
          fontSize: 12,
          color: "var(--ink-dim)",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14 }}
          aria-hidden
        >
          visibility
        </span>
        {views}
      </span>
    </Link>
  );
}
