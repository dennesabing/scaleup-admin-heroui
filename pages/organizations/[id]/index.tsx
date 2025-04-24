import { useEffect, useState, useRef } from 'react';
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/authMiddleware';
import { 
  getOrganization, 
  getOrganizationMembers, 
  getOrganizationAttributes,
  updateOrganization,
  deleteOrganization,
  createOrganizationAttributes,
  updateOrganizationAttribute,
  deleteOrganizationAttribute,
  createOrganizationInvitation,
  updateOrganizationMember,
  removeOrganizationMember
} from '@/lib/services/organizationService';
import { 
  createTeam, 
  getOrganizationTeams,
  updateTeam,
  deleteTeam
} from '@/lib/services/teamService';
import { OrganizationModel, OrganizationMemberModel } from '@/types/organization';
import { TeamModel } from '@/types/team';
import { BuildingIcon, Users, Settings, PlusIcon, Trash, X, Edit } from '@/components/icons';
import { Role } from '@/utils/permissions';

export default function OrganizationDetailPage() {
  const [organization, setOrganization] = useState<OrganizationModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [members, setMembers] = useState<OrganizationMemberModel[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Settings state variables
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  const [attributesError, setAttributesError] = useState<string | null>(null);
  const [attributesSuccess, setAttributesSuccess] = useState<string | null>(null);
  
  // Refs to prevent duplicate API calls
  const isLoadingOrgRef = useRef(false);
  const isLoadingAttributesRef = useRef(false);
  const isLoadingMembersRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  
  const router = useRouter();
  const { id } = router.query;
  
  // Protect this route
  const { isAuthenticated } = useAuth();
  const { setCurrentOrganizationId, refreshOrganizations } = useOrganization();
  
  // Members invitation state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  
  // Member management state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMemberModel | null>(null);
  const [memberRole, setMemberRole] = useState('');
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  
  // New member management state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<OrganizationMemberModel | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  
  // Team creation state
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);
  
  // Add teams state
  const [teams, setTeams] = useState<TeamModel[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const isLoadingTeamsRef = useRef(false);
  const teamsLoadedRef = useRef(false);
  
  // Add team details modal state
  const [teamDetailsModalOpen, setTeamDetailsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamModel | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [teamDetailsError, setTeamDetailsError] = useState<string | null>(null);
  const [teamDetailsSuccess, setTeamDetailsSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Load organization data
  useEffect(() => {
    // Skip if no id or if we're already loading
    if (!id || typeof id !== 'string' || isLoadingOrgRef.current) return;
    
    // For subsequent id changes, we should always load
    if (initialLoadDoneRef.current && organization?.id === parseInt(id)) {
      return;
    }
    
    const loadOrganization = async () => {
      try {
        isLoadingOrgRef.current = true;
        setIsLoading(true);
        setError(null);
        
        const orgData = await getOrganization(id);
        setOrganization(orgData);
        
        // Set form values for settings
        setName(orgData.name);
        setDescription(orgData.description || '');
        
        // Set this as the current organization
        setCurrentOrganizationId(orgData.id);
        
        // Load attributes
        await loadAttributes(id);
        initialLoadDoneRef.current = true;
      } catch (err) {
        console.error('Failed to load organization:', err);
        setError('Failed to load organization details. Please try again.');
      } finally {
        setIsLoading(false);
        isLoadingOrgRef.current = false;
      }
    };
    
    loadOrganization();
  }, [id, setCurrentOrganizationId, organization]);
  
  const loadAttributes = async (organizationId: string | number) => {
    // Skip if already loading attributes
    if (isLoadingAttributesRef.current) return;
    
    try {
      isLoadingAttributesRef.current = true;
      setIsLoadingAttributes(true);
      
      const attributesData = await getOrganizationAttributes(organizationId);
      setAttributes(attributesData || {});
    } catch (err) {
      console.error('Failed to load organization attributes:', err);
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
      
      const membersData = await getOrganizationMembers(organizationId);
      setMembers(membersData || []);
    } catch (err) {
      console.error('Failed to load organization members:', err);
      // Don't set error - we'll just show empty members
    } finally {
      setIsLoadingMembers(false);
      isLoadingMembersRef.current = false;
    }
  };
  
  const handleNavigate = (path: string) => {
    router.push(`/organizations/${id}/${path}`);
  };
  
  // Load members when switching to the members tab
  useEffect(() => {
    if (activeTab === 'members' && id && typeof id === 'string' && !isLoadingMembersRef.current && members.length === 0) {
      loadMembers(id);
    }
  }, [activeTab, id, members.length]);
  
  // Settings tab functions
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || typeof id !== 'string') return;
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const updatedOrg = await updateOrganization(id, {
        name,
        description,
      });
      
      setOrganization(updatedOrg);
      setSuccessMessage('Organization updated successfully');
      
      // Refresh the organizations list in context
      await refreshOrganizations();
    } catch (err) {
      console.error('Failed to update organization:', err);
      setError('Failed to update organization. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!id || typeof id !== 'string') return;
    
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setError(null);
      
      await deleteOrganization(id);
      
      // Clear current organization and redirect
      setCurrentOrganizationId(null);
      router.push('/organizations');
    } catch (err) {
      console.error('Failed to delete organization:', err);
      setError('Failed to delete organization. Please try again.');
      setIsDeleting(false);
    }
  };
  
  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || typeof id !== 'string') return;
    if (!newAttributeKey.trim()) {
      setAttributesError('Attribute key is required');
      return;
    }
    
    try {
      setAttributesError(null);
      setAttributesSuccess(null);
      
      // Create a new attribute object with the new key-value pair
      const updatedAttributes = {
        ...attributes,
        [newAttributeKey]: newAttributeValue
      };
      
      await createOrganizationAttributes(id, updatedAttributes);
      
      // Update local state
      setAttributes(updatedAttributes);
      setNewAttributeKey('');
      setNewAttributeValue('');
      setAttributesSuccess('Attribute added successfully');
    } catch (err) {
      console.error('Failed to add attribute:', err);
      setAttributesError('Failed to add attribute. Please try again.');
    }
  };
  
  const handleDeleteAttribute = async (key: string) => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setAttributesError(null);
      setAttributesSuccess(null);
      
      await deleteOrganizationAttribute(id, key);
      
      // Update local state
      const newAttributes = { ...attributes };
      delete newAttributes[key];
      setAttributes(newAttributes);
      
      setAttributesSuccess('Attribute deleted successfully');
    } catch (err) {
      console.error('Failed to delete attribute:', err);
      setAttributesError('Failed to delete attribute. Please try again.');
    }
  };

  // Members invitation function
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || typeof id !== 'string') return;
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }
    
    try {
      setIsInviting(true);
      setInviteError(null);
      setInviteSuccess(null);
      
      await createOrganizationInvitation(id, inviteEmail, inviteRole);
      
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      
      // Close the modal after a delay
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to invite member:', err);
      setInviteError('Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  // Handle member management functions
  const openMemberModal = (member: OrganizationMemberModel) => {
    setCurrentMember(member);
    setSelectedRole(member.role as Role);
    setMemberModalOpen(true);
    setMemberActionError(null);
    setSuccessMessage(null);
  };
  
  const handleUpdateMember = async () => {
    if (!id || typeof id !== 'string' || !currentMember || !selectedRole) return;
    
    try {
      setMemberActionError(null);
      setSuccessMessage(null);
      
      await updateOrganizationMember(id, currentMember.user_id, selectedRole);
      
      // Update local state
      setMembers(members.map(member => 
        member.id === currentMember.id 
          ? { ...member, role: selectedRole } 
          : member
      ));
      
      setSuccessMessage('Member role updated successfully');
      setTimeout(() => {
        closeMemberModal();
      }, 1500);
    } catch (err) {
      console.error('Failed to update member role:', err);
      setMemberActionError('Failed to update member role. Please try again.');
    }
  };
  
  const handleRemoveMember = async () => {
    if (!id || typeof id !== 'string' || !currentMember) return;
    
    try {
      setMemberActionError(null);
      setSuccessMessage(null);
      
      await removeOrganizationMember(id, currentMember.user_id);
      
      // Update local state
      setMembers(members.filter(member => member.id !== currentMember.id));
      
      setSuccessMessage('Member removed successfully');
      setTimeout(() => {
        closeMemberModal();
      }, 1500);
    } catch (err) {
      console.error('Failed to remove member:', err);
      setMemberActionError('Failed to remove member. Please try again.');
    }
  };

  const closeMemberModal = () => {
    setMemberModalOpen(false);
    setCurrentMember(null);
    setSelectedRole('');
  };

  // Modify the loadTeams function
  const loadTeams = async (organizationId: string | number, forceRefresh = false) => {
    // Skip if already loading teams
    if (isLoadingTeamsRef.current) return;
    
    // Skip if teams are already loaded and no refresh is requested
    if (teamsLoadedRef.current && !forceRefresh) return;
    
    try {
      isLoadingTeamsRef.current = true;
      setIsLoadingTeams(true);
      
      const teamsData = await getOrganizationTeams(organizationId);
      setTeams(teamsData || []);
      teamsLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load organization teams:', err);
      // Don't set error - we'll just show empty teams
    } finally {
      setIsLoadingTeams(false);
      isLoadingTeamsRef.current = false;
    }
  };
  
  // Update the useEffect hook for loading teams
  useEffect(() => {
    if (activeTab === 'teams' && id && typeof id === 'string') {
      loadTeams(id);
    }
  }, [activeTab, id]);
  
  // Team creation function
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || typeof id !== 'string') return;
    if (!teamName.trim()) {
      setTeamError('Team name is required');
      return;
    }
    
    try {
      setIsCreatingTeam(true);
      setTeamError(null);
      setTeamSuccess(null);
      
      // Create the team
      await createTeam(id, {
        name: teamName,
        description: teamDescription
      });
      
      setTeamSuccess(`Team "${teamName}" created successfully`);
      setTeamName('');
      setTeamDescription('');
      
      // Refresh the teams list with force refresh
      await loadTeams(id, true);
      
      // Close the modal after a delay
      setTimeout(() => {
        setTeamModalOpen(false);
        setTeamSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to create team:', err);
      setTeamError('Failed to create team. Please try again.');
    } finally {
      setIsCreatingTeam(false);
    }
  };
  
  // Add function to open team details modal
  const openTeamDetails = (team: TeamModel) => {
    setSelectedTeam(team);
    setEditTeamName(team.name);
    setEditTeamDescription(team.description || '');
    setTeamDetailsModalOpen(true);
    setTeamDetailsError(null);
    setTeamDetailsSuccess(null);
    setIsEditMode(false);
  };

  // Add function to close team details modal
  const closeTeamDetails = () => {
    setTeamDetailsModalOpen(false);
    setSelectedTeam(null);
    setIsEditMode(false);
  };

  // Add function to handle team update
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || typeof id !== 'string' || !selectedTeam) return;
    if (!editTeamName.trim()) {
      setTeamDetailsError('Team name is required');
      return;
    }
    
    try {
      setIsEditingTeam(true);
      setTeamDetailsError(null);
      setTeamDetailsSuccess(null);
      
      // Update the team
      await updateTeam(id, selectedTeam.id, {
        name: editTeamName,
        description: editTeamDescription
      });
      
      setTeamDetailsSuccess('Team updated successfully');
      
      // Refresh the teams list
      await loadTeams(id, true);
      
      // Exit edit mode after successful update
      setIsEditMode(false);
    } catch (err) {
      console.error('Failed to update team:', err);
      setTeamDetailsError('Failed to update team. Please try again.');
    } finally {
      setIsEditingTeam(false);
    }
  };

  // Add function to handle team deletion
  const handleDeleteTeam = async () => {
    if (!id || typeof id !== 'string' || !selectedTeam) return;
    
    if (!window.confirm(`Are you sure you want to delete the team "${selectedTeam.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setIsDeletingTeam(true);
      setTeamDetailsError(null);
      
      await deleteTeam(id, selectedTeam.id);
      
      // Refresh the teams list
      await loadTeams(id, true);
      
      // Close the modal
      closeTeamDetails();
      
      // Show success message (optional, since modal will be closed)
      // setTeamDetailsSuccess('Team deleted successfully');
    } catch (err) {
      console.error('Failed to delete team:', err);
      setTeamDetailsError('Failed to delete team. Please try again.');
      setIsDeletingTeam(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-danger-100 text-danger p-4 rounded-lg">
          {error || 'Organization not found'}
        </div>
        <Button 
          variant="flat" 
          className="mt-4"
          onClick={() => router.push('/organizations')}
        >
          Back to Organizations
        </Button>
      </div>
    );
  }

  // Overview Tab Content
  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-default-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Organization Info</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-default-500">Name</p>
            <p className="font-medium">{organization.name}</p>
          </div>
          <div>
            <p className="text-sm text-default-500">Description</p>
            <p className="font-medium">{organization.description || 'No description provided'}</p>
          </div>
          <div>
            <p className="text-sm text-default-500">Created</p>
            <p className="font-medium">{new Date(organization.created_at).toLocaleDateString()}</p>
          </div>
          
          {/* Attributes Section */}
          {Object.keys(attributes).length > 0 && (
            <div className="mt-4 pt-4 border-t border-default-200">
              <p className="text-sm text-default-500 mb-2">Custom Attributes</p>
              <div className="space-y-2">
                {Object.entries(attributes).map(([key, value]) => (
                  <div key={key} className="flex">
                    <p className="text-sm font-medium w-1/2">{key}:</p>
                    <p className="text-sm text-default-700 w-1/2">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-default-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Members</h2>
          <Button 
            size="sm" 
            variant="flat"
            onClick={() => setActiveTab('members')}
          >
            View All
          </Button>
        </div>
        <div className="text-center py-8">
          <Users size={32} className="text-default-400 mx-auto mb-2" />
          <p className="text-default-500">
            View and manage organization members
          </p>
          <Button 
            color="primary" 
            className="mt-4"
            onClick={() => setActiveTab('members')}
          >
            Manage Members
          </Button>
        </div>
      </div>
    </div>
  );
  
  // Members Tab Content - Updated to use modal instead of navigation
  const renderMembersTab = () => {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Members</h2>
          <Button 
            color="primary"
            startContent={<PlusIcon size={16} />}
            onClick={() => setInviteModalOpen(true)}
          >
            Invite Member
          </Button>
        </div>
        
        {isLoadingMembers ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center p-8 bg-default-100 rounded-lg">
            <Users size={48} className="mx-auto mb-4 text-default-400" />
            <h3 className="text-lg font-semibold mb-2">No Members</h3>
            <p className="text-default-500 mb-4">
              You're the only member in this organization. Invite others to collaborate.
            </p>
            <Button 
              color="primary" 
              onClick={() => setInviteModalOpen(true)}
            >
              Invite Members
            </Button>
          </div>
        ) : (
          <div className="bg-default-50 rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-default-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-default-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-default-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-default-600 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-default-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-default-900">
                          {member.user?.email || 'Unknown User'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-default-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        size="sm" 
                        color="primary" 
                        variant="flat"
                        onClick={() => openMemberModal(member)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  // Settings Tab Content - Now with actual settings functionality
  const renderSettingsTab = () => (
    <div className="p-4 max-w-3xl mx-auto">
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
      
      <div className="bg-default-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">General Information</h2>
        
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div>
              <Input
                label="Organization Name"
                placeholder="Enter organization name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                isRequired
                fullWidth
              />
            </div>
            
            <div>
              <Textarea
                label="Description"
                placeholder="Enter organization description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="pt-4">
              <Button
                type="submit"
                color="primary"
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Organization Attributes Section */}
      <div className="bg-default-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Custom Attributes</h2>
        <p className="text-default-500 mb-4">
          Add custom attributes to your organization to store additional information.
        </p>
        
        {attributesError && (
          <div className="bg-danger-100 text-danger p-4 rounded-lg mb-6">
            {attributesError}
          </div>
        )}
        
        {attributesSuccess && (
          <div className="bg-success-100 text-success p-4 rounded-lg mb-6">
            {attributesSuccess}
          </div>
        )}
        
        {isLoadingAttributes ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Current Attributes */}
            {Object.keys(attributes).length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Current Attributes</h3>
                <div className="space-y-3">
                  {Object.entries(attributes).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3 p-3 bg-default-100 rounded-lg">
                      <div className="flex-grow">
                        <p className="font-medium">{key}</p>
                        <p className="text-default-500">{String(value)}</p>
                      </div>
                      <Button
                        color="danger"
                        variant="light"
                        isIconOnly
                        onClick={() => handleDeleteAttribute(key)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-default-500 italic mb-6">No attributes defined yet.</div>
            )}
            
            {/* Add New Attribute Form */}
            <div>
              <h3 className="text-lg font-medium mb-3">Add New Attribute</h3>
              <form onSubmit={handleAddAttribute} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Attribute Key"
                    placeholder="Enter key"
                    value={newAttributeKey}
                    onChange={(e) => setNewAttributeKey(e.target.value)}
                    isRequired
                    fullWidth
                  />
                  <Input
                    label="Attribute Value"
                    placeholder="Enter value"
                    value={newAttributeValue}
                    onChange={(e) => setNewAttributeValue(e.target.value)}
                    fullWidth
                  />
                </div>
                <div>
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<PlusIcon size={16} />}
                  >
                    Add Attribute
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
      
      <div className="bg-danger-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
        <p className="text-default-500 mb-4">
          Once you delete an organization, there is no going back. Please be certain.
        </p>
        
        <Button
          color="danger"
          isLoading={isDeleting}
          onClick={handleDelete}
        >
          Delete Organization
        </Button>
      </div>
    </div>
  );

  // Update the Teams Tab Content
  const renderTeamsTab = () => {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Teams</h2>
          <Button 
            color="primary"
            startContent={<PlusIcon size={16} />}
            onClick={() => setTeamModalOpen(true)}
          >
            Create Team
          </Button>
        </div>
        
        {isLoadingTeams ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center p-8 bg-default-100 rounded-lg">
            <Users size={48} className="mx-auto mb-4 text-default-400" />
            <h3 className="text-lg font-semibold mb-2">No Teams</h3>
            <p className="text-default-500 mb-4">
              You haven't created any teams for this organization yet. Teams help you organize members into groups with specific permissions and responsibilities.
            </p>
            <div className="max-w-lg mx-auto text-left mb-6">
              <h4 className="font-medium mb-2">With teams, you can:</h4>
              <ul className="list-disc pl-6 space-y-1 text-default-600">
                <li>Group members by department, project, or function</li>
                <li>Assign specific access permissions to each team</li>
                <li>Manage resources and workflows more efficiently</li>
                <li>Simplify communication within specialized groups</li>
              </ul>
            </div>
            <Button 
              color="primary" 
              onClick={() => setTeamModalOpen(true)}
            >
              Create First Team
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div 
                key={team.id} 
                className="bg-default-50 p-4 rounded-lg border border-default-200 hover:border-primary transition-all cursor-pointer"
                onClick={() => openTeamDetails(team)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">{team.name}</h3>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTeamDetails(team);
                      setIsEditMode(true);
                    }}
                  >
                    <Settings size={16} />
                  </Button>
                </div>
                {team.description && (
                  <p className="text-default-500 text-sm mb-3">{team.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center">
                    <Users size={16} className="text-default-400 mr-1" />
                    <span className="text-xs text-default-500">
                      {/* We don't have member_count in TeamModel, so use a static value for now */}
                      0 Members
                    </span>
                  </div>
                  <span className="text-xs text-default-400">
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Create Team Modal
  const renderCreateTeamModal = () => (
    <Modal 
      isOpen={teamModalOpen} 
      onClose={() => setTeamModalOpen(false)}
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Create New Team</h3>
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              onClick={() => setTeamModalOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
        </ModalHeader>
        <ModalBody>
          {teamError && (
            <div className="bg-danger-100 text-danger p-3 rounded-lg mb-3">
              {teamError}
            </div>
          )}
          
          {teamSuccess && (
            <div className="bg-success-100 text-success p-3 rounded-lg mb-3">
              {teamSuccess}
            </div>
          )}
          
          <form id="team-form" onSubmit={handleCreateTeam}>
            <div className="space-y-4">
              <div>
                <Input
                  label="Team Name"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  isRequired
                  fullWidth
                />
              </div>
              
              <div>
                <Textarea
                  label="Description"
                  placeholder="Enter team description"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  fullWidth
                />
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="flat" 
            color="default" 
            onClick={() => setTeamModalOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="team-form"
            color="primary"
            isLoading={isCreatingTeam}
          >
            Create Team
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
  
  // Invite Member Modal
  const renderInviteModal = () => (
    <Modal 
      isOpen={inviteModalOpen} 
      onClose={() => setInviteModalOpen(false)}
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Invite Team Member</h3>
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              onClick={() => setInviteModalOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>
        </ModalHeader>
        <ModalBody>
          {inviteError && (
            <div className="bg-danger-100 text-danger p-3 rounded-lg mb-3">
              {inviteError}
            </div>
          )}
          
          {inviteSuccess && (
            <div className="bg-success-100 text-success p-3 rounded-lg mb-3">
              {inviteSuccess}
            </div>
          )}
          
          <form id="invite-form" onSubmit={handleInviteMember}>
            <div className="space-y-4">
              <div>
                <Input
                  label="Email Address"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                  isRequired
                  fullWidth
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="flat" 
            color="default" 
            onClick={() => setInviteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="invite-form"
            color="primary"
            isLoading={isInviting}
          >
            Send Invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
  
  // Member management modal
  const renderMemberModal = () => (
    <Modal 
      isOpen={memberModalOpen} 
      onClose={closeMemberModal}
      backdrop="blur"
    >
      <ModalContent>
        {currentMember && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage Team Member</h3>
                <Button 
                  isIconOnly 
                  variant="light" 
                  size="sm" 
                  onClick={closeMemberModal}
                >
                  <X size={18} />
                </Button>
              </div>
            </ModalHeader>
            <ModalBody>
              {memberError && (
                <div className="bg-danger-100 text-danger p-3 rounded-lg mb-3">
                  {memberError}
                </div>
              )}
              
              {memberSuccess && (
                <div className="bg-success-100 text-success p-3 rounded-lg mb-3">
                  {memberSuccess}
                </div>
              )}
              
              <form id="member-form" onSubmit={handleUpdateMember}>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Email</p>
                    <p className="text-default-900">{currentMember.user?.email || 'Unknown User'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="flat" className="w-full justify-between">
                          {selectedRole || 'Select role'}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu 
                        aria-label="Role selection"
                        onAction={(key) => setSelectedRole(key as Role)}
                      >
                        <DropdownItem key={Role.OWNER} isDisabled={currentMember.role === Role.OWNER}>
                          Owner
                        </DropdownItem>
                        <DropdownItem key={Role.ADMIN}>
                          Admin
                        </DropdownItem>
                        <DropdownItem key={Role.MEMBER}>
                          Member
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </form>
            </ModalBody>
            <ModalFooter className="flex justify-between">
              <Button 
                color="danger" 
                variant="flat"
                isLoading={isRemovingMember}
                onClick={handleRemoveMember}
              >
                Remove Member
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="flat" 
                  color="default" 
                  onClick={closeMemberModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  form="member-form"
                  color="primary"
                  isLoading={isUpdatingMember}
                >
                  Save Changes
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );

  // Team Details Modal
  const renderTeamDetailsModal = () => (
    <Modal 
      isOpen={teamDetailsModalOpen} 
      onClose={closeTeamDetails}
      backdrop="blur"
    >
      <ModalContent>
        {selectedTeam && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {isEditMode ? 'Edit Team' : selectedTeam.name}
                </h3>
                <Button 
                  isIconOnly 
                  variant="light" 
                  size="sm" 
                  onClick={closeTeamDetails}
                >
                  <X size={18} />
                </Button>
              </div>
            </ModalHeader>
            <ModalBody>
              {teamDetailsError && (
                <div className="bg-danger-100 text-danger p-3 rounded-lg mb-3">
                  {teamDetailsError}
                </div>
              )}
              
              {teamDetailsSuccess && (
                <div className="bg-success-100 text-success p-3 rounded-lg mb-3">
                  {teamDetailsSuccess}
                </div>
              )}
              
              {isEditMode ? (
                <form id="edit-team-form" onSubmit={handleUpdateTeam}>
                  <div className="space-y-4">
                    <div>
                      <Input
                        label="Team Name"
                        placeholder="Enter team name"
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        isRequired
                        fullWidth
                      />
                    </div>
                    
                    <div>
                      <Textarea
                        label="Description"
                        placeholder="Enter team description"
                        value={editTeamDescription}
                        onChange={(e) => setEditTeamDescription(e.target.value)}
                        fullWidth
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-default-500">Team Name</p>
                    <p className="font-medium">{selectedTeam.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-default-500">Description</p>
                    <p className="font-medium">{selectedTeam.description || 'No description provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-default-500">Created</p>
                    <p className="font-medium">{new Date(selectedTeam.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="border-t border-default-200 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-medium">Team Members</h4>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<PlusIcon size={14} />}
                        onClick={() => {
                          // Placeholder for adding team members
                          // Could navigate to team members page or open another modal
                          alert('Add team members functionality');
                        }}
                      >
                        Add Members
                      </Button>
                    </div>
                    <div className="text-center py-4 text-default-500">
                      <p>No members in this team yet</p>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter className={isEditMode ? "flex justify-between" : ""}>
              {isEditMode ? (
                <>
                  <Button 
                    color="danger" 
                    variant="flat"
                    isLoading={isDeletingTeam}
                    onClick={handleDeleteTeam}
                  >
                    Delete Team
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="flat" 
                      color="default" 
                      onClick={() => setIsEditMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      form="edit-team-form"
                      color="primary"
                      isLoading={isEditingTeam}
                    >
                      Save Changes
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="flat"
                    startContent={<Edit size={16} />}
                    onClick={() => setIsEditMode(true)}
                  >
                    Edit Team
                  </Button>
                  <Button 
                    color="primary"
                    onClick={() => {
                      // Placeholder for managing team members
                      alert('Manage team members functionality');
                    }}
                  >
                    Manage Members
                  </Button>
                </div>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BuildingIcon size={32} className="text-default-500" />
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
          {activeTab === 'overview' && renderOverviewTab()}
        </Tab>
        <Tab key="teams" title="Teams">
          {activeTab === 'teams' && renderTeamsTab()}
        </Tab>
        <Tab key="members" title="Members">
          {activeTab === 'members' && renderMembersTab()}
        </Tab>
        <Tab key="settings" title="Settings">
          {activeTab === 'settings' && renderSettingsTab()}
        </Tab>
      </Tabs>
      
      {/* Render all modals */}
      {renderCreateTeamModal()}
      {renderInviteModal()}
      {renderMemberModal()}
      {renderTeamDetailsModal()}
    </div>
  );
} 