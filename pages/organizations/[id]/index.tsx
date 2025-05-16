import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";

import { useOrganization } from "@/contexts/OrganizationContext";
import {
  OrganizationModel,
  OrganizationMemberModel,
  OrganizationInvitationModel
} from "@/lib/organization";
import { TeamModel } from "@/lib/team";
import { formatDate, formatDateTime } from "@/lib/utils/dateFormatter";
import { getCurrentUser } from "@/lib/auth";
import { useAuth } from "@/lib/authMiddleware";
import { isOrganizationHead } from "@/utils/permissions";
import {
  getOrganization,
  getOrganizationMembers,
  createOrganizationInvitation,
  removeOrganizationMember,
  cancelOrganizationInvitation,
  getOrganizationInvitations,
  resendOrganizationInvitation,
  getOrganizationAttributes,
  updateOrganizationMember,
} from "@/lib/services/organizationService";
import {
  createTeam,
  getOrganizationTeams,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getUserTeams,
} from "@/lib/services/teamService";
import { Role } from "@/utils/permissions";
import AdminLayout from "@/layouts/admin";
import {
  BuildingIcon,
  Users,
  Settings,
  PlusIcon,
  Trash,
  X,
  Mail,
  RefreshCw,
} from "@/components/icons";

// Simple User component implementation
const User = ({
  name,
  description,
  avatarProps,
}: {
  name: string;
  description: string;
  avatarProps: any;
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-default-200 flex items-center justify-center text-default-600 overflow-hidden">
        {avatarProps.src ? (
          <img
            alt={avatarProps.name}
            className="w-full h-full object-cover"
            src={avatarProps.src}
          />
        ) : (
          avatarProps.name?.charAt(0).toUpperCase()
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-default-500">{description}</p>
      </div>
    </div>
  );
};

// Define the invitation response interface which might have pending_invitations
interface OrganizationInvitationResponse {
  data?: OrganizationInvitationModel[];
  pending_invitations?: OrganizationInvitationModel[];
}

// Update TeamModel to include member count
interface EnhancedTeamModel extends TeamModel {
  member_count?: number;
}

// Update the UserTeamsDisplay component to show both organization and team roles
const UserTeamsDisplay = ({ 
  organizationId, 
  userId, 
  userName,
  orgRole 
}: { 
  organizationId: string | number; 
  userId: string | number;
  userName: string;
  orgRole?: string;
}) => {
  const [userTeams, setUserTeams] = useState<TeamModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserTeams = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const teams = await getUserTeams(organizationId, userId);
        setUserTeams(teams || []);
      } catch (err) {
        console.error("Failed to load user teams:", err);
        setError("Failed to load teams. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId && userId) {
      fetchUserTeams();
    }
  }, [organizationId, userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-100 text-danger p-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-2">
      {userTeams.length === 0 ? (
        <p className="text-sm text-default-500 italic">
          {userName} is not a member of any teams in this organization.
        </p>
      ) : (
        <div className="space-y-2">
          {userTeams.map((team) => (
            <div key={team.id} className="flex items-center gap-2">
              <Chip size="sm" color="primary" variant="flat">
                {team.name}
              </Chip>
              <span className="text-xs text-default-500">Team Member</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function OrganizationDetailPage() {
  const [organization, setOrganization] = useState<OrganizationModel | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [members, setMembers] = useState<OrganizationMemberModel[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    OrganizationInvitationModel[]
  >([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserMember, setCurrentUserMember] =
    useState<OrganizationMemberModel | null>(null);

  // Settings state variables
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newAttributeKey, setNewAttributeKey] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [attributesError, setAttributesError] = useState<string | null>(null);
  const [attributesSuccess, setAttributesSuccess] = useState<string | null>(
    null,
  );

  // Member success state
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [removeMemberModalOpen, setRemoveMemberModalOpen] = useState(false);

  // Loading state
  const [isInvitationLoading, setInvitationLoading] = useState(false);
  const [resendingInvitationId, setResendingInvitationId] = useState<
    number | null
  >(null);

  // Refs to prevent duplicate API calls
  const isLoadingOrgRef = useRef(false);
  const isLoadingAttributesRef = useRef(false);
  const isLoadingMembersRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const router = useRouter();
  const { id } = router.query;

  // Protect this route
  const { isAuthenticated } = useAuth();
  // Get the current user info
  const currentUser = getCurrentUser();
  const { setCurrentOrganizationId, refreshOrganizations } = useOrganization();

  // Helper to check if user can create organizations
  const canCreateOrganization = () => {
    return isOrganizationHead(currentUser?.roles);
  };

  // Members invitation state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Member management state
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [currentMember, setCurrentMember] =
    useState<OrganizationMemberModel | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [memberActionError, setMemberActionError] = useState<string | null>(
    null,
  );

  // Team creation state
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);

  // Team detail modal state
  const [teamDetailModalOpen, setTeamDetailModalOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<TeamModel | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [teamDetailError, setTeamDetailError] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  // Teams state
  const [teams, setTeams] = useState<TeamModel[]>([]);
  const [teamMemberCounts, setTeamMemberCounts] = useState<Record<number, number>>({});
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const isLoadingTeamsRef = useRef(false);
  const teamsLoadedRef = useRef(false);

  // Invitation management state
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [currentInvitation, setCurrentInvitation] =
    useState<OrganizationInvitationModel | null>(null);
  const [isResendingInvitation, setIsResendingInvitation] = useState(false);
  const [isDeletingInvitation, setIsDeletingInvitation] = useState(false);
  const [invitationActionError, setInvitationActionError] = useState<
    string | null
  >(null);
  const [invitationConfirmOpen, setInvitationConfirmOpen] = useState(false);

  // Let's create a new state variable to track the current members tab
  const [membersActiveTab, setMembersActiveTab] = useState("active");

  // Current user email state to identify the user's own records
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Add state for member teams
  const [memberTeams, setMemberTeams] = useState<TeamModel[]>([]);
  const [isLoadingMemberTeams, setIsLoadingMemberTeams] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [teamMemberError, setTeamMemberError] = useState<string | null>(null);
  const [teamMemberSuccess, setTeamMemberSuccess] = useState<string | null>(null);
  const [isUpdatingTeamMembership, setIsUpdatingTeamMembership] = useState(false);

  // Add a new state for team membership modal
  const [teamMembershipModalOpen, setTeamMembershipModalOpen] = useState(false);

  // Add a state to track which team checkbox is being updated
  const [updatingTeamId, setUpdatingTeamId] = useState<number | null>(null);

  // Effect to set edit team values when current team changes
  useEffect(() => {
    if (currentTeam) {
      setEditTeamName(currentTeam.name);
      setEditTeamDescription(currentTeam.description || "");
    }
  }, [currentTeam]);

  // Clear team success message after 5 seconds
  useEffect(() => {
    if (teamSuccess) {
      const timer = setTimeout(() => {
        setTeamSuccess(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [teamSuccess]);

  // Clear invitation success message after 5 seconds
  useEffect(() => {
    if (inviteSuccess) {
      const timer = setTimeout(() => {
        setInviteSuccess(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [inviteSuccess]);

  // Load organization data
  useEffect(() => {
    // Skip if no id or if we're already loading
    if (!id || typeof id !== "string" || isLoadingOrgRef.current) return;

    // For subsequent id changes, we should always load
    if (initialLoadDoneRef.current && organization?.id === parseInt(id)) {
      return;
    }
    loadOrganization(id);
  }, [id, setCurrentOrganizationId, organization]);

  const loadOrganization = async (organizationId: string) => {
    try {
      isLoadingOrgRef.current = true;
      setIsLoading(true);
      setError(null);

      const orgData = await getOrganization(organizationId);

      setOrganization(orgData);

      // Set form values for settings
      setName(orgData.name);
      setDescription(orgData.description || "");

      // Set this as the current organization
      setCurrentOrganizationId(orgData.id);

      // Load attributes
      await loadAttributes(orgData.id);
      initialLoadDoneRef.current = true;
    } catch (err) {
      console.error("Failed to load organization:", err);
      setError("Failed to load organization details. Please try again.");
    } finally {
      setIsLoading(false);
      isLoadingOrgRef.current = false;
    }
  };

  const loadAttributes = async (organizationId: string | number) => {
    // Skip if already loading attributes
    if (isLoadingAttributesRef.current) return;

    try {
      isLoadingAttributesRef.current = true;
      setIsLoadingAttributes(true);

      const attributesData = await getOrganizationAttributes(organizationId);

      setAttributes(attributesData || {});
    } catch (err) {
      console.error("Failed to load organization attributes:", err);
      // Don't set error - we'll just show empty attributes
    } finally {
      setIsLoadingAttributes(false);
      isLoadingAttributesRef.current = false;
    }
  };

  const loadMembers = async (organizationId: string | number) => {
    // Skip if already loading members
    if (isLoadingMembersRef.current) return;

    try {
      isLoadingMembersRef.current = true;
      setIsLoadingMembers(true);

      const [membersData, invitationsResponse] = await Promise.all([
        getOrganizationMembers(organizationId),
        getOrganizationInvitations(organizationId),
      ]);

      // Mark current user in the members list
      const enhancedMembers =
        membersData?.map((member) => ({
          ...member,
          // The backend should mark which member is the current user
          is_current_user: member.is_current_user || false,
        })) || [];

      // Find the current user and their role
      const currentMember = enhancedMembers.find(
        (member) => member.is_current_user,
      );

      if (currentMember) {
        setUserRole(currentMember.role);
        setCurrentUserMember(currentMember);
      }

      setMembers(enhancedMembers);

      // Handle different response formats
      let invitationsData: OrganizationInvitationModel[] = [];

      // Assume response is directly the array of invitations
      invitationsData =
        (invitationsResponse as OrganizationInvitationModel[]) || [];

      // Set all invitations, filtering can be done in the UI if needed
      setPendingInvitations(invitationsData);
    } catch (err) {
      console.error("Failed to load organization members:", err);
      // Don't set error - we'll just show empty members
    } finally {
      setIsLoadingMembers(false);
      isLoadingMembersRef.current = false;
    }
  };

  // Load teams when switching to the teams tab
  const loadTeams = async (
    organizationId: string | number,
    forceRefresh = false,
  ) => {
    // Skip if already loading teams or if teams are already loaded and no refresh is requested
    if (isLoadingTeamsRef.current) return;
    if (teamsLoadedRef.current && !forceRefresh) return;

    try {
      isLoadingTeamsRef.current = true;
      setIsLoadingTeams(true);

      const teamsData = await getOrganizationTeams(organizationId);
      
      // Extract member counts from response (assuming API includes this information)
      const memberCounts: Record<number, number> = {};
      teamsData.forEach(team => {
        // Use type assertion to access the member_count property that may come from the API
        const count = (team as any).member_count || 0;
        memberCounts[team.id] = count;
      });

      setTeams(teamsData || []);
      setTeamMemberCounts(memberCounts);
      teamsLoadedRef.current = true;
    } catch (err) {
      console.error("Failed to load organization teams:", err);
      // Don't set error - we'll just show empty teams
    } finally {
      setIsLoadingTeams(false);
      isLoadingTeamsRef.current = false;
    }
  };

  // Load members when switching to the members tab
  useEffect(() => {
    if (
      activeTab === "members" &&
      id &&
      typeof id === "string" &&
      !isLoadingMembersRef.current &&
      members.length === 0
    ) {
      loadMembers(id);
    }

    if (activeTab === "teams" && id && typeof id === "string") {
      loadTeams(id);
    }
  }, [activeTab, id, members.length]);

  // Handle refreshing members
  const refreshMembers = () => {
    if (id && typeof id === "string") {
      loadMembers(id);
    }
  };

  // Helper function to format dates for display and tooltip
  const formatDateWithTooltip = (dateString: string) => {
    return (
      <Tooltip content={formatDateTime(dateString)}>
        <span>{formatDate(dateString)}</span>
      </Tooltip>
    );
  };

  // Member view component for regular members
  const renderMemberView = () => {
    return (
      <div className="space-y-6">
        {currentUser && organization && (
          <div>
            <h3 className="text-lg font-medium">Your Teams</h3>
            <UserTeamsDisplay 
              organizationId={organization.id}
              userId={currentUser.id}
              userName="You"
              orgRole={currentUserMember?.role}
            />
          </div>
        )}
      </div>
    );
  };

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Overview</h2>
        <Button
          isIconOnly
          size="sm"
          title="Refresh"
          variant="light"
          onClick={() => id && loadAttributes(id as string)}
        >
          <RefreshCw size={18} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-default-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Organization Info</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-default-500">Name</p>
              <p className="font-medium">{organization?.name}</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Description</p>
              <p className="font-medium">
                {organization?.description || "No description provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-default-500">Created</p>
              <p className="font-medium">
                {organization
                  ? formatDateWithTooltip(organization.created_at)
                  : "-"}
              </p>
            </div>

            {/* Attributes Section */}
            {Object.keys(attributes).length > 0 && (
              <div className="mt-4 pt-4 border-t border-default-200">
                <p className="text-sm text-default-500 mb-2">
                  Custom Attributes
                </p>
                <div className="space-y-2">
                  {Object.entries(attributes).map(([key, value]) => (
                    <div key={key} className="flex">
                      <p className="text-sm font-medium w-1/2">{key}:</p>
                      <p className="text-sm text-default-700 w-1/2">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render members tab
  const renderMembersTab = () => {
    if (isLoadingMembers) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Members</h2>
            <Button
              isIconOnly
              size="sm"
              title="Refresh"
              variant="light"
              onPress={refreshMembers}
            >
              <RefreshCw size={18} />
            </Button>
          </div>
          {/* Show Invite Member button for owners, admins, and Organization Heads */}
          {canCreateOrganization() && (
            <Button
              color="primary"
              startContent={<PlusIcon size={16} />}
              onPress={() => setInviteModalOpen(true)}
            >
              Invite Member
            </Button>
          )}
        </div>

        {memberSuccess && (
          <div className="bg-success-100 text-success p-3 rounded-lg mb-4">
            {memberSuccess}
          </div>
        )}

        {memberError && (
          <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
            {memberError}
          </div>
        )}

        {members.length === 0 && pendingInvitations.length === 0 ? (
          <div className="text-center p-8 bg-default-100 rounded-lg">
            <Users className="mx-auto mb-4 text-default-400" size={48} />
            <h3 className="text-lg font-semibold mb-2">No Members</h3>
            <p className="text-default-500 mb-4">
              {canCreateOrganization()
                ? "You haven't invited any members to this organization yet. Invite team members to collaborate on projects."
                : "There are no other members in this organization yet."}
            </p>
            {canCreateOrganization() && (
              <Button color="primary" onPress={() => setInviteModalOpen(true)}>
                Invite First Member
              </Button>
            )}
          </div>
        ) : (
          <>
            <Tabs
              aria-label="Members tabs"
              className="mb-6"
              selectedKey={membersActiveTab}
              onSelectionChange={(key) => setMembersActiveTab(key.toString())}
            >
              <Tab key="active" title="Active Members">
                <Card>
                  <CardBody>
                    {members.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-default-500">
                          No active members found.
                        </p>
                      </div>
                    ) : (
                      <Table removeWrapper aria-label="Members table">
                        <TableHeader>
                          <TableColumn>NAME</TableColumn>
                          <TableColumn>EMAIL</TableColumn>
                          <TableColumn>ROLE</TableColumn>
                          <TableColumn>JOINED</TableColumn>
                          <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User
                                    avatarProps={{
                                      src:
                                        member.user?.profile?.avatar_url ||
                                        undefined,
                                      showFallback: true,
                                      name: member.user?.name || "User",
                                    }}
                                    description={member.user?.email || ""}
                                    name={member.user?.name || "User"}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>{member.user?.email}</TableCell>
                              <TableCell>
                                <Chip color="primary" size="sm" variant="flat">
                                  {member.role}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                {formatDateWithTooltip(member.created_at)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  {/* Only show member management buttons for owners, admins and Organization Heads */}
                                  {member.role !== "owner" &&
                                    !member.is_current_user &&
                                    canCreateOrganization() && (
                                      <>
                                        <Tooltip content="Manage member role">
                                          <Button
                                            isIconOnly
                                            color="default"
                                            size="sm"
                                            title="Change role"
                                            variant="flat"
                                            onPress={() => openMemberRoleModal(member)}
                                          >
                                            <Settings size={16} />
                                          </Button>
                                        </Tooltip>
                                        <Tooltip content="Manage team membership">
                                          <Button
                                            isIconOnly
                                            color="primary"
                                            size="sm"
                                            title="Manage team membership"
                                            variant="flat"
                                            onPress={() => openTeamMembershipModal(member)}
                                          >
                                            <Users size={16} />
                                          </Button>
                                        </Tooltip>
                                      </>
                                    )}
                                  {/* Show tooltip explaining why action is disabled */}
                                  {member.role === "owner" && (
                                    <Tooltip content="Owner role cannot be modified">
                                      <div className="h-8 w-8 flex items-center justify-center text-default-300">
                                        <Settings size={16} />
                                      </div>
                                    </Tooltip>
                                  )}
                                  {member.is_current_user && (
                                    <Tooltip content="You cannot modify your own role">
                                      <div className="h-8 w-8 flex items-center justify-center text-default-300">
                                        <Settings size={16} />
                                      </div>
                                    </Tooltip>
                                  )}
                                  {!canCreateOrganization() && <div />}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="pending" title="Pending Invitations">
                <Card>
                  <CardBody>
                    {pendingInvitations.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-default-500">
                          No pending invitations.
                        </p>
                      </div>
                    ) : (
                      <Table
                        removeWrapper
                        aria-label="Pending invitations table"
                      >
                        <TableHeader>
                          <TableColumn>EMAIL</TableColumn>
                          <TableColumn>INVITED</TableColumn>
                          <TableColumn>STATUS</TableColumn>
                          <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {pendingInvitations.map((invitation) => (
                            <TableRow key={invitation.id}>
                              <TableCell>{invitation.email}</TableCell>
                              <TableCell>
                                {formatDateWithTooltip(invitation.created_at)}
                              </TableCell>
                              <TableCell>
                                <Chip color="warning" size="sm" variant="flat">
                                  Pending
                                </Chip>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2 justify-end">
                                  {/* Only show invitation management buttons for owners, admins, and Organization Heads */}
                                  {canCreateOrganization() && (
                                    <>
                                      <Button
                                        isIconOnly
                                        color="default"
                                        isLoading={
                                          resendingInvitationId ===
                                          invitation.id
                                        }
                                        size="sm"
                                        title="Resend invitation"
                                        variant="flat"
                                        onPress={() => {
                                          if (id && typeof id === "string") {
                                            setResendingInvitationId(
                                              invitation.id,
                                            );
                                            resendOrganizationInvitation(
                                              id,
                                              invitation.id,
                                            )
                                              .then((updatedInvitation) => {
                                                // Update the specific invitation in the pendingInvitations array
                                                setPendingInvitations(
                                                  (current) =>
                                                    current.map((inv) =>
                                                      inv.id === invitation.id
                                                        ? updatedInvitation
                                                        : inv,
                                                    ),
                                                );
                                                setMemberSuccess(
                                                  "Invitation resent successfully",
                                                );
                                                setTimeout(
                                                  () => setMemberSuccess(""),
                                                  3000,
                                                );
                                              })
                                              .catch((err) => {
                                                console.error(
                                                  "Failed to resend invitation:",
                                                  err,
                                                );
                                                setMemberError(
                                                  "Failed to resend invitation",
                                                );
                                                setTimeout(
                                                  () => setMemberError(""),
                                                  3000,
                                                );
                                              })
                                              .finally(() =>
                                                setResendingInvitationId(null),
                                              );
                                          }
                                        }}
                                      >
                                        <Mail size={16} />
                                      </Button>
                                      <Button
                                        isIconOnly
                                        color="primary"
                                        size="sm"
                                        title="Copy invitation link"
                                        variant="flat"
                                        onPress={() => {
                                          if (id && typeof id === "string") {
                                            // Copy invitation link to clipboard with organization_id
                                            const inviteLink = `${window.location.origin}/invitations/${invitation.token}?organization_id=${id}`;

                                            navigator.clipboard.writeText(
                                              inviteLink,
                                            );
                                            setMemberSuccess(
                                              "Invitation link copied to clipboard",
                                            );
                                            setTimeout(
                                              () => setMemberSuccess(""),
                                              3000,
                                            );
                                          }
                                        }}
                                      >
                                        <svg
                                          fill="none"
                                          height="16"
                                          stroke="currentColor"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          viewBox="0 0 24 24"
                                          width="16"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <rect
                                            height="13"
                                            rx="2"
                                            ry="2"
                                            width="13"
                                            x="9"
                                            y="9"
                                          />
                                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                      </Button>
                                      <Button
                                        isIconOnly
                                        color="danger"
                                        size="sm"
                                        title="Cancel invitation"
                                        variant="flat"
                                        onPress={() => {
                                          setCurrentInvitation(invitation);
                                          setInvitationConfirmOpen(true);
                                        }}
                                      >
                                        <X size={16} />
                                      </Button>
                                    </>
                                  )}
                                  {/* For regular members, show a message indicating no actions available */}
                                  {!canCreateOrganization() && (
                                    <span className="text-xs text-default-400">
                                      No actions available
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </>
        )}
      </div>
    );
  };

  // Add a helper function to check if the user is an admin or has Organization Head role
  const isAdminOrOrgHead = () => {
    // Check the user's roles array for "Organization Head"
    const hasOrgHeadRole = currentUser?.roles?.includes("Organization Head");

    // User is an admin if they have admin role in the organization or the Organization Head role
    return userRole === "owner" || userRole === "admin" || hasOrgHeadRole;
  };

  // Render teams tab
  const renderTeamsTab = () => {
    if (isLoadingTeams) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Teams</h2>
            <Button
              isIconOnly
              size="sm"
              title="Refresh"
              variant="light"
              onPress={() => id && loadTeams(id as string, true)}
            >
              <RefreshCw size={18} />
            </Button>
          </div>
          {/* Show Create Team button for owners, admins, and Organization Heads */}
          {canCreateOrganization() && (
            <Button
              color="primary"
              startContent={<PlusIcon size={16} />}
              onPress={() => setTeamModalOpen(true)}
            >
              Create Team
            </Button>
          )}
        </div>

        {teamSuccess && (
          <div className="bg-success-100 text-success p-3 rounded-lg mb-4">
            {teamSuccess}
          </div>
        )}

        {teams.length === 0 ? (
          <div className="text-center p-8 bg-default-100 rounded-lg">
            <Users className="mx-auto mb-4 text-default-400" size={48} />
            <h3 className="text-lg font-semibold mb-2">No Teams</h3>
            <p className="text-default-500 mb-4">
              {canCreateOrganization()
                ? "You haven't created any teams for this organization yet. Teams help you organize members into groups with specific permissions and responsibilities."
                : "There are no teams in this organization yet. Teams help organize members into groups with specific permissions and responsibilities."}
            </p>
            {/* Show Create Team button for owners, admins, and Organization Heads */}
            {canCreateOrganization() && (
              <Button color="primary" onPress={() => setTeamModalOpen(true)}>
                Create First Team
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card
                key={team.id}
                isPressable
                className="bg-default-50 p-4 rounded-lg border border-default-200 hover:border-primary transition-all cursor-pointer"
                onPress={() => {
                  router.push(`/teams/${team.id}`);
                }}
              >
                <CardBody className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">{team.name}</h3>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTeam(team);
                        setTeamDetailModalOpen(true);
                      }}
                    >
                      <Settings size={16} />
                    </Button>
                  </div>
                  {team.description && (
                    <p className="text-default-500 text-sm mb-3">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                      <Users className="text-default-400 mr-1" size={16} />
                      <span className="text-xs text-default-500">
                        {teamMemberCounts[team.id] || 0} Members
                      </span>
                    </div>
                    <span className="text-xs text-default-400">
                      Created {formatDateWithTooltip(team.created_at)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render settings tab
  const renderSettingsTab = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Button
          isIconOnly
          size="sm"
          title="Refresh"
          variant="light"
          onPress={() => id && loadOrganization(id as string)}
        >
          <RefreshCw size={18} />
        </Button>
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

      <div className="bg-default-50 p-6 rounded-lg mb-6 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">General Information</h2>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div>
              <Input
                fullWidth
                isRequired
                label="Organization Name"
                placeholder="Enter organization name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Textarea
                fullWidth
                label="Description"
                placeholder="Enter organization description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <Button color="primary" isLoading={isSaving} type="submit">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!id || typeof id !== "string") return;

    if (!teamName.trim()) {
      setTeamError("Team name is required");

      return;
    }

    try {
      setIsCreatingTeam(true);
      setTeamError(null);
      setTeamSuccess(null);

      await createTeam(id, {
        name: teamName,
        description: teamDescription,
      });

      // Reset form
      setTeamName("");
      setTeamDescription("");

      // Close modal
      setTeamModalOpen(false);

      // Refresh teams list
      loadTeams(id, true);

      // Show success message
      setTeamSuccess("Team created successfully");
    } catch (err) {
      console.error("Failed to create team:", err);
      setTeamError("Failed to create team. Please try again.");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Handle team update
  const handleUpdateTeam = async () => {
    if (!id || typeof id !== "string" || !currentTeam) return;

    if (!editTeamName.trim()) {
      setTeamDetailError("Team name is required");

      return;
    }

    try {
      setIsUpdatingTeam(true);
      setTeamDetailError(null);

      await updateTeam(id, currentTeam.id, {
        name: editTeamName,
        description: editTeamDescription,
      });

      // Close modal
      setTeamDetailModalOpen(false);

      // Refresh teams list
      loadTeams(id, true);

      // Show success message
      setTeamSuccess("Team updated successfully");
    } catch (err) {
      console.error("Failed to update team:", err);
      setTeamDetailError("Failed to update team. Please try again.");
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async () => {
    if (!id || typeof id !== "string" || !currentTeam) return;

    try {
      setIsDeletingTeam(true);
      setTeamDetailError(null);

      await deleteTeam(id, currentTeam.id);

      // Close modals
      setDeleteConfirmationOpen(false);
      setTeamDetailModalOpen(false);

      // Refresh teams list
      loadTeams(id, true);

      // Show success message
      setTeamSuccess("Team deleted successfully");
    } catch (err) {
      console.error("Failed to delete team:", err);
      setTeamDetailError("Failed to delete team. Please try again.");
    } finally {
      setIsDeletingTeam(false);
    }
  };

  // Handle invitation cancellation
  const handleCancelInvitation = async () => {
    if (!id || typeof id !== "string" || !currentInvitation) return;

    try {
      setIsDeletingInvitation(true);
      setInvitationActionError(null);

      await cancelOrganizationInvitation(id, currentInvitation.id);

      // Close modals
      setInvitationConfirmOpen(false);
      setInvitationModalOpen(false);

      // Refresh members list
      loadMembers(id);

      // Show success message
      setInviteSuccess("Invitation cancelled successfully");
    } catch (err) {
      console.error("Failed to cancel invitation:", err);
      setInvitationActionError(
        "Failed to cancel invitation. Please try again.",
      );
    } finally {
      setIsDeletingInvitation(false);
    }
  };

  // Handle member role update
  const handleUpdateMemberRole = async () => {
    if (!id || typeof id !== "string" || !currentMember || !selectedRole)
      return;

    try {
      setIsSaving(true);
      setMemberActionError(null);

      await updateOrganizationMember(id, currentMember.user_id, selectedRole);

      // Close modal
      setMemberModalOpen(false);

      // Refresh members list
      loadMembers(id);

      // Show success message
      setInviteSuccess("Member role updated successfully");
    } catch (err) {
      console.error("Failed to update member role:", err);
      setMemberActionError("Failed to update member role. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle member removal - check if the member is not an owner
  const handleRemoveMember = async () => {
    if (!id || typeof id !== "string" || !currentMember) return;

    // Don't allow removing owners
    if (currentMember.role === "owner") {
      setMemberActionError("Organization owners cannot be removed");

      return;
    }

    // Don't allow removing current user
    if (currentMember.is_current_user) {
      setMemberActionError("You cannot remove yourself from the organization");

      return;
    }

    try {
      setIsDeleting(true);
      setMemberActionError(null);

      await removeOrganizationMember(id, currentMember.user_id);

      // Close modal
      setMemberModalOpen(false);

      // Refresh members list
      loadMembers(id);

      // Show success message
      setInviteSuccess("Member removed successfully");
    } catch (err) {
      console.error("Failed to remove member:", err);
      setMemberActionError("Failed to remove member. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle invite submission
  const handleInviteSubmit = async () => {
    if (!id || typeof id !== "string") return;

    if (!inviteEmail.trim()) {
      setInviteError("Email address is required");

      return;
    }

    try {
      setIsInviting(true);
      setInviteError(null);

      await createOrganizationInvitation(id, inviteEmail, inviteRole);

      // Reset form and close modal
      setInviteEmail("");
      setInviteModalOpen(false);

      // Refresh members list
      loadMembers(id);

      // Show success message
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);

      // Switch to pending invitations tab
      setMembersActiveTab("pending");
    } catch (err) {
      console.error("Failed to send invitation:", err);
      setInviteError("Failed to send invitation. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  // Add a function to load a member's teams
  const loadMemberTeams = async (organizationId: string | number, userId: number | string) => {
    try {
      setIsLoadingMemberTeams(true);
      
      const memberTeamsData = await getUserTeams(organizationId, userId);
      setMemberTeams(memberTeamsData || []);
      
      // Set selected teams based on the teams the member belongs to
      setSelectedTeams(memberTeamsData.map(team => team.id));
    } catch (err) {
      console.error("Failed to load member teams:", err);
    } finally {
      setIsLoadingMemberTeams(false);
    }
  };

  // Update the toggleTeamMembership function to handle specific checkbox state
  const toggleTeamMembership = async (teamId: number, isSelected: boolean) => {
    if (!currentMember) return;
    
    // Find the team name for better error/success messages
    const team = teams.find(t => t.id === teamId);
    const teamName = team?.name || `Team #${teamId}`;
    
    try {
      setTeamMemberError(null);
      // Set which team is currently being updated
      setUpdatingTeamId(teamId);
      
      if (isSelected) {
        // Add member to team with a specific role based on their organization role
        let teamRole = "member";
        
        // Assign role based on organization role (optional - you can customize this logic)
        if (currentMember.role === "admin" || currentMember.role === "owner") {
          teamRole = "admin"; // Organization admins and owners get team admin role
        } else if (currentMember.role === "member") {
          teamRole = "member"; // Organization members get team member role
        } else {
          teamRole = "guest"; // Organization guests get team guest role
        }
        
        await addTeamMember(teamId, currentMember.user_id, teamRole);
        setTeamMemberSuccess(`User added to ${teamName} as ${teamRole} successfully`);
        
        // Update the member count for this team
        setTeamMemberCounts(prev => ({
          ...prev,
          [teamId]: (prev[teamId] || 0) + 1
        }));
      } else {
        // Remove member from team
        await removeTeamMember(teamId, currentMember.user_id);
        setTeamMemberSuccess(`User removed from ${teamName} successfully`);
        
        // Update the member count for this team
        setTeamMemberCounts(prev => ({
          ...prev,
          [teamId]: Math.max((prev[teamId] || 0) - 1, 0)
        }));
      }
      
      // Update selected teams state
      setSelectedTeams(prev => 
        isSelected 
          ? [...prev, teamId] 
          : prev.filter(id => id !== teamId)
      );
      
      // We don't reload the teams list anymore to improve performance
      // Instead, we rely on our local state updates
      
    } catch (err) {
      console.error("Failed to update team membership:", err);
      setTeamMemberError(`Failed to update membership for ${teamName}. Please try again.`);
    } finally {
      // Clear the updating team id
      setUpdatingTeamId(null);
      
      // Clear success message after a delay
      if (teamMemberSuccess) {
        setTimeout(() => {
          setTeamMemberSuccess(null);
        }, 3000);
      }
    }
  };

  // Effect to load member teams when the current member changes or team modal opens
  useEffect(() => {
    if (currentMember && id && typeof id === "string" && teamMembershipModalOpen) {
      loadMemberTeams(id, currentMember.user_id);
    }
  }, [currentMember, id, teamMembershipModalOpen]);

  // Effect to load teams if not already loaded when a modal with teams is active
  useEffect(() => {
    if ((memberModalOpen || teamMembershipModalOpen) && 
        id && typeof id === "string" && 
        (!teams || teams.length === 0)) {
      loadTeams(id);
    }
  }, [memberModalOpen, teamMembershipModalOpen, id, teams]);

  // Update to have separate functions for opening role and team modals
  const openMemberRoleModal = (member: OrganizationMemberModel) => {
    setCurrentMember(member);
    setSelectedRole(member.role as Role);
    setMemberModalOpen(true);
    
    // Clear any previous errors or success messages
    setMemberActionError(null);
  };
  
  const openTeamMembershipModal = (member: OrganizationMemberModel) => {
    setCurrentMember(member);
    setTeamMembershipModalOpen(true);
    
    // Reset all states related to team membership
    setTeamMemberError(null);
    setTeamMemberSuccess(null);
    setUpdatingTeamId(null);
    setSelectedTeams([]);
    
    // We'll let the useEffect load the member's teams
  };

  // If the page is loading, show a spinner
  if (isLoading || !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[calc(100vh-150px)] justify-center">
          <Spinner color="primary" size="lg" />
        </div>
      </div>
    );
  }

  // If there's an error or no organization data, show error message
  if (error || !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-default-900">
            Organization Not Found
          </h1>
          <p className="mt-4 text-default-600">
            The organization you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <div className="mt-6">
            <Button
              color="primary"
              onClick={() => router.push("/organizations")}
            >
              Go Back to Organizations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if the user's role is not owner to show simplified view
  if (
    userRole !== "owner" &&
    userRole !== "admin" &&
    !canCreateOrganization()
  ) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              {organization?.name}
            </h1>
            <p className="text-default-600">{organization?.description}</p>
          </div>
          <Button
            color="primary"
            variant="light"
            onClick={() => router.push("/organizations")}
          >
            Back to Organizations
          </Button>
        </div>
        {renderMemberView()}
      </div>
    );
  }

  // If we have an organization, show its details with tabs
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BuildingIcon className="text-default-500" size={32} />
          <div>
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            {organization.description && (
              <p className="text-default-500">{organization.description}</p>
            )}
          </div>
        </div>
      </div>

      <Tabs
        aria-label="Organization navigation"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab key="overview" title="Overview">
          {activeTab === "overview" && renderOverviewTab()}
        </Tab>
        <Tab key="teams" title="Teams">
          {activeTab === "teams" && renderTeamsTab()}
        </Tab>
        <Tab key="members" title="Members">
          {activeTab === "members" && renderMembersTab()}
        </Tab>
        <Tab key="settings" title="Settings">
          {activeTab === "settings" && renderSettingsTab()}
        </Tab>
      </Tabs>

      {/* Team Creation Modal */}
      <Modal isOpen={teamModalOpen} onOpenChange={setTeamModalOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Create New Team
          </ModalHeader>
          <ModalBody>
            {teamError && (
              <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
                {teamError}
              </div>
            )}

            <div className="space-y-4">
              <Input
                fullWidth
                isRequired
                label="Team Name"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />

              <Textarea
                fullWidth
                label="Description"
                placeholder="Enter team description (optional)"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setTeamModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={isCreatingTeam}
              onPress={handleCreateTeam}
            >
              Create Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Team Detail Modal */}
      <Modal isOpen={teamDetailModalOpen} onOpenChange={setTeamDetailModalOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {currentTeam ? "Team Details" : "Loading..."}
          </ModalHeader>
          <ModalBody>
            {teamDetailError && (
              <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
                {teamDetailError}
              </div>
            )}

            {currentTeam && (
              <div className="space-y-4">
                <Input
                  fullWidth
                  isRequired
                  isDisabled={!isAdminOrOrgHead()}
                  label="Team Name"
                  placeholder="Enter team name"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                />

                <Textarea
                  fullWidth
                  isDisabled={!isAdminOrOrgHead()}
                  label="Description"
                  placeholder="Enter team description"
                  value={editTeamDescription}
                  onChange={(e) => setEditTeamDescription(e.target.value)}
                />

                <div className="pt-2">
                  <p className="text-sm text-default-500">
                    <span className="font-medium">Created:</span>{" "}
                    {formatDateWithTooltip(currentTeam.created_at)}
                  </p>
                  {currentTeam.updated_at && (
                    <p className="text-sm text-default-500">
                      <span className="font-medium">Last Updated:</span>{" "}
                      {formatDateWithTooltip(currentTeam.updated_at)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between w-full">
              {isAdminOrOrgHead() && (
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => setDeleteConfirmationOpen(true)}
                >
                  Delete Team
                </Button>
              )}
              {!isAdminOrOrgHead() && <div />}
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  onPress={() => setTeamDetailModalOpen(false)}
                >
                  {isAdminOrOrgHead() ? "Cancel" : "Close"}
                </Button>
                {isAdminOrOrgHead() && (
                  <Button
                    color="primary"
                    isLoading={isUpdatingTeam}
                    onPress={handleUpdateTeam}
                  >
                    Update Team
                  </Button>
                )}
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Team Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirm Deletion
          </ModalHeader>
          <ModalBody>
            <div className="text-center">
              <Trash className="mx-auto mb-4 text-danger" size={40} />
              <p className="text-lg font-semibold mb-2">Delete Team</p>
              <p className="text-default-500 mb-4">
                Are you sure you want to delete the team "{currentTeam?.name}"?
                This action cannot be undone.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              isLoading={isDeletingTeam}
              onPress={handleDeleteTeam}
            >
              Delete Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Invitation Management Modal */}
      <Modal isOpen={invitationModalOpen} onOpenChange={setInvitationModalOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {currentInvitation ? "Manage Invitation" : "Loading..."}
          </ModalHeader>
          <ModalBody>
            {invitationActionError && (
              <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
                {invitationActionError}
              </div>
            )}

            {currentInvitation && (
              <div className="space-y-4">
                <div className="bg-default-50 p-4 rounded-lg">
                  <p className="text-sm mb-2">
                    <span className="font-medium">Email:</span>{" "}
                    {currentInvitation.email}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Role:</span>{" "}
                    {currentInvitation.role}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Status:</span>
                    <span className="px-2 ml-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {currentInvitation.status}
                    </span>
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Sent:</span>{" "}
                    {formatDateWithTooltip(currentInvitation.created_at)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Expires:</span>{" "}
                    {formatDateWithTooltip(currentInvitation.expires_at)}
                  </p>
                </div>

                <div className="bg-warning-50 p-3 rounded-lg text-sm text-warning-800">
                  <p>
                    This invitation has not been accepted yet. You can resend it
                    or cancel it.
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between w-full">
              <Button
                color="danger"
                variant="flat"
                onPress={() => setInvitationConfirmOpen(true)}
              >
                Cancel Invitation
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  onPress={() => setInvitationModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Invitation Cancellation Confirmation Modal */}
      <Modal
        isOpen={invitationConfirmOpen}
        onOpenChange={setInvitationConfirmOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirm Cancellation
          </ModalHeader>
          <ModalBody>
            <div className="text-center">
              <X className="mx-auto mb-4 text-danger" size={40} />
              <p className="text-lg font-semibold mb-2">Cancel Invitation</p>
              <p className="text-default-500 mb-4">
                Are you sure you want to cancel the invitation sent to "
                {currentInvitation?.email}"? This action cannot be undone.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setInvitationConfirmOpen(false)}
            >
              Back
            </Button>
            <Button
              color="danger"
              isLoading={isDeletingInvitation}
              onPress={handleCancelInvitation}
            >
              Cancel Invitation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Member Invitation Modal */}
      <Modal isOpen={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Invite New Member
          </ModalHeader>
          <ModalBody>
            {inviteError && (
              <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="bg-success-100 text-success p-3 rounded-lg mb-4">
                {inviteSuccess}
              </div>
            )}

            <div className="space-y-4">
              <Input
                fullWidth
                isRequired
                label="Email Address"
                placeholder="Enter email address"
                startContent={<Mail className="text-default-400" size={16} />}
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />

              <div>
                <p className="text-sm mb-2">Member Role</p>
                <Dropdown>
                  <DropdownTrigger>
                    <Button className="capitalize" variant="flat">
                      {inviteRole}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Role selection"
                    onAction={(key) => setInviteRole(key as string)}
                  >
                    <DropdownItem key="admin">Admin</DropdownItem>
                    <DropdownItem key="member">Member</DropdownItem>
                    <DropdownItem key="guest">Guest</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              <div className="bg-default-50 p-3 rounded-lg text-sm text-default-600">
                <p className="font-medium mb-1">Role Permissions:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {inviteRole === "admin" && (
                    <>
                      <li>Full access to organization settings</li>
                      <li>Can manage teams and members</li>
                      <li>Can invite new members</li>
                      <li>Can create and manage all resources</li>
                    </>
                  )}
                  {inviteRole === "member" && (
                    <>
                      <li>Can view organization details</li>
                      <li>Can create and join teams</li>
                      <li>Can create and manage assigned resources</li>
                      <li>Cannot manage organization settings</li>
                    </>
                  )}
                  {inviteRole === "guest" && (
                    <>
                      <li>Can view organization details</li>
                      <li>Can view assigned teams</li>
                      <li>Can view assigned resources</li>
                      <li>Cannot create or modify content</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={isInviting}
              onPress={handleInviteSubmit}
            >
              Send Invitation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Member Role Management Modal */}
      <Modal isOpen={memberModalOpen} onOpenChange={setMemberModalOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {currentMember ? "Manage Member Role" : "Loading..."}
          </ModalHeader>
          <ModalBody>
            {memberActionError && (
              <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
                {memberActionError}
              </div>
            )}

            {currentMember && (
              <div className="space-y-4">
                <div className="bg-default-50 p-4 rounded-lg">
                  <p className="text-sm mb-2">
                    <span className="font-medium">Name:</span>{" "}
                    {currentMember.user?.name || "Unknown User"}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Email:</span>{" "}
                    {currentMember.user?.email || "Unknown User"}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-medium">Current Role:</span>
                    <span className="px-2 ml-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                      {currentMember.role}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Member Since:</span>{" "}
                    {formatDateWithTooltip(currentMember.created_at)}
                  </p>
                  
                  {/* Add the user's teams display component here */}
                  {organization && (
                    <UserTeamsDisplay 
                      organizationId={organization.id}
                      userId={currentMember.user_id}
                      userName={currentMember.user?.name || "This user"}
                      orgRole={currentMember.role}
                    />
                  )}
                </div>

                {currentMember.role !== "owner" && (
                  <>
                    <div>
                      <p className="text-sm mb-2">Change Role</p>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button className="capitalize" variant="flat">
                            {selectedRole || "Select Role"}
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Role selection"
                          onAction={(key) => setSelectedRole(key as Role)}
                        >
                          <DropdownItem key={Role.ADMIN}>Admin</DropdownItem>
                          <DropdownItem key={Role.MEMBER}>Member</DropdownItem>
                          <DropdownItem key={Role.GUEST}>Guest</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>

                    <div className="bg-default-50 p-3 rounded-lg text-sm text-default-600">
                      <p className="font-medium mb-1">Role Permissions:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedRole === Role.ADMIN && (
                          <>
                            <li>Full access to organization settings</li>
                            <li>Can manage teams and members</li>
                            <li>Can invite new members</li>
                            <li>Can create and manage all resources</li>
                          </>
                        )}
                        {selectedRole === Role.MEMBER && (
                          <>
                            <li>Can view organization details</li>
                            <li>Can create and join teams</li>
                            <li>Can create and manage assigned resources</li>
                            <li>Cannot manage organization settings</li>
                          </>
                        )}
                        {selectedRole === Role.GUEST && (
                          <>
                            <li>Can view organization details</li>
                            <li>Can view assigned teams</li>
                            <li>Can view assigned resources</li>
                            <li>Cannot create or modify content</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </>
                )}

                {currentMember.role === "owner" && (
                  <div className="bg-warning-50 p-3 rounded-lg text-sm text-warning-800">
                    <p>
                      This member is an organization owner. Owner roles cannot
                      be modified.
                    </p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between w-full">
              <Button
                color="danger"
                isDisabled={currentMember?.role === "owner"}
                isLoading={isDeleting}
                variant="flat"
                onPress={handleRemoveMember}
              >
                Remove Member
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  onPress={() => setMemberModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isDisabled={
                    !selectedRole ||
                    selectedRole === currentMember?.role ||
                    currentMember?.role === "owner"
                  }
                  isLoading={isSaving}
                  onPress={handleUpdateMemberRole}
                >
                  Update Role
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Team Membership Management Modal */}
      <Modal isOpen={teamMembershipModalOpen} onOpenChange={setTeamMembershipModalOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {currentMember ? "Manage Team Membership" : "Loading..."}
          </ModalHeader>
          <ModalBody>
            {teamMemberError && (
              <div className="bg-danger-100 text-danger p-3 rounded-lg mb-4">
                {teamMemberError}
              </div>
            )}

            {teamMemberSuccess && (
              <div className="bg-success-100 text-success p-3 rounded-lg mb-4">
                {teamMemberSuccess}
              </div>
            )}

            {currentMember && (
              <div className="space-y-4">
                <div className="bg-default-50 p-4 rounded-lg">
                  <p className="text-sm mb-2">
                    <span className="font-medium">Member:</span>{" "}
                    {currentMember.user?.name || "Unknown User"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span>{" "}
                    {currentMember.user?.email || "Unknown User"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Team Membership</p>
                  
                  {isLoadingTeams || isLoadingMemberTeams ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : teams.length === 0 ? (
                    <p className="text-sm text-default-500">No teams available in this organization</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {teams.map((team) => (
                        <div key={team.id} className="flex items-center justify-between p-2 bg-default-50 rounded-md">
                          <div>
                            <p className="text-sm font-medium">{team.name}</p>
                            {team.description && (
                              <p className="text-xs text-default-500">{team.description}</p>
                            )}
                          </div>
                          <div className="flex items-center">
                            {updatingTeamId === team.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-primary rounded border-default-300"
                                checked={selectedTeams.includes(team.id)}
                                onChange={(e) => toggleTeamMembership(team.id, e.target.checked)}
                                disabled={updatingTeamId !== null} // Only disable all checkboxes if any update is in progress
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-default-50 p-3 rounded-lg text-sm text-default-600">
                  <p>Check the boxes to add the member to teams, or uncheck to remove them.</p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setTeamMembershipModalOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

OrganizationDetailPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};
