import {
  Role,
  Permission,
  SYSTEM_ROLES,
  hasPermission,
  hasSystemRole,
  isOrganizationHead,
  canManageOrganizationMembers,
  canViewOrganizationMembers,
  canManageTeams,
  hasRole
} from '@/utils/permissions';
import { UserModel } from '@/lib/auth';

describe('Permission Utilities', () => {
  // Sample user for testing
  const mockUser: UserModel = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    roles: [SYSTEM_ROLES.ORGANIZATION_HEAD]
  };

  describe('hasPermission', () => {
    it('should return true if the role has the permission', () => {
      expect(hasPermission(Role.OWNER, Permission.CREATE_ORGANIZATION)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.MANAGE_ORGANIZATION_MEMBERS)).toBe(true);
    });

    it('should return false if the role does not have the permission', () => {
      expect(hasPermission(Role.GUEST, Permission.CREATE_ORGANIZATION)).toBe(false);
      expect(hasPermission(Role.MEMBER, Permission.MANAGE_ORGANIZATION_MEMBERS)).toBe(false);
    });
  });

  describe('hasSystemRole', () => {
    it('should return true if user has the role', () => {
      expect(hasSystemRole(mockUser.roles, SYSTEM_ROLES.ORGANIZATION_HEAD)).toBe(true);
    });

    it('should return false if user does not have the role', () => {
      expect(hasSystemRole(mockUser.roles, SYSTEM_ROLES.ORGANIZATION_ADMIN)).toBe(false);
    });

    it('should handle undefined roles', () => {
      expect(hasSystemRole(undefined, SYSTEM_ROLES.ORGANIZATION_HEAD)).toBe(false);
    });
  });

  describe('isOrganizationHead', () => {
    it('should return true if user is organization head', () => {
      expect(isOrganizationHead(mockUser.roles)).toBe(true);
    });

    it('should return true if user is organization admin', () => {
      expect(isOrganizationHead(['Organization Admin'])).toBe(true);
    });

    it('should return false if user is neither head nor admin', () => {
      expect(isOrganizationHead(['Some Other Role'])).toBe(false);
    });

    it('should handle undefined roles', () => {
      expect(isOrganizationHead(undefined)).toBe(false);
    });
  });

  describe('canManageOrganizationMembers', () => {
    it('should return true for organization owners', () => {
      expect(canManageOrganizationMembers(Role.OWNER, [])).toBe(true);
    });

    it('should return true for organization admins', () => {
      expect(canManageOrganizationMembers(Role.ADMIN, [])).toBe(true);
    });

    it('should return true for users with organization head role', () => {
      expect(canManageOrganizationMembers(Role.MEMBER, [SYSTEM_ROLES.ORGANIZATION_HEAD])).toBe(true);
    });

    it('should return false for regular members without special roles', () => {
      expect(canManageOrganizationMembers(Role.MEMBER, [])).toBe(false);
    });

    it('should handle null or undefined values', () => {
      expect(canManageOrganizationMembers(null, [])).toBe(false);
      expect(canManageOrganizationMembers(undefined, [])).toBe(false);
      expect(canManageOrganizationMembers(Role.MEMBER, undefined)).toBe(false);
    });
  });

  describe('canViewOrganizationMembers', () => {
    it('should return same result as canManageOrganizationMembers', () => {
      // This test is valid as long as canViewOrganizationMembers just calls canManageOrganizationMembers
      expect(canViewOrganizationMembers(Role.OWNER, [])).toBe(canManageOrganizationMembers(Role.OWNER, []));
      expect(canViewOrganizationMembers(Role.MEMBER, [])).toBe(canManageOrganizationMembers(Role.MEMBER, []));
      expect(canViewOrganizationMembers(null, [])).toBe(canManageOrganizationMembers(null, []));
    });
  });

  describe('canManageTeams', () => {
    it('should return true for organization owners', () => {
      expect(canManageTeams(Role.OWNER, [])).toBe(true);
    });

    it('should return true for organization admins', () => {
      expect(canManageTeams(Role.ADMIN, [])).toBe(true);
    });

    it('should return true for users with organization head role', () => {
      expect(canManageTeams(Role.MEMBER, [SYSTEM_ROLES.ORGANIZATION_HEAD])).toBe(true);
    });

    it('should return false for regular members without special roles', () => {
      expect(canManageTeams(Role.MEMBER, [])).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the role', () => {
      expect(hasRole(mockUser, SYSTEM_ROLES.ORGANIZATION_HEAD)).toBe(true);
    });

    it('should return false if user does not have the role', () => {
      expect(hasRole(mockUser, SYSTEM_ROLES.ORGANIZATION_ADMIN)).toBe(false);
    });

    it('should handle null or undefined role', () => {
      expect(hasRole(mockUser, null)).toBe(false);
      expect(hasRole(mockUser, undefined)).toBe(false);
    });

    it('should handle user without roles', () => {
      const userWithoutRoles = { id: 2, email: 'no-roles@example.com' };
      expect(hasRole(userWithoutRoles as UserModel, SYSTEM_ROLES.ORGANIZATION_HEAD)).toBe(false);
    });
  });
}); 