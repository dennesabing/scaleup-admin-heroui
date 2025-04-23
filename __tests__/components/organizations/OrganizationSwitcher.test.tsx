import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrganizationSwitcher } from '@/components/organizations/OrganizationSwitcher';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRouter } from 'next/router';

// Mock the contexts and router
jest.mock('@/contexts/OrganizationContext');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('OrganizationSwitcher', () => {
  const mockRouter = {
    push: jest.fn(),
    pathname: '/',
  };

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
      logo_url: 'https://example.com/logo.png',
      created_at: '2023-01-02',
      updated_at: '2023-01-02',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders loading state when isLoading is true', () => {
    (useOrganization as jest.Mock).mockReturnValue({
      organizations: [],
      currentOrganization: null,
      isLoading: true,
      error: null,
      setCurrentOrganizationId: jest.fn(),
      refreshOrganizations: jest.fn(),
    });

    render(<OrganizationSwitcher />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders organization list when data is loaded', () => {
    (useOrganization as jest.Mock).mockReturnValue({
      organizations: mockOrganizations,
      currentOrganization: mockOrganizations[0],
      isLoading: false,
      error: null,
      setCurrentOrganizationId: jest.fn(),
      refreshOrganizations: jest.fn(),
    });

    render(<OrganizationSwitcher />);
    
    // Initially the dropdown should show the current organization in the button trigger
    const triggerButton = screen.getByTestId('mock-button');
    expect(triggerButton).toHaveTextContent('Organization 1');
  });

  it('changes organization when clicked', async () => {
    const setCurrentOrganizationId = jest.fn();
    
    (useOrganization as jest.Mock).mockReturnValue({
      organizations: mockOrganizations,
      currentOrganization: mockOrganizations[0],
      isLoading: false,
      error: null,
      setCurrentOrganizationId,
      refreshOrganizations: jest.fn(),
    });

    render(<OrganizationSwitcher />);
    
    // Open dropdown
    const triggerButton = screen.getByTestId('mock-button');
    fireEvent.click(triggerButton);
    
    // The menu should be visible with all organizations
    await waitFor(() => {
      const option = screen.getAllByText('Organization 2')[0];
      expect(option).toBeInTheDocument();
      fireEvent.click(option);
    });
    
    // Should call setCurrentOrganizationId with the correct ID
    expect(setCurrentOrganizationId).toHaveBeenCalledWith(2);
  });

  it('redirects when on organization-specific page', async () => {
    const setCurrentOrganizationId = jest.fn();
    
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      pathname: '/organizations/[id]',
    });
    
    (useOrganization as jest.Mock).mockReturnValue({
      organizations: mockOrganizations,
      currentOrganization: mockOrganizations[0],
      isLoading: false,
      error: null,
      setCurrentOrganizationId,
      refreshOrganizations: jest.fn(),
    });

    render(<OrganizationSwitcher />);
    
    // Open dropdown
    const triggerButton = screen.getByTestId('mock-button');
    fireEvent.click(triggerButton);
    
    // Click on the second organization
    await waitFor(() => {
      const option = screen.getAllByText('Organization 2')[0];
      expect(option).toBeInTheDocument();
      fireEvent.click(option);
    });
    
    // Should call router.push to redirect
    expect(mockRouter.push).toHaveBeenCalledWith('/organizations/2');
  });

  it('navigates to create organization page', async () => {
    (useOrganization as jest.Mock).mockReturnValue({
      organizations: mockOrganizations,
      currentOrganization: mockOrganizations[0],
      isLoading: false,
      error: null,
      setCurrentOrganizationId: jest.fn(),
      refreshOrganizations: jest.fn(),
    });

    render(<OrganizationSwitcher />);
    
    // Open dropdown
    const triggerButton = screen.getByTestId('mock-button');
    fireEvent.click(triggerButton);
    
    // Click on the create organization option
    await waitFor(() => {
      const option = screen.getByText('Create Organization');
      expect(option).toBeInTheDocument();
      fireEvent.click(option);
    });
    
    // Should navigate to create organization page
    expect(mockRouter.push).toHaveBeenCalledWith('/organizations/new');
  });
}); 