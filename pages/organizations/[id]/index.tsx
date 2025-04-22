import { useEffect, useState } from 'react';
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/authMiddleware';
import { getOrganization, getOrganizationMembers } from '@/lib/services/organizationService';
import { OrganizationModel } from '@/types/organization';
import { BuildingIcon, Users, Settings } from '@/components/icons';

export default function OrganizationDetailPage() {
  const [organization, setOrganization] = useState<OrganizationModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { id } = router.query;
  
  // Protect this route
  const { isAuthenticated } = useAuth();
  const { setCurrentOrganizationId } = useOrganization();
  
  // Load organization data
  useEffect(() => {
    const loadOrganization = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const orgData = await getOrganization(id);
        setOrganization(orgData);
        
        // Set this as the current organization
        setCurrentOrganizationId(orgData.id);
      } catch (err) {
        console.error('Failed to load organization:', err);
        setError('Failed to load organization details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrganization();
  }, [id, setCurrentOrganizationId]);
  
  const handleNavigate = (path: string) => {
    router.push(`/organizations/${id}/${path}`);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {organization.logo_url ? (
            <img 
              src={organization.logo_url} 
              alt={organization.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <BuildingIcon size={32} className="text-default-500" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            {organization.description && (
              <p className="text-default-500">{organization.description}</p>
            )}
          </div>
        </div>
        
        <Button 
          color="primary" 
          variant="flat"
          startContent={<Settings size={18} />}
          onClick={() => handleNavigate('settings')}
        >
          Settings
        </Button>
      </div>
      
      <Tabs aria-label="Organization navigation">
        <Tab 
          key="overview" 
          title="Overview"
          className="p-4"
        >
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
              </div>
            </div>
            
            <div className="bg-default-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Members</h2>
                <Button 
                  size="sm" 
                  variant="flat"
                  onClick={() => handleNavigate('members')}
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
                  onClick={() => handleNavigate('members')}
                >
                  Manage Members
                </Button>
              </div>
            </div>
          </div>
        </Tab>
        <Tab 
          key="teams" 
          title="Teams"
          onClick={() => handleNavigate('teams')}
        >
          {/* Teams content will be implemented in a separate page */}
        </Tab>
        <Tab 
          key="members" 
          title="Members"
          onClick={() => handleNavigate('members')}
        >
          {/* Members content will be implemented in a separate page */}
        </Tab>
        <Tab 
          key="settings" 
          title="Settings"
          onClick={() => handleNavigate('settings')}
        >
          {/* Settings content will be implemented in a separate page */}
        </Tab>
      </Tabs>
    </div>
  );
} 