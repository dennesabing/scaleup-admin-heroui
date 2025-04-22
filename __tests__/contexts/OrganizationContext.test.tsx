import { render, screen, act, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganization } from '@/contexts/OrganizationContext';
import { getOrganizations } from '@/lib/services/organizationService';
import React from 'react';

// Mock the organization service
jest.mock('@/lib/services/organizationService', () => ({
  getOrganizations: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component that uses the context
const TestComponent = () => {
  const { 
    organizations, 
    currentOrganization, 
    isLoading, 
    error, 
    setCurrentOrganizationId 
  } = useOrganization();

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {currentOrganization && (
        <div>Current: {currentOrganization.name}</div>
      )}
      <div>Count: {organizations.length}</div>
      <button onClick={() => setCurrentOrganizationId(2)}>Set Org 2</button>
      <button onClick={() => setCurrentOrganizationId(null)}>Clear Org</button>
    </div>
  );
};

describe('OrganizationContext', () => {
  const mockOrganizations = [
    {
      id: 1,
      name: 'Organization 1',
      slug: 'org-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
    {
      id: 2,
      name: 'Organization 2',
      slug: 'org-2',
      created_at: '2023-01-02',
      updated_at: '2023-01-02',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('shows loading state and loads organizations', async () => {
    (getOrganizations as jest.Mock).mockResolvedValue(mockOrganizations);

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Initial loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // After loading
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Count: 2')).toBeInTheDocument();
      expect(screen.getByText('Current: Organization 1')).toBeInTheDocument();
    });

    // Should have called getOrganizations
    expect(getOrganizations).toHaveBeenCalled();
    
    // Should set the current organization in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('current_organization_id', '1');
  });

  it('handles errors when loading organizations', async () => {
    (getOrganizations as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Initial loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // After error
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Error: Failed to load organizations. Please try again later.')).toBeInTheDocument();
    });
  });

  it('allows changing the current organization', async () => {
    (getOrganizations as jest.Mock).mockResolvedValue(mockOrganizations);

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Wait for organizations to load
    await waitFor(() => {
      expect(screen.getByText('Current: Organization 1')).toBeInTheDocument();
    });

    // Change current organization
    act(() => {
      screen.getByText('Set Org 2').click();
    });

    // Should update the current organization
    await waitFor(() => {
      expect(screen.getByText('Current: Organization 2')).toBeInTheDocument();
    });

    // Should update localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('current_organization_id', '2');
  });

  it('allows clearing the current organization', async () => {
    (getOrganizations as jest.Mock).mockResolvedValue(mockOrganizations);

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Wait for organizations to load
    await waitFor(() => {
      expect(screen.getByText('Current: Organization 1')).toBeInTheDocument();
    });

    // Clear current organization
    act(() => {
      screen.getByText('Clear Org').click();
    });

    // Should clear the current organization
    await waitFor(() => {
      expect(screen.queryByText('Current:')).not.toBeInTheDocument();
    });

    // Should remove from localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('current_organization_id');
  });

  it('restores current organization from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('2');
    (getOrganizations as jest.Mock).mockResolvedValue(mockOrganizations);

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // After loading, should use the stored ID
    await waitFor(() => {
      expect(screen.getByText('Current: Organization 2')).toBeInTheDocument();
    });

    // Should have checked localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith('current_organization_id');
  });
}); 