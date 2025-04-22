import { useEffect, useState } from 'react';
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/router';
import { PlusIcon, BuildingIcon } from '@/components/icons';
import { useAuth } from '@/lib/authMiddleware';

export default function OrganizationsPage() {
  const { organizations, isLoading, error, refreshOrganizations } = useOrganization();
  const router = useRouter();
  
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
        <Button 
          color="primary"
          startContent={<PlusIcon />}
          onClick={handleCreateOrganization}
        >
          Create Organization
        </Button>
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
            You don't have any organizations yet. Create your first one to get started.
          </p>
          <Button 
            color="primary" 
            onClick={handleCreateOrganization}
          >
            Create Organization
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {org.logo_url ? (
                    <img 
                      src={org.logo_url} 
                      alt={org.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <BuildingIcon size={24} className="text-default-500" />
                  )}
                  <h3 className="text-lg font-semibold">{org.name}</h3>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <p className="text-default-500">
                  {org.description || 'No description provided'}
                </p>
              </CardBody>
              <Divider />
              <CardFooter>
                <Button 
                  color="primary" 
                  variant="flat" 
                  className="w-full"
                  onClick={() => handleViewOrganization(org.id)}
                >
                  View Organization
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 