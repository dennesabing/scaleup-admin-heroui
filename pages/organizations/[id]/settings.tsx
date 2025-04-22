import { useEffect, useState } from 'react';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/authMiddleware';
import { getOrganization, updateOrganization, deleteOrganization } from '@/lib/services/organizationService';
import { OrganizationModel } from '@/types/organization';
import { BuildingIcon } from '@/components/icons';

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<OrganizationModel | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
        setName(orgData.name);
        setDescription(orgData.description || '');
        
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error && !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-danger-100 text-danger p-4 rounded-lg">
          {error}
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="light" 
          onClick={() => router.push(`/organizations/${id}`)}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
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
} 