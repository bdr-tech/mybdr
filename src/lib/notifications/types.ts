// 알림 타입 상수 — 새 타입 추가 시 여기에만 추가
export const NOTIFICATION_TYPES = {
  // 경기 관련
  GAME_APPLICATION_RECEIVED: "game.application.received",     // 주최자: 신청 접수
  GAME_APPLICATION_SUBMITTED: "game.application.submitted",   // 신청자: 신청 완료
  GAME_APPLICATION_APPROVED: "game.application.approved",     // 신청자: 승인됨
  GAME_APPLICATION_REJECTED: "game.application.rejected",     // 신청자: 거부됨
  GAME_CANCELLED: "game.cancelled",                           // 참가자: 경기 취소

  // 팀 관련
  TEAM_JOIN_REQUEST_RECEIVED: "team.join_request.received",   // 팀장: 가입신청 접수
  TEAM_JOIN_REQUEST_APPROVED: "team.join_request.approved",   // 신청자: 가입 승인
  TEAM_JOIN_REQUEST_REJECTED: "team.join_request.rejected",   // 신청자: 가입 거부

  // 대회 관련
  TOURNAMENT_DDAY_REMINDER: "tournament.dday.reminder",       // 팀장: D-3/D-1 알림
  TOURNAMENT_BRACKET_APPROVAL: "tournament.bracket.approval", // 슈퍼관리자: 브라켓 승인 요청
  TOURNAMENT_BRACKET_APPROVED: "tournament.bracket.approved", // 관리자: 브라켓 승인됨
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
