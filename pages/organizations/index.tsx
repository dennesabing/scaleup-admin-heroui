import { useEffect, useState } from 'react';
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/router';
import { PlusIcon, BuildingIcon } from '@/components/icons';
import { useAuth } from '@/lib/authMiddleware';
import AdminLayout from "@/layouts/admin";
import { getCurrentUser } from '@/lib/auth';

export default function OrganizationsPage() {
  const { organizations, isLoading, error } = useOrganization();
  const router = useRouter();
  const currentUser = getCurrentUser();
  
  // Check if the user has the Organization Head role
  const canCreateOrganization = currentUser?.roles?.includes("Organization Head");
  
  // Protect this route
  const { isAuthenticated } = useAuth();

  const handleCreateOrganization = () => {
    router.push('/organizations/new');
  };

  const handleViewOrganization = (orgId: number) => {
    router.push(`/organizations/${orgId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Organizations</h1>
        {canCreateOrganization && (
          <Button 
            color="primary"
            startContent={<PlusIcon />}
            onClick={handleCreateOrganization}
          >
            Create Organization
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-danger-100 text-danger p-4 rounded-lg">
          {error}
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center p-8 bg-default-100 rounded-lg">
          <BuildingIcon size={48} className="mx-auto mb-4 text-default-400" />
          <h2 className="text-xl font-semibold mb-2">No Organizations</h2>
          <p className="text-default-500 mb-4">
            {canCreateOrganization 
              ? "You don't have any organizations yet. Create your first one to get started."
              : "You don't have access to any organizations yet. Please contact an administrator."
            }
          </p>
          {canCreateOrganization && (
            <Button 
              color="primary" 
              onClick={handleCreateOrganization}
            >
              Create Organization
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Card key={org.id} isPressable onPress={() => handleViewOrganization(org.id)}>
              <CardHeader className="flex gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-100 text-primary-500">
                  <BuildingIcon size={24} />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">{org.name}</p>
                  <p className="text-small text-default-500">
                    Created: {new Date(org.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <p className="text-default-700">
                  {org.description || 'No description provided'}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

OrganizationsPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
}; 