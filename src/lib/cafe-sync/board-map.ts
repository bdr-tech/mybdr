/**
 * 다음카페 BDR 동아리 게시판 상수 맵.
 *
 * 왜 이 모듈이 필요한가:
 *   Phase 1 POC는 3개 경기 게시판(IVHA/Dilr/MptT)을 순차 스캔했고,
 *   2026-04-21 에 4개 일반 게시판(N54V 자유 / IVd2 익명 / E7hL 칼럼 / bWL 구인구팀)
 *   추가 연동. URL 조립 / 게시판 식별 / 타겟 테이블 매핑을 한 곳에 모아두면
 *   fetcher/upsert/스크립트 어디서든 같은 상수로 일관성 유지 가능.
 *
 * DB 의존성 0. 순수 상수/함수만 노출.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 카페 식별자
// ─────────────────────────────────────────────────────────────────────────────

/** 다음카페 URL 경로의 카페 코드 (https://m.cafe.daum.net/{CAFE_CODE}/...) */
export const CAFE_CODE = "dongarry";

/**
 * 다음카페 내부 API(`/api/v1/common-articles`)가 요구하는 카페 그룹 코드(grpid).
 *
 * 왜 별도 상수:
 *   - URL 경로의 CAFE_CODE("dongarry")와 완전히 다른 값 (내부 식별자).
 *   - Phase 3 #6 Pagination 에서 신규 도입 — 번들 역공학으로 확정 (`IGaj`).
 *   - 7게시판 모두 동일 grpid 사용 (실측 2026-04-20 + 2026-04-21).
 *   - 하드코딩 방지 — listApiUrl 헬퍼에서만 참조.
 */
export const CAFE_GRP_CODE = "IGaj";

// ─────────────────────────────────────────────────────────────────────────────
// 게시판 정의
// ─────────────────────────────────────────────────────────────────────────────

/** 게시판 식별자 (다음카페 URL 의 4자리 fldid) */
export type BoardId =
  // 경기 게시판 3종 (games 테이블 타겟)
  | "IVHA"
  | "Dilr"
  | "MptT"
  // 일반 커뮤니티 게시판 4종 (community_posts 테이블 타겟, 2026-04-21 신규)
  | "N54V"
  | "IVd2"
  | "E7hL"
  | "bWL";

/** 이 게시판의 수집 타겟 테이블 */
export type BoardTarget = "games" | "community_posts";

/** games 타겟 게시판의 경기 유형 라벨 */
export type GameTypeLabel = "PICKUP" | "GUEST" | "PRACTICE";

/**
 * community_posts 타겟 게시판의 카테고리.
 *
 * 기존 카테고리 key(`general`/`review`/`recruit`) 재사용 + 신규 `anonymous` 1개.
 * UX 세션이 "대회후기" → "BDR칼럼" 라벨 변경 (key `review` 유지 합의, 2026-04-21).
 */
export type CommunityCategory = "general" | "anonymous" | "review" | "recruit";

/**
 * 카페 게시판 1건의 메타.
 *
 * 필드 사용 규칙 (target 에 따라 분리):
 *   - target="games"          → gameType / prefix 필수, category / anonymousAuthor 미사용
 *   - target="community_posts" → category 필수, gameType / prefix 미사용, anonymousAuthor 는 IVd2 만 true
 *
 * 명시적 discriminated union 으로 쓰면 resolveGameType 등 기존 호출부가 타입 확장 필요.
 * 실제로 resolveGameType 은 games 타겟 내부에서만 호출되므로 optional 필드 방식 채택 (2026-04-21).
 */
export interface CafeBoard {
  id: BoardId;
  label: string;
  target: BoardTarget;
  // games 타겟 전용
  gameType?: GameTypeLabel;
  prefix?: "PU" | "GU" | "PR";
  // community_posts 타겟 전용
  category?: CommunityCategory;
  /** 익명게시판(IVd2) 만 true. author_nickname 을 "익명" 으로 고정 저장 */
  anonymousAuthor?: boolean;
}

/**
 * 동기화 대상 7개 게시판.
 *
 * 순서:
 *   1~3 기존 경기 게시판 (2026-04-19 Phase 1 POC)
 *   4~7 신규 일반 게시판 (2026-04-21 추가)
 */
export const CAFE_BOARDS: CafeBoard[] = [
  // 경기 3종
  { id: "IVHA", target: "games", gameType: "PICKUP", prefix: "PU", label: "픽업게임" },
  { id: "Dilr", target: "games", gameType: "GUEST", prefix: "GU", label: "게스트 모집" },
  { id: "MptT", target: "games", gameType: "PRACTICE", prefix: "PR", label: "연습 경기" },
  // 일반 4종
  { id: "N54V", target: "community_posts", category: "general", label: "자유게시판" },
  {
    id: "IVd2",
    target: "community_posts",
    category: "anonymous",
    anonymousAuthor: true,
    label: "익명게시판",
  },
  { id: "E7hL", target: "community_posts", category: "review", label: "BDR칼럼" },
  { id: "bWL", target: "community_posts", category: "recruit", label: "구인구팀" },
];

// ─────────────────────────────────────────────────────────────────────────────
// URL 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

/** 게시판 목록 페이지 URL (모바일) */
export function listUrl(board: CafeBoard): string {
  return `https://m.cafe.daum.net/${CAFE_CODE}/${board.id}`;
}

/** 특정 게시글 상세 URL (모바일). Phase 2에서 사용 */
export function articleUrl(board: CafeBoard, dataid: string): string {
  return `https://m.cafe.daum.net/${CAFE_CODE}/${board.id}/${dataid}`;
}

/** id 문자열로 CAFE_BOARDS에서 찾아서 반환. 못 찾으면 null */
export function getBoardById(id: string): CafeBoard | null {
  return CAFE_BOARDS.find((b) => b.id === id) ?? null;
}

/** target 으로 필터링 (`--board=games` / `--board=community` CLI 확장 지원) */
export function getBoardsByTarget(target: BoardTarget): CafeBoard[] {
  return CAFE_BOARDS.filter((b) => b.target === target);
}

/**
 * 게시판 목록 API URL (2페이지 이후 cursor-based pagination 용).
 *
 * 왜 필요한가:
 *   - 모바일 HTML SSR은 1페이지 20건만 내려주고, 후속 페이지는 Vue 컴포넌트가 XHR로 호출.
 *   - 실측 엔드포인트: `GET /api/v1/common-articles?grpid=&fldid=&targetPage=N&afterBbsDepth=<cursor>&pageSize=20`
 *   - `afterBbsDepth` 는 단순 페이지번호가 아니라 **직전 페이지 마지막 글의 bbsDepth 문자열**(커서).
 *   - pageSize 실측 상한 50 (100은 HTTP 500 반환).
 *
 * 참조: scratchpad-cafe-sync.md "📋 Phase 3 #6 Pagination 설계안" (실측 8패턴)
 *
 * @param board 대상 게시판
 * @param cursor 직전 페이지 마지막 글의 bbsDepth (1페이지 호출 금지 — afterBbsDepth=0 은 빈 배열 반환)
 * @param targetPage 요청 페이지 번호 (2부터)
 * @param pageSize 페이지당 건수 (1~50, 상한 강제는 fetcher 쪽)
 */
export function listApiUrl(
  board: CafeBoard,
  cursor: string,
  targetPage: number,
  pageSize: number,
): string {
  // URLSearchParams 로 안전 인코딩 (bbsDepth 문자열에 특수문자 잠재 대비)
  const params = new URLSearchParams({
    grpid: CAFE_GRP_CODE,
    fldid: board.id,
    targetPage: String(targetPage),
    afterBbsDepth: cursor,
    pageSize: String(pageSize),
  });
  return `https://m.cafe.daum.net/api/v1/common-articles?${params.toString()}`;
}
