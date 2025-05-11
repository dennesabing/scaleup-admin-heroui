import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { useRouter } from "next/router";

import { useOrganization } from "@/contexts/OrganizationContext";
import { BuildingIcon, PlusIcon } from "@/components/icons";

export const OrganizationSwitcher = () => {
  const {
    organizations,
    currentOrganization,
    setCurrentOrganizationId,
    isLoading,
  } = useOrganization();
  const router = useRouter();

  const handleSelectOrganization = (orgId: number) => {
    setCurrentOrganizationId(orgId);

    // If we're currently in an organization-specific page, redirect to the new organization
    if (router.pathname.includes("/organizations/[id]")) {
      router.push(`/organizations/${orgId}`);
    }
  };

  const handleCreateOrganization = () => {
    router.push("/organizations/new");
  };

  // Don't render anything while loading to prevent flickering
  if (isLoading) {
    return (
      <Button
        isLoading
        className="flex items-center gap-2 min-w-[200px]"
        variant="flat"
      >
        Loading
      </Button>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          className="flex items-center gap-2 min-w-[200px]"
          startContent={
            currentOrganization?.logo_url ? (
              <Avatar
                alt={currentOrganization.name}
                classNames={{
                  base: "w-6 h-6",
                }}
                src={currentOrganization.logo_url}
              />
            ) : (
              <BuildingIcon className="text-default-500" size={18} />
            )
          }
          variant="flat"
        >
          {currentOrganization?.name || "Select Organization"}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Organization switcher">
        {organizations.map((org) => (
          <DropdownItem
            key={org.id}
            className={
              org.id === currentOrganization?.id ? "bg-primary-100" : ""
            }
            startContent={
              org.logo_url ? (
                <Avatar
                  alt={org.name}
                  classNames={{
                    base: "w-5 h-5",
                  }}
                  src={org.logo_url}
                />
              ) : (
                <BuildingIcon className="text-default-500" size={16} />
              )
            }
            onPress={() => handleSelectOrganization(org.id)}
          >
            {org.name}
          </DropdownItem>
        ))}
        <DropdownItem
          className="text-primary"
          startContent={<PlusIcon className="text-default-500" size={16} />}
          onPress={handleCreateOrganization}
        >
          Create Organization
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
