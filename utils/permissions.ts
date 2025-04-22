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
  ASSIGN_ROLES = 'assign_roles'
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
    Permission.ASSIGN_ROLES
  ],
  [Role.MEMBER]: [
    Permission.CREATE_TEAM
  ],
  [Role.GUEST]: []
};

/**
 * Check if a role has a specific permission
 * @param role User role
 * @param permission Permission to check
 * @returns boolean indicating if the role has the permission
 */
export const hasPermission = (role: Role, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}; 