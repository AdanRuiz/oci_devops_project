export const TEAM_ROLES = ['MANAGER', 'DEVELOPER'] as const

export type TeamRole = (typeof TEAM_ROLES)[number]