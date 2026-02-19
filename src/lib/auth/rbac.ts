export const ROLES = {
  FREE: "free",
  PRO: "pro",
  PICKUP_HOST: "pickup_host",
  TOURNAMENT_ADMIN: "tournament_admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TOURNAMENT_ROLES = {
  ORGANIZER: "organizer",
  COORDINATOR: "coordinator",
  SCOREKEEPER: "scorekeeper",
} as const;

export type TournamentRole =
  (typeof TOURNAMENT_ROLES)[keyof typeof TOURNAMENT_ROLES];

const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.FREE]: 0,
  [ROLES.PRO]: 1,
  [ROLES.PICKUP_HOST]: 2,
  [ROLES.TOURNAMENT_ADMIN]: 3,
  [ROLES.SUPER_ADMIN]: 4,
};

export function hasRole(userRole: string, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? Infinity;
  return userLevel >= requiredLevel;
}

export function isSuperAdmin(role: string): boolean {
  return role === ROLES.SUPER_ADMIN;
}
