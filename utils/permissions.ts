import { UserModel } from '@/lib/auth';

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

export enum Permission {
  // Organization permissions
  CREATE_ORGANIZATION = 'create_organization',
  UPDATE_ORGANIZATION = 'update_organization',
  DELETE_ORGANIZATION = 'delete_organization',
  MANAGE_ORGANIZATION_MEMBERS = 'manage_organization_members',
  
  // Team permissions
  CREATE_TEAM = 'create_team',
  UPDATE_TEAM = 'update_team',
  DELETE_TEAM = 'delete_team',
  MANAGE_TEAM_MEMBERS = 'manage_team_members',
  
  // User permissions
  INVITE_USERS = 'invite_users',
  REMOVE_USERS = 'remove_users',
  ASSIGN_ROLES = 'assign_roles',
  
  // View permissions
  VIEW_ORGANIZATION_MEMBERS = 'view_organization_members'
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.UPDATE_ORGANIZATION,
    Permission.MANAGE_ORGANIZATION_MEMBERS,
    Permission.CREATE_TEAM,
    Permission.UPDATE_TEAM,
    Permission.DELETE_TEAM,
    Permission.MANAGE_TEAM_MEMBERS,
    Permission.INVITE_USERS,
    Permission.REMOVE_USERS,
    Permission.ASSIGN_ROLES,
    Permission.VIEW_ORGANIZATION_MEMBERS
  ],
  [Role.MEMBER]: [
    Permission.CREATE_TEAM
  ],
  [Role.GUEST]: []
};

// Special roles in the system
export const SYSTEM_ROLES = {
  ORGANIZATION_HEAD: 'Organization Head',
  ORGANIZATION_ADMIN: 'Organization Admin',
  ORGANIZATION_MEMBER: 'Organization Member',
}

/**
 * Check if a role has a specific permission
 * @param role User role
 * @param permission Permission to check
 * @returns boolean indicating if the role has the permission
 */
export const hasPermission = (role: Role, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if a user has a specific system role
 * @param userRoles Array of user roles
 * @param role System role to check
 * @returns boolean indicating if the user has the specified role
 */
export const hasSystemRole = (userRoles: string[] | undefined, role: string): boolean => {
  return !!userRoles?.includes(role);
};

/**
 * Check if a user is an organization head
 * @param userRoles Array of user roles
 * @returns boolean indicating if the user is an organization head
 */
export const isOrganizationHead = (userRoles: string[] | undefined): boolean => {
  return hasSystemRole(userRoles, SYSTEM_ROLES.ORGANIZATION_HEAD) 
  || hasSystemRole(userRoles, SYSTEM_ROLES.ORGANIZATION_ADMIN);
};

/**
 * Check if a user can manage organization members
 * @param organizationRole User's role in the organization (owner, admin, etc.)
 * @param userRoles Array of user system roles
 * @returns boolean indicating if the user can manage organization members
 */
export const canManageOrganizationMembers = (
  organizationRole: string | null | undefined,
  userRoles: string[] | undefined
): boolean => {
  return (
    organizationRole === Role.OWNER ||
    organizationRole === Role.ADMIN ||
    isOrganizationHead(userRoles)
  );
};

/**
 * Check if a user can view organization members
 * @param organizationRole User's role in the organization (owner, admin, etc.)
 * @param userRoles Array of user system roles
 * @returns boolean indicating if the user can view organization members
 */
export const canViewOrganizationMembers = (
  organizationRole: string | null | undefined, 
  userRoles: string[] | undefined
): boolean => {
  return canManageOrganizationMembers(organizationRole, userRoles);
};

/**
 * Check if a user can manage teams
 * @param organizationRole User's role in the organization
 * @param userRoles Array of user system roles
 * @returns boolean indicating if the user can manage teams
 */
export const canManageTeams = (
  organizationRole: string | null | undefined,
  userRoles: string[] | undefined
): boolean => {
  return (
    organizationRole === Role.OWNER ||
    organizationRole === Role.ADMIN ||
    isOrganizationHead(userRoles)
  );
}; 

export const hasRole = (
  user: UserModel,
  role: string | null | undefined,
): boolean => {
  return role !== null && role !== undefined && !!user?.roles?.includes(role);
};