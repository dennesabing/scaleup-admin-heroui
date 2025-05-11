import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useRouter } from "next/router";

import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/lib/authMiddleware";
import {
  getOrganization,
  getOrganizationMembers,
  updateOrganizationMember,
  removeOrganizationMember,
  createOrganizationInvitation,
} from "@/lib/services/organizationService";
import {
  OrganizationModel,
  OrganizationMemberModel,
} from "@/types/organization";
import { UserModel, getCurrentUser } from "@/lib/auth";
import {
  Role,
  canViewOrganizationMembers,
  canManageOrganizationMembers,
} from "@/utils/permissions";
import { Users, MoreVertical, UserPlus, Trash, Edit } from "@/components/icons";
import AdminLayout from "@/layouts/admin";

export default function OrganizationMembersPage() {
  const [organization, setOrganization] = useState<OrganizationModel | null>(
    null,
  );
  const [members, setMembers] = useState<OrganizationMemberModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>(Role.MEMBER);
  const [isInviting, setIsInviting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  const router = useRouter();
  const { id } = router.query;

  // Protect this route
  const { isAuthenticated } = useAuth();
  const { setCurrentOrganizationId } = useOrganization();

  // Get current user on initial load
  useEffect(() => {
    const user = getCurrentUser();

    setCurrentUser(user);
  }, []);

  // Load organization and members data
  useEffect(() => {
    console.log("Loading organization members for ID:", id);
    const loadData = async () => {
      if (!id || typeof id !== "string") return;

      try {
        setIsLoading(true);
        setError(null);

        const [orgData, membersData] = await Promise.all([
          getOrganization(id),
          getOrganizationMembers(id),
        ]);

        setOrganization(orgData);

        // Get current user ID for comparison
        const currentUserId = getCurrentUser()?.id;

        // Log data for debugging
        console.log("Members data:", membersData);
        console.log("Current user ID:", currentUserId);

        // Ensure members array is valid
        if (Array.isArray(membersData)) {
          // Mark members who are the current user
          const updatedMembers = membersData.map((member) => ({
            ...member,
            is_current_user: member.user_id === currentUserId,
          }));

          setMembers(updatedMembers);
          console.log("Updated members:", updatedMembers);

          // Find the current user in members to determine role
          const currentUserMember = updatedMembers.find(
            (member) => member.is_current_user,
          );

          if (currentUserMember) {
            setUserRole(currentUserMember.role);

            // Check if user has permission to view organization members
            const canAccess = canViewOrganizationMembers(
              currentUserMember.role,
              currentUser?.roles,
            );

            setHasAccess(canAccess);

            // Redirect if no access
            if (!canAccess) {
              router.push(`/organizations/${id}`);
            }
          } else {
            // If user is not a member of this organization, check system roles
            const canAccess = canViewOrganizationMembers(
              null,
              currentUser?.roles,
            );

            setHasAccess(canAccess);

            if (!canAccess) {
              router.push(`/organizations/${id}`);
            }
          }
        } else {
          console.error("Members data is not an array:", membersData);
          setMembers([]);
        }

        // Set this as the current organization
        setCurrentOrganizationId(orgData.id);
      } catch (err) {
        console.error("Failed to load organization data:", err);
        setError("Failed to load organization data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, setCurrentOrganizationId, router, currentUser]);

  // Check if user can manage organization members
  const canManageMembers = canManageOrganizationMembers(
    userRole,
    currentUser?.roles,
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || typeof id !== "string") return;

    if (!inviteEmail.trim()) {
      setError("Email address is required");

      return;
    }

    try {
      setIsInviting(true);
      setError(null);
      setSuccessMessage(null);

      await createOrganizationInvitation(id, inviteEmail, inviteRole);

      setInviteEmail("");
      setSuccessMessage(`Invitation sent to ${inviteEmail}`);
    } catch (err) {
      console.error("Failed to send invitation:", err);
      setError("Failed to send invitation. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (
    memberId: number,
    userId: number,
    newRole: Role,
  ) => {
    if (!id || typeof id !== "string") return;

    try {
      setError(null);
      setSuccessMessage(null);

      await updateOrganizationMember(id, userId, newRole);

      // Update local state
      setMembers(
        members.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member,
        ),
      );

      setSuccessMessage("Member role updated successfully");
    } catch (err) {
      console.error("Failed to update member role:", err);
      setError("Failed to update member role. Please try again.");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!id || typeof id !== "string") return;

    if (!window.confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      await removeOrganizationMember(id, userId);

      // Update local state
      setMembers(members.filter((member) => member.user_id !== userId));

      setSuccessMessage("Member removed successfully");
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError("Failed to remove member. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // If user doesn't have access or there's an error, redirect to organization page
  if (!hasAccess || (error && !organization)) {
    // If not already redirecting, do it now
    if (id && typeof id === "string") {
      router.push(`/organizations/${id}`);
    } else {
      router.push("/organizations");
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-danger-100 text-danger p-4 rounded-lg">
          {error || "You don't have permission to access this page"}
        </div>
        <Button
          className="mt-4"
          variant="flat"
          onClick={() => router.push("/organizations")}
        >
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="light"
          onClick={() => router.push(`/organizations/${id}`)}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold">Organization Members</h1>
      </div>

      {error && (
        <div className="bg-danger-100 text-danger p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-success-100 text-success p-4 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      {/* Only show invitation section to users who can manage members */}
      {canManageMembers && (
        <div className="bg-default-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Invite Members</h2>

          <form
            className="flex flex-col md:flex-row gap-3"
            onSubmit={handleInvite}
          >
            <Input
              className="flex-grow"
              label="Email Address"
              placeholder="Enter email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />

            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat">Role: {inviteRole}</Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Role selection"
                onAction={(key) => setInviteRole(key as Role)}
              >
                <DropdownItem key={Role.ADMIN}>Admin</DropdownItem>
                <DropdownItem key={Role.MEMBER}>Member</DropdownItem>
                <DropdownItem key={Role.GUEST}>Guest</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Button
              color="primary"
              isLoading={isInviting}
              startContent={<UserPlus size={18} />}
              type="submit"
            >
              Send Invitation
            </Button>
          </form>
        </div>
      )}

      <div className="bg-default-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Organization Members</h2>

        {members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="text-default-400 mx-auto mb-2" size={32} />
            <p className="text-default-500">
              No members in this organization yet
            </p>
          </div>
        ) : (
          <Table aria-label="Organization members">
            <TableHeader>
              <TableColumn>USER</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                // Check if this member is the current user
                const isCurrentUser =
                  member.is_current_user ||
                  (currentUser && member.user_id === currentUser.id);

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {member.user?.profile?.avatar_url ? (
                          <img
                            alt={member.user.name || "User"}
                            className="w-8 h-8 rounded-full object-cover"
                            src={member.user.profile.avatar_url}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                            {member.user?.name?.charAt(0) ||
                              member.user?.email?.charAt(0) ||
                              "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {member.user?.name || "Unnamed User"}
                          </p>
                          {isCurrentUser && (
                            <p className="text-xs text-success-600">(You)</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.user?.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          member.role === Role.OWNER
                            ? "bg-warning-100 text-warning-600"
                            : member.role === Role.ADMIN
                              ? "bg-primary-100 text-primary-600"
                              : "bg-default-100 text-default-600"
                        }`}
                      >
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isCurrentUser ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-success-100 text-success-600">
                          You
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-default-100 text-default-600">
                          Member
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Only users who can manage members can manage other members */}
                      {canManageMembers && member.role !== Role.OWNER && (
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Member actions">
                            <DropdownItem
                              key="change-role"
                              startContent={<Edit size={16} />}
                              onClick={() =>
                                handleUpdateRole(
                                  member.id,
                                  member.user_id,
                                  member.role === Role.ADMIN
                                    ? Role.MEMBER
                                    : Role.ADMIN,
                                )
                              }
                            >
                              Change to{" "}
                              {member.role === Role.ADMIN ? "Member" : "Admin"}
                            </DropdownItem>
                            <DropdownItem
                              key="remove"
                              className="text-danger"
                              startContent={<Trash size={16} />}
                              onClick={() => handleRemoveMember(member.user_id)}
                            >
                              Remove
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

OrganizationMembersPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
