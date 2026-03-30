/**
 * 대회 상태 → 한글 레이블 매핑 (단일 소스).
 * 4종 상태로 통일: 준비중 / 접수중 / 진행중 / 종료
 * 홈, 프로필, 대회 목록, admin, tournament-admin 전체에서 공통 사용.
 */
export const TOURNAMENT_STATUS_LABEL: Record<string, string> = {
  // 준비중 (아직 공개/접수 전)
  draft: "준비중",
  upcoming: "준비중",
  // 접수중 (참가 신청 받는 중)
  registration: "접수중",
  registration_open: "접수중",
  active: "접수중",
  published: "접수중",
  open: "접수중",
  opening_soon: "접수중",
  registration_closed: "접수중",
  // 진행중 (대회가 시작된 상태)
  in_progress: "진행중",
  live: "진행중",
  ongoing: "진행중",
  group_stage: "진행중",
  // 종료 (대회가 끝나거나 취소된 상태)
  completed: "종료",
  ended: "종료",
  closed: "종료",
  cancelled: "종료",
};

/**
 * 대회 상태 → 뱃지 variant 매핑.
 * 4종 상태에 맞춘 색상:
 *   준비중 = default (회색), 접수중 = info (파란색),
 *   진행중 = success (초록색), 종료 = secondary (회색)
 */
export const TOURNAMENT_STATUS_BADGE: Record<string, "default" | "success" | "error" | "warning" | "info" | "secondary"> = {
  // 준비중 → 회색
  draft: "default",
  upcoming: "default",
  // 접수중 → 파란색
  registration: "info",
  registration_open: "info",
  active: "info",
  published: "info",
  open: "info",
  opening_soon: "info",
  registration_closed: "info",
  // 진행중 → 초록색
  in_progress: "success",
  live: "success",
  ongoing: "success",
  group_stage: "success",
  // 종료 → 회색(secondary)
  completed: "secondary",
  ended: "secondary",
  closed: "secondary",
  cancelled: "secondary",
};

/**
 * 대회 형식 → 한글 레이블 매핑.
 */
export const TOURNAMENT_FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트",
  double_elimination: "더블 엘리미네이션",
  round_robin: "리그전",
  group_stage: "조별리그",
  group_stage_knockout: "조별리그+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트", // DB에 대문자로 저장된 레코드 대응
  dual_tournament: "듀얼토너먼트",
  full_league_knockout: "풀리그+토너먼트",
  swiss: "스위스 라운드",
};

/**
 * 대회 형식 약어 레이블 (카드 UI처럼 공간이 좁은 곳에서 사용).
 */
export const TOURNAMENT_FORMAT_LABEL_SHORT: Record<string, string> = {
  single_elimination: "토너먼트",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  group_stage: "조별리그",
  group_stage_knockout: "조별+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별+토너먼트",
  dual_tournament: "듀얼토너먼트",
  full_league_knockout: "풀리그+토너먼트",
  swiss: "스위스",
};

/**
 * 각 상태에서 전환 가능한 상태 목록 (admin 상태 변경 드롭다운용).
 * 4종 기준으로 재정의: 준비중→접수중→진행중→종료
 */
export const TOURNAMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  // 준비중 → 접수중 또는 종료(취소)
  draft: ["registration", "cancelled"],
  upcoming: ["registration", "cancelled"],
  // 접수중 → 진행중 또는 종료(취소)
  registration: ["in_progress", "cancelled"],
  registration_open: ["in_progress", "cancelled"],
  active: ["in_progress", "cancelled"],
  published: ["registration", "cancelled"],
  open: ["in_progress", "cancelled"],
  opening_soon: ["registration", "cancelled"],
  registration_closed: ["in_progress", "cancelled"],
  // 진행중 → 종료
  in_progress: ["completed", "cancelled"],
  live: ["completed", "cancelled"],
  ongoing: ["completed", "cancelled"],
  group_stage: ["completed", "cancelled"],
  // 종료 → 되돌리기(초안으로)
  completed: [],
  ended: [],
  closed: [],
  cancelled: ["draft"],
};

/**
 * 대회 상태 색상 매핑 (텍스트 색상용, 대회 상세 페이지 등에서 사용).
 * 4종 통일 기준.
 */
export const TOURNAMENT_STATUS_COLOR: Record<string, string> = {
  // 준비중 → 회색
  draft: "text-[var(--color-text-muted)]",
  upcoming: "text-[var(--color-text-muted)]",
  // 접수중 → 파란색
  registration: "text-[var(--color-info)]",
  registration_open: "text-[var(--color-info)]",
  active: "text-[var(--color-info)]",
  published: "text-[var(--color-info)]",
  open: "text-[var(--color-info)]",
  opening_soon: "text-[var(--color-info)]",
  registration_closed: "text-[var(--color-info)]",
  // 진행중 → 초록색
  in_progress: "text-[var(--color-success)]",
  live: "text-[var(--color-success)]",
  ongoing: "text-[var(--color-success)]",
  group_stage: "text-[var(--color-success)]",
  // 종료 → 회색
  completed: "text-[var(--color-text-muted)]",
  ended: "text-[var(--color-text-muted)]",
  closed: "text-[var(--color-text-muted)]",
  cancelled: "text-[var(--color-text-muted)]",
};
