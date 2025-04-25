import { useEffect, useState } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/router';
import { BuildingIcon, PlusIcon } from '@/components/icons';

export const OrganizationSwitcher = () => {
  const { organizations, currentOrganization, setCurrentOrganizationId, isLoading } = useOrganization();
  const router = useRouter();
  
  const handleSelectOrganization = (orgId: number) => {
    setCurrentOrganizationId(orgId);
    
    // If we're currently in an organization-specific page, redirect to the new organization
    if (router.pathname.includes('/organizations/[id]')) {
      router.push(`/organizations/${orgId}`);
    }
  };
  
  const handleCreateOrganization = () => {
    router.push('/organizations/new');
  };

  // Don't render anything while loading to prevent flickering
  if (isLoading) {
    return (
      <Button 
        variant="flat"
        isLoading
        className="flex items-center gap-2 min-w-[200px]"
      >
        Loading
      </Button>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button 
          variant="flat" 
          className="flex items-center gap-2 min-w-[200px]"
          startContent={
            currentOrganization?.logo_url ? (
              <Avatar 
                src={currentOrganization.logo_url} 
                alt={currentOrganization.name} 
                classNames={{
                  base: "w-6 h-6",
                }}
              />
            ) : (
              <BuildingIcon size={18} className="text-default-500" />
            )
          }
        >
          {currentOrganization?.name || 'Select Organization'}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Organization switcher">
        {organizations.map((org) => (
          <DropdownItem 
            key={org.id}
            startContent={
              org.logo_url ? (
                <Avatar 
                  src={org.logo_url} 
                  alt={org.name} 
                  classNames={{
                    base: "w-5 h-5",
                  }}
                />
              ) : (
                <BuildingIcon size={16} className="text-default-500" />
              )
            }
            className={org.id === currentOrganization?.id ? 'bg-primary-100' : ''}
            onPress={() => handleSelectOrganization(org.id)}
          >
            {org.name}
          </DropdownItem>
        ))}
        <DropdownItem 
          onPress={handleCreateOrganization}
          startContent={<PlusIcon size={16} className="text-default-500" />}
          className="text-primary"
        >
          Create Organization
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}; 