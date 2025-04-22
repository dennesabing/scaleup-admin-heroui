import { useState } from 'react';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/authMiddleware';
import { createOrganization } from '@/lib/services/organizationService';

export default function CreateOrganizationPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { refreshOrganizations } = useOrganization();
  const router = useRouter();
  
  // Protect this route
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const newOrg = await createOrganization({
        name,
        description,
      });
      
      await refreshOrganizations();
      
      // Redirect to the new organization
      router.push(`/organizations/${newOrg.id}`);
    } catch (err) {
      console.error('Failed to create organization:', err);
      setError('Failed to create organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Organization</h1>
        <p className="text-default-500">
          Create a new organization to collaborate with your team.
        </p>
      </div>
      
      {error && (
        <div className="bg-danger-100 text-danger p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
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
              placeholder="Enter organization description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="flat"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={isSubmitting}
            >
              Create Organization
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 