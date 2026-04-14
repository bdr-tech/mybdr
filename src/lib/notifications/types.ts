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
  TOURNAMENT_JOIN_SUBMITTED: "tournament.join.submitted",     // 신청자: 대회 참가 신청 완료
  TOURNAMENT_JOIN_RECEIVED: "tournament.join.received",       // 주최자: 대회 참가 신청 접수
  TOURNAMENT_DDAY_REMINDER: "tournament.dday.reminder",       // 팀장: D-3/D-1 알림
  TOURNAMENT_BRACKET_APPROVAL: "tournament.bracket.approval", // 슈퍼관리자: 브라켓 승인 요청
  TOURNAMENT_BRACKET_APPROVED: "tournament.bracket.approved", // 관리자: 브라켓 승인됨

  // 리포트 관련
  WEEKLY_REPORT: "weekly.report",                             // 유저: 주간 운동 리포트 도착

  // 심판 플랫폼 관련 — 협회 워크플로우 5종
  // 이유: 공고 → 신청 → 선정 → 책임자 → 경기 배정 → 정산 흐름에서
  //      심판/관리자에게 이벤트별 알림이 필요. notifications 테이블을 그대로 사용.
  REFEREE_POOL_SELECTED: "referee.pool.selected",             // 심판: 공고에 선정됨
  REFEREE_POOL_CHIEF: "referee.pool.chief_assigned",          // 심판: 책임심판으로 지정됨
  REFEREE_ASSIGNMENT_CREATED: "referee.assignment.created",   // 심판: 경기 배정 생성
  REFEREE_SETTLEMENT_PAID: "referee.settlement.paid",         // 심판: 정산 상태 전환(paid/cancelled/refunded)
  REFEREE_ANNOUNCEMENT_NEW: "referee.announcement.new",       // 심판: 새 배정 공고 게시
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
