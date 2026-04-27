/* ============================================================
 * BoardRow — BDR v2 게시판 한 줄 행
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Home 시안의 "방금 올라온 글" 및 "공지·인기글", "열린 대회"
 * 섹션에서 반복되는 `.board__row` 형태의 가로 1줄 리스트 아이템을
 * 표준화한 컴포넌트.
 *
 * globals.css에 이미 이식된 `.board__row` 클래스가 grid 컬럼
 * (64px / 1fr / 120px / 90px / 72px / 72px) 6열을 담당하므로,
 * 본 컴포넌트는 그 6개 셀을 순서대로 채우는 역할만 수행한다.
 * 모바일(≤480px) 반응형 재배치는 responsive.css에서 처리됨.
 *
 * 서버 컴포넌트 — Link만 사용.
 * ============================================================ */

import Link from "next/link";

export interface BoardRowProps {
  /** 번호 (문자열/숫자) — 첫 번째 열에 표시 */
  num: string | number;
  /** 제목 */
  title: string;
  /** 게시판 이름 ("자유" / "공지" 등) */
  board: string;
  /** 작성자 닉네임 */
  author: string;
  /** 날짜 (예: "04-22" 또는 ISO 문자열의 MM-DD 부분만) */
  date: string;
  /** 조회수 */
  views: number | string;
  /** 썸네일 존재 여부 — 제목 앞에 이미지 아이콘 표시 */
  hasImage?: boolean;
  /** 댓글 수 — >0이면 제목 뒤에 [N] 형태로 표시 */
  commentsCount?: number;
  /** 24시간 이내 작성 여부 — true면 NEW 뱃지 표시 */
  isNew?: boolean;
  /** 클릭 시 이동 경로 */
  href: string;
  /** 공지 글 여부 — true면 .board__row.notice 배경 강조 */
  isNotice?: boolean;
  /**
   * 카테고리 배지 스타일 — 제목 앞에 `.badge badge--<type>` 표시.
   * - "soft": 기본 카페블루 soft 배지 (일반 카테고리)
   * - "red" : 강조 배지 (공지/중요)
   * - "ghost": 약한 아웃라인
   * - 생략(undefined) 시 배지 미표시 → 기존 동작 유지
   */
  categoryBadge?: "soft" | "red" | "ghost";
}

/**
 * `.board` 컨테이너 내부에 사용되는 한 줄 row.
 * 단독 사용 금지 — 반드시 `<div className="board">` 감싸야 grid 정렬.
 */
export function BoardRow({
  num,
  title,
  board,
  author,
  date,
  views,
  hasImage = false,
  commentsCount = 0,
  isNew = false,
  href,
  isNotice = false,
  categoryBadge,
}: BoardRowProps) {
  // Link 자체를 row로 만들기 위해 className 동적 구성
  const rowClass = isNotice ? "board__row notice" : "board__row";

  return (
    // Link가 grid row 역할 — style grid display는 globals.css의 .board__row가 담당
    <Link href={href} className={rowClass} style={{ textDecoration: "none" }}>
      {/* 1열: 번호 (모바일에서는 responsive.css로 숨김) */}
      <div className="num">{num}</div>

      {/* 2열: 제목 + 이미지 아이콘 + 댓글수 + NEW 뱃지 */}
      <div className="title">
        {/* 카테고리 배지 — board 값을 제목 앞에 뱃지로 강조 (시안 매칭)
         * 왜: v2 시안은 "자유/공지/Q&A" 등을 제목 앞 작은 칩으로 두어 스캔성↑.
         * categoryBadge가 정의된 경우에만 표시(기존 동작 하위 호환). */}
        {categoryBadge && (
          <span
            className={`badge badge--${categoryBadge}`}
            style={{ marginRight: 6, flex: "none" }}
          >
            {board}
          </span>
        )}
        {/* 썸네일 존재 표식 — Material Symbols image 아이콘 */}
        {hasImage && (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, color: "var(--ink-dim)" }}
            aria-hidden
          >
            image
          </span>
        )}
        {/* 제목 텍스트 (anchor 래핑 대신 inline span — 이미 Link가 감싸고 있음) */}
        <span>{title}</span>
        {/* 댓글이 있으면 accent 컬러로 개수 표시 */}
        {commentsCount > 0 && (
          <span className="comment-count">[{commentsCount}]</span>
        )}
        {/* 24시간 이내 작성 → NEW 뱃지 */}
        {isNew && (
          <span className="badge badge--new" style={{ marginLeft: 4 }}>
            N
          </span>
        )}
      </div>

      {/* 3열: 게시판 이름 (모바일에서는 responsive.css로 재배치) */}
      <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{board}</div>

      {/* 4열: 작성자 */}
      <div style={{ fontSize: 12 }}>{author}</div>

      {/* 5열: 날짜 */}
      <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{date}</div>

      {/* 6열: 조회수 */}
      <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{views}</div>
    </Link>
  );
}
