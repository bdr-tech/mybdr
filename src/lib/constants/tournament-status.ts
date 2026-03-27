/**
 * 대회 상태 → 한글 레이블 매핑 (단일 소스).
 * 홈, 프로필, 대회 목록, admin 페이지에서 공통 사용.
 */
export const TOURNAMENT_STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  active: "진행중",
  published: "모집중",
  registration: "모집중",
  registration_open: "모집중",
  registration_closed: "접수마감",
  in_progress: "진행중",
  ongoing: "진행중",
  completed: "완료",
  cancelled: "취소",
};

/**
 * 대회 상태 → 뱃지 색상 매핑 (admin 테이블 등에서 사용).
 */
export const TOURNAMENT_STATUS_BADGE: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  draft: "default",
  active: "success",
  published: "info",
  registration: "info",
  registration_open: "info",
  registration_closed: "warning",
  in_progress: "success",
  ongoing: "success",
  completed: "info",
  cancelled: "error",
};

/**
 * 대회 형식 → 한글 레이블 매핑.
 */
export const TOURNAMENT_FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미네이션",
  double_elimination: "더블 엘리미네이션",
  round_robin: "리그전",
  group_stage: "조별리그",
  group_stage_knockout: "조별+토너먼트",
  hybrid: "혼합",
};

/**
 * 각 상태에서 전환 가능한 상태 목록 (admin 상태 변경 드롭다운용).
 */
export const TOURNAMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["registration_open", "cancelled"],
  active: ["registration_open", "ongoing", "cancelled"],
  published: ["registration_open", "cancelled"],
  registration: ["registration_closed", "cancelled"],
  registration_open: ["registration_closed", "cancelled"],
  registration_closed: ["ongoing", "in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: [],
  cancelled: ["draft"],
};
