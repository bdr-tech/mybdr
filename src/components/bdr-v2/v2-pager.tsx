"use client";

/**
 * V2Pager — BDR v2 페이지네이션 컴포넌트
 *
 * 이유: BDR v2 시안 `components.jsx`의 `<Pager>` 패턴을 재사용 단위로 추출.
 *       Phase 4 BoardList에서 첫 사용. 향후 다른 목록 페이지(/games, /tournaments 등)에서도 동일 마크업 재사용 가능.
 *
 * CSS 의존: `.pager`, `.pager__btn` (globals.css에 이미 정의됨).
 *
 * 동작: 클릭 시 onGo(pageNumber) 콜백 호출. 부모가 currentPage 상태를 관리.
 */

interface V2PagerProps {
  current: number;        // 현재 페이지 (1부터)
  total: number;          // 총 페이지 수
  onGo: (page: number) => void; // 페이지 이동 콜백
  windowSize?: number;    // 표시할 페이지 버튼 개수 (기본 10) — 너무 많으면 5개 이상씩 절단
}

export function V2Pager({ current, total, onGo, windowSize = 10 }: V2PagerProps) {
  // 페이지가 0 이하거나 1페이지뿐이면 렌더하지 않음 (호출부 책임이지만 방어)
  if (total <= 1) return null;

  // 윈도우 슬라이딩 — current 중심으로 windowSize 개만 노출
  // 예: total=50, current=15, windowSize=10 → [11~20] 표시
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + windowSize - 1);
  // 끝에서 부족하면 시작을 당김
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pager">
      {/* 이전 버튼 — 1페이지에서는 클릭해도 동작 안 함 */}
      <button
        type="button"
        className="pager__btn"
        onClick={() => onGo(Math.max(1, current - 1))}
        aria-label="이전 페이지"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className="pager__btn"
          data-active={p === current}
          onClick={() => onGo(p)}
        >
          {p}
        </button>
      ))}
      {/* 다음 버튼 */}
      <button
        type="button"
        className="pager__btn"
        onClick={() => onGo(Math.min(total, current + 1))}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </div>
  );
}
