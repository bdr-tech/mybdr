// 구독/역할 체계 — 권한 상수 중앙화
// 낮은 → 높은 순서: FREE < PICKUP_HOST < TEAM_LEADER < TOURNAMENT_ADMIN
// isAdmin = true → 슈퍼관리자 (최대 4명, admin 페이지에서 관리)

export const MEMBERSHIP = {
  FREE: 0,
  PICKUP_HOST: 1,
  TEAM_LEADER: 2,
  TOURNAMENT_ADMIN: 3,
} as const;

export type MembershipType = (typeof MEMBERSHIP)[keyof typeof MEMBERSHIP];

export const MEMBERSHIP_LABELS: Record<MembershipType, string> = {
  0: "일반유저",
  1: "픽업호스트",
  2: "팀장",
  3: "대회관리자",
};

export const MEMBERSHIP_PRICES: Record<MembershipType, string> = {
  0: "무료",
  1: "₩50,000/월",
  2: "₩3,900/월",
  3: "₩199,000/월",
};

export const MAX_SUPER_ADMINS = 4;

export function canHostPickup(mt: number): boolean {
  return mt >= MEMBERSHIP.PICKUP_HOST;
}

export function canCreateTeam(mt: number): boolean {
  return mt >= MEMBERSHIP.TEAM_LEADER;
}

export function canManageTournament(mt: number): boolean {
  return mt >= MEMBERSHIP.TOURNAMENT_ADMIN;
}

export function determineRole(user: {
  isAdmin: boolean | null;
  membershipType: number;
}): string {
  if (user.isAdmin) return "super_admin";
  if (user.membershipType >= MEMBERSHIP.TOURNAMENT_ADMIN) return "tournament_admin";
  if (user.membershipType >= MEMBERSHIP.TEAM_LEADER) return "team_leader";
  if (user.membershipType >= MEMBERSHIP.PICKUP_HOST) return "pickup_host";
  return "free";
}
