/**
 * 대회 상태 → 한글 레이블 매핑 (단일 소스).
 * 홈, 프로필, 대회 목록 페이지에서 공통 사용.
 */
export const TOURNAMENT_STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  active: "모집중",
  published: "모집중",
  registration: "모집중",
  registration_open: "모집중",
  registration_closed: "접수마감",
  ongoing: "진행중",
  completed: "완료",
  cancelled: "취소",
};
