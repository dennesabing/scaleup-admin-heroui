import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";

import { OrganizationModel } from "@/lib/organization";
import { getOrganizations } from "@/lib/services/organizationService";

interface OrganizationContextType {
  organizations: OrganizationModel[];
  currentOrganization: OrganizationModel | null;
  isLoading: boolean;
  error: string | null;
  setCurrentOrganizationId: (id: number | null) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

const CURRENT_ORG_KEY = "current_organization_id";

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [organizations, setOrganizations] = useState<OrganizationModel[]>([]);
  const [currentOrganization, setCurrentOrganization] =
    useState<OrganizationModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const loadOrganizations = async () => {
    // Prevent concurrent loading and duplicate requests
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      const orgs = await getOrganizations();

      setOrganizations(orgs);

      // Try to set current organization from localStorage or default to first
      const storedOrgId = localStorage.getItem(CURRENT_ORG_KEY);

      if (storedOrgId && orgs.some((org) => org.id === parseInt(storedOrgId))) {
        setCurrentOrganization(
          orgs.find((org) => org.id === parseInt(storedOrgId)) || null,
        );
      } else if (orgs.length > 0) {
        setCurrentOrganization(orgs[0]);
        localStorage.setItem(CURRENT_ORG_KEY, orgs[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setError("Failed to load organizations. Please try again later.");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      initialLoadDoneRef.current = true;
    }
  };

  // Single useEffect for initial load
  useEffect(() => {
    // Only load if we haven't already done the initial load
    if (!initialLoadDoneRef.current) {
      loadOrganizations();
    }

    // No dependencies needed as we're using refs to track state
  }, []);

  const setCurrentOrganizationId = (id: number | null) => {
    if (id === null) {
      localStorage.removeItem(CURRENT_ORG_KEY);
      setCurrentOrganization(null);

      return;
    }

    const org = organizations.find((o) => o.id === id);

    if (org) {
      localStorage.setItem(CURRENT_ORG_KEY, id.toString());
      setCurrentOrganization(org);
    }
  };

  const refreshOrganizations = async () => {
    // Don't refresh if we're already loading
    if (isLoadingRef.current) return;
    await loadOrganizations();
  };

  const value = {
    organizations,
    currentOrganization,
    isLoading,
    error,
    setCurrentOrganizationId,
    refreshOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);

  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }

  return context;
};
