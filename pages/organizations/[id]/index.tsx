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
import AdminLayout from "@/layouts/admin";

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
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  
  // Member management state
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
  
  // Teams state
  const [teams, setTeams] = useState<TeamModel[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const isLoadingTeamsRef = useRef(false);
  const teamsLoadedRef = useRef(false);
  
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
  
  // Load teams when switching to the teams tab
  const loadTeams = async (organizationId: string | number, forceRefresh = false) => {
    // Skip if already loading teams or if teams are already loaded and no refresh is requested
    if (isLoadingTeamsRef.current) return;
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
  
  // Load members when switching to the members tab
  useEffect(() => {
    if (activeTab === 'members' && id && typeof id === 'string' && !isLoadingMembersRef.current && members.length === 0) {
      loadMembers(id);
    }
    
    if (activeTab === 'teams' && id && typeof id === 'string') {
      loadTeams(id);
    }
  }, [activeTab, id, members.length]);
  
  // Render overview tab
  const renderOverviewTab = () => (
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
            <p className="font-medium">{organization?.description || 'No description provided'}</p>
          </div>
          <div>
            <p className="text-sm text-default-500">Created</p>
            <p className="font-medium">{organization ? new Date(organization.created_at).toLocaleDateString() : '-'}</p>
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
  
  // Render members tab
  const renderMembersTab = () => {
    if (isLoadingMembers) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
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
        
        {members.length === 0 ? (
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
                        onClick={() => {
                          setCurrentMember(member);
                          setSelectedRole(member.role as Role);
                          setMemberModalOpen(true);
                        }}
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
  
  // Render teams tab
  const renderTeamsTab = () => {
    if (isLoadingTeams) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
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
        
        {teams.length === 0 ? (
          <div className="text-center p-8 bg-default-100 rounded-lg">
            <Users size={48} className="mx-auto mb-4 text-default-400" />
            <h3 className="text-lg font-semibold mb-2">No Teams</h3>
            <p className="text-default-500 mb-4">
              You haven't created any teams for this organization yet. Teams help you organize members into groups with specific permissions and responsibilities.
            </p>
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
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">{team.name}</h3>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
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
  
  // Render settings tab
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
        
        <form onSubmit={(e) => e.preventDefault()}>
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
    </div>
  );
  
  // If the page is loading, show a spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If there's an error or no organization data, show error message
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
    </div>
  );
}

OrganizationDetailPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
}; 