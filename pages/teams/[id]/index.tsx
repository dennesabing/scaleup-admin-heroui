import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "@/pages/_app";
import AdminLayout from "@/layouts/admin";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { 
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem 
} from "@heroui/dropdown";
import { Input, Textarea } from "@heroui/input";
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter 
} from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from "@heroui/table";
import { Tabs, Tab } from "@heroui/tabs";
import { Tooltip } from "@heroui/tooltip";
import { Spinner } from "@heroui/spinner";
import { 
  Edit,
  MoreVertical, 
  RefreshCw, 
  Settings, 
  Trash, 
  Users,
  UserPlus,
  X
} from "@/components/icons";
import { TeamModel, TeamMemberModel } from "@/lib/team";
import { UserModel } from "@/lib/auth";
import { OrganizationModel } from "@/lib/organization";
import { 
  getTeam, 
  getTeamMembers, 
  updateTeam, 
  addTeamMember,
  updateTeamMember,
  removeTeamMember
} from "@/lib/services/teamService";
import { 
  Role, 
  canManageTeams, 
  canManageOrganizationMembers,
  isOrganizationHead, 
  SYSTEM_ROLES 
} from "@/utils/permissions";
import { getCurrentUser } from "@/lib/auth";
import { useAuth } from "@/lib/authMiddleware";
import { useOrganization } from "@/contexts/OrganizationContext";
import { getOrganizationMembers } from "@/lib/services/organizationService";
import { formatDate } from "@/lib/utils/dateFormatter";

// Simple User component implementation
const UserComponent = ({
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

// Implementation of useDisclosure hook
const useDisclosure = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false)
  };
};

const TeamDetailPage: NextPageWithLayout = () => {
  const { isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();
  const router = useRouter();
  const { id } = router.query;

  // Get the current user info
  const currentUser = getCurrentUser();
  // User role
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // State for the team and members
  const [team, setTeam] = useState<TeamModel | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberModel[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  
  // State for edit team settings
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  
  // State for error and success messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for new member
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberRole, setSelectedMemberRole] = useState("member");
  
  // State for edit member
  const [currentMember, setCurrentMember] = useState<TeamMemberModel | null>(null);
  const [editMemberRole, setEditMemberRole] = useState("");
  
  // Active tab
  const [activeTab, setActiveTab] = useState("settings");
  
  // Modal states
  const { 
    isOpen: isAddMemberOpen, 
    onOpen: onAddMemberOpen, 
    onClose: onAddMemberClose 
  } = useDisclosure();
  
  const { 
    isOpen: isEditMemberOpen, 
    onOpen: onEditMemberOpen, 
    onClose: onEditMemberClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteMemberOpen, 
    onOpen: onDeleteMemberOpen, 
    onClose: onDeleteMemberClose 
  } = useDisclosure();

  const { 
    isOpen: isDeleteTeamOpen, 
    onOpen: onDeleteTeamOpen, 
    onClose: onDeleteTeamClose 
  } = useDisclosure();

  // Load team and members
  useEffect(() => {
    if (id && currentOrganization?.id) {
      loadTeam();
      loadOrganizationMembers();
    }
  }, [id, currentOrganization]);

  // Check permissions
  const canModifyTeam = () => {
    if (!currentUser) return false;
    
    // Only Organization owner, admin, or Organization Head can modify team settings
    if (canManageTeams(userRole, currentUser?.roles)) {
      return true;
    }
    
    // Check if current user is a team leader or admin
    const currentUserTeamMembership = teamMembers.find(
      (member) => member.user_id === currentUser.id
    );
    
    return currentUserTeamMembership && 
      (currentUserTeamMembership.role === 'admin' || 
       currentUserTeamMembership.role === 'leader');
  };

  const loadTeam = async () => {
    if (!id || !currentOrganization?.id) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const teamData = await getTeam(currentOrganization.id, id as string);
      setTeam(teamData);
      setTeamName(teamData.name);
      setTeamDescription(teamData.description || "");
      
      // Load team members
      loadTeamMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load team");
      console.error("Error loading team:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!id) return;
    
    setIsLoadingMembers(true);
    
    try {
      const members = await getTeamMembers(id as string);
      setTeamMembers(members);
    } catch (err: any) {
      console.error("Error loading team members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadOrganizationMembers = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const orgMembers = await getOrganizationMembers(currentOrganization.id);
      setOrganizationMembers(orgMembers);
    } catch (err) {
      console.error("Error loading organization members:", err);
    }
  };

  const handleUpdateTeam = async () => {
    if (!id || !currentOrganization?.id || !canModifyTeam()) return;
    
    setError("");
    setSuccess("");
    
    try {
      const updatedTeam = await updateTeam(
        currentOrganization.id, 
        id as string, 
        {
          name: teamName,
          description: teamDescription
        }
      );
      
      setTeam(updatedTeam);
      setSuccess("Team updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update team");
      console.error("Error updating team:", err);
    }
  };

  const handleAddMember = async () => {
    if (!id || !selectedMemberId || !canModifyTeam()) return;
    
    try {
      await addTeamMember(id as string, selectedMemberId, selectedMemberRole);
      loadTeamMembers();
      onAddMemberClose();
      setSelectedMemberId(null);
      setSelectedMemberRole("member");
      setSuccess("Member added successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add member");
      console.error("Error adding team member:", err);
    }
  };

  const handleUpdateMember = async () => {
    if (!id || !currentMember || !canModifyTeam()) return;
    
    try {
      await updateTeamMember(id as string, currentMember.user_id, editMemberRole);
      loadTeamMembers();
      onEditMemberClose();
      setSuccess("Member role updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update member role");
      console.error("Error updating member role:", err);
    }
  };

  const handleRemoveMember = async () => {
    if (!id || !currentMember || !canModifyTeam()) return;
    
    try {
      await removeTeamMember(id as string, currentMember.user_id);
      loadTeamMembers();
      onDeleteMemberClose();
      setCurrentMember(null);
      setSuccess("Member removed successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove member");
      console.error("Error removing team member:", err);
    }
  };

  // Modal for adding a team member
  const renderAddMemberModal = () => (
    <Modal isOpen={isAddMemberOpen} onOpenChange={onAddMemberClose}>
      <ModalContent>
        <ModalHeader>Add Team Member</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Member</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={selectedMemberId || ""}
                onChange={(e) => setSelectedMemberId(e.target.value || null)}
              >
                <option value="">Choose a member</option>
                {organizationMembers
                  .filter((member) => 
                    !teamMembers.some((tm) => tm.user_id === member.user.id)
                  )
                  .map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name}
                    </option>
                  ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={selectedMemberRole}
                onChange={(e) => setSelectedMemberRole(e.target.value)}
              >
                <option value="leader">Team Leader</option>
                <option value="admin">Team Admin</option>
                <option value="member">Team Member</option>
              </select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onAddMemberClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleAddMember}
            isDisabled={!selectedMemberId}
          >
            Add Member
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  // Modal for editing a member role
  const renderEditMemberModal = () => (
    <Modal isOpen={isEditMemberOpen} onOpenChange={onEditMemberClose}>
      <ModalContent>
        <ModalHeader>Edit Member Role</ModalHeader>
        <ModalBody>
          {currentMember && (
            <>
              <p className="mb-4">
                Update role for <strong>{currentMember.user?.name}</strong>
              </p>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Role</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded" 
                  value={editMemberRole}
                  onChange={(e) => setEditMemberRole(e.target.value)}
                >
                  <option value="leader">Team Leader</option>
                  <option value="admin">Team Admin</option>
                  <option value="member">Team Member</option>
                </select>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onEditMemberClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleUpdateMember}>
            Update Role
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  // Modal for confirming member removal
  const renderDeleteMemberModal = () => (
    <Modal isOpen={isDeleteMemberOpen} onOpenChange={onDeleteMemberClose}>
      <ModalContent>
        <ModalHeader>Remove Team Member</ModalHeader>
        <ModalBody>
          {currentMember && (
            <p>
              Are you sure you want to remove <strong>{currentMember.user?.name}</strong> from this team? This action cannot be undone.
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onDeleteMemberClose}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleRemoveMember}>
            Remove Member
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  // Render the settings tab
  const renderSettings = () => (
    <div className="space-y-6">
      <Card className="p-4">
        <CardBody>
          <h3 className="text-xl font-semibold mb-4">Team Settings</h3>
          
          <div className="space-y-4">
            <Input
              label="Team Name"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              isReadOnly={!canModifyTeam()}
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded resize-y min-h-[100px]"
                placeholder="Enter team description"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                readOnly={!canModifyTeam()}
              />
            </div>
            
            {canModifyTeam() && (
              <div className="flex justify-end mt-4">
                <Button 
                  color="primary" 
                  startContent={<Settings size={16} />}
                  onClick={handleUpdateTeam}
                  isDisabled={!teamName || (teamName === team?.name && teamDescription === team?.description)}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      
      <Card className="p-4">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Team Information</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-default-500">Organization</span>
              <span>{currentOrganization?.name}</span>
            </div>
            <Divider />
            
            <div className="flex justify-between">
              <span className="text-default-500">Team Members</span>
              <span>{teamMembers.length}</span>
            </div>
            <Divider />
            
            <div className="flex justify-between">
              <span className="text-default-500">Created</span>
              <span>{team?.created_at && formatDate(team.created_at)}</span>
            </div>
            <Divider />
            
            <div className="flex justify-between">
              <span className="text-default-500">Last Updated</span>
              <span>{team?.updated_at && formatDate(team.updated_at)}</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // Render the members tab
  const renderMembers = () => (
    <Card className="p-4">
      <CardBody>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Team Members</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="light"
              startContent={<RefreshCw size={16} />}
              onClick={loadTeamMembers}
            >
              Refresh
            </Button>
            
            {canModifyTeam() && (
              <Button
                color="primary"
                startContent={<UserPlus size={16} />}
                onClick={onAddMemberOpen}
              >
                Add Member
              </Button>
            )}
          </div>
        </div>
        
        {isLoadingMembers ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center p-8 bg-default-50 rounded-lg">
            <Users className="mx-auto mb-4 text-default-400" size={48} />
            <h3 className="text-lg font-semibold mb-2">No Members</h3>
            <p className="text-default-500 mb-4">
              This team doesn't have any members yet. Add members to collaborate with them.
            </p>
            {canModifyTeam() && (
              <Button
                color="primary"
                startContent={<UserPlus size={16} />}
                onClick={onAddMemberOpen}
              >
                Add First Member
              </Button>
            )}
          </div>
        ) : (
          <Table aria-label="Team members table">
            <TableHeader>
              <TableColumn>MEMBER</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>JOINED</TableColumn>
              <TableColumn width={100}>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <UserComponent
                      name={member.user?.name}
                      description={member.user?.email}
                      avatarProps={{
                        src: member.user?.profile?.avatar_url || undefined,
                        fallback: member.user?.name?.charAt(0) || "U",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={
                        member.role === "leader" 
                          ? "primary" 
                          : member.role === "admin" 
                            ? "secondary" 
                            : "default"
                      }
                      variant="flat"
                      size="sm"
                    >
                      {member.role === "leader" 
                        ? "Team Leader" 
                        : member.role === "admin" 
                          ? "Team Admin" 
                          : "Team Member"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell>
                    {canModifyTeam() ? (
                      <Dropdown>
                        <DropdownTrigger>
                          <Button 
                            isIconOnly 
                            variant="light" 
                            size="sm"
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Member actions">
                          <DropdownItem
                            key="edit"
                            startContent={<Edit size={16} />}
                            onClick={() => {
                              setCurrentMember(member);
                              setEditMemberRole(member.role);
                              onEditMemberOpen();
                            }}
                          >
                            Edit Role
                          </DropdownItem>
                          <DropdownItem
                            key="remove"
                            startContent={<Trash size={16} />}
                            color="danger"
                            onClick={() => {
                              setCurrentMember(member);
                              onDeleteMemberOpen();
                            }}
                          >
                            Remove from Team
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    ) : (
                      <span className="text-xs text-default-400">No actions</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-4 bg-danger-50">
          <CardBody>
            <h2 className="text-center text-danger">Team not found or you don't have access</h2>
            <div className="flex justify-center mt-4">
              <Button 
                color="primary" 
                onClick={() => router.push('/organizations')}
              >
                Go to Organizations
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.description && (
              <p className="text-default-500 mt-1">{team.description}</p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Button
              isIconOnly
              size="sm"
              title="Refresh"
              variant="light"
              onClick={loadTeam}
            >
              <RefreshCw size={18} />
            </Button>
            <Button onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-danger-100 text-danger p-4 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-100 text-success p-4 rounded-lg">
            {success}
          </div>
        )}

        <Tabs 
          selectedKey={activeTab} 
          onSelectionChange={(key) => {
            if (typeof key === 'string') {
              setActiveTab(key);
            }
          }}
          aria-label="Team tabs"
        >
          <Tab key="settings" title="Settings">
            {renderSettings()}
          </Tab>
          <Tab key="members" title="Members">
            {renderMembers()}
          </Tab>
        </Tabs>
      </div>

      {/* Modals */}
      {renderAddMemberModal()}
      {renderEditMemberModal()}
      {renderDeleteMemberModal()}
    </div>
  );
};

TeamDetailPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export default TeamDetailPage; 