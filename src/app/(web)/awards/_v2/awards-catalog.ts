/* ============================================================
 * AwardsCatalog — /awards 정적 메타 카탈로그
 *
 * 왜 정적 카탈로그인가:
 * - DB에는 "Awards 카테고리"라는 개념이 없다. 시안의 6 honor 카테고리
 *   (FINALS MVP / 득점왕 / 어시스트왕 / 리바운드왕 / 올해의 감독 / NEW FACE)와
 *   올스타 5포지션(PG/SG/SF/PF/C)는 UI 그루핑용 메타로만 존재.
 * - PM 결정: API/Prisma 스키마 0 변경 → 정적 카탈로그로 메타 보강.
 * - 운영팀이 향후 카테고리를 추가하려면 이 파일을 수정.
 *
 * 어떻게:
 * - HONOR_KINDS: 시안 6 카테고리. value="—"는 DB 미지원("준비 중") 표기.
 * - ALL_STAR_POSITIONS: 5종 포지션 라벨. 1st/2nd 모두 동일 순서로 렌더.
 * - HONOR_COLOR: 카드 borderTop 색. 시안 그대로.
 * ============================================================ */

/** 시안 6 카테고리 키 */
export type HonorKind =
  | "finals_mvp"
  | "scoring_leader"
  | "assists_leader"
  | "rebounds_leader"
  | "coach_of_year"
  | "new_face";

/** Honor 카드 정적 메타 */
export interface HonorMeta {
  kind: HonorKind;
  /** 시안 카테고리 라벨 (대문자 영문 또는 한글) */
  label: string;
  /** 카드 상단 보더 색 (시안 그대로) */
  color: string;
  /** 데이터 미지원 시 안내 문구 (DB 매핑 가능하면 사용 안 함) */
  notReady?: string;
}

/** 시안 6 honor — 카드 그리드 순서 보존 */
export const HONOR_CATALOG: HonorMeta[] = [
  {
    kind: "finals_mvp",
    label: "FINALS MVP",
    color: "#F59E0B",
    // tournament_matches.mvp_player_id (결승 식별 로직 적용) — 매핑 가능
  },
  {
    kind: "scoring_leader",
    label: "득점왕",
    color: "#E31B23",
    // MatchPlayerStat GROUP BY player → 시즌 평균 득점 1위
  },
  {
    kind: "assists_leader",
    label: "어시스트왕",
    color: "#0F5FCC",
    // MatchPlayerStat GROUP BY player → 시즌 평균 어시 1위
  },
  {
    kind: "rebounds_leader",
    label: "리바운드왕",
    color: "#374151",
    // MatchPlayerStat GROUP BY player → 시즌 평균 리바운드 1위
  },
  {
    kind: "coach_of_year",
    label: "올해의 감독",
    color: "#DC2626",
    notReady: "집계 준비 중",
    // Team.coach_user_id 컬럼 미존재 → "준비 중"
  },
  {
    kind: "new_face",
    label: "NEW FACE",
    color: "#10B981",
    notReady: "집계 준비 중",
    // 루키 식별(가입 6개월 이내 + 첫 시즌) 로직 미정 → "준비 중"
  },
];

/** 올스타 포지션 5종 */
export const ALL_STAR_POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
export type AllStarPosition = (typeof ALL_STAR_POSITIONS)[number];

/** 시안의 1st/2nd 그룹 라벨 + 컬러 */
export const ALL_STAR_GROUPS = [
  { id: "first" as const, label: "퍼스트 팀", color: "var(--accent)" },
  { id: "second" as const, label: "세컨드 팀", color: "var(--cafe-blue)" },
];
