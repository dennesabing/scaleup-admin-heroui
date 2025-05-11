import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import React from "react";

import { OrganizationSwitcher } from "@/components/organizations/OrganizationSwitcher";
import { useOrganization } from "@/contexts/OrganizationContext";

// Mock the contexts and router
jest.mock("@/contexts/OrganizationContext");
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Define types for mock components
type ChildrenProps = { children: React.ReactNode };
type DropdownItemProps = { children: React.ReactNode; onPress?: () => void };
type ButtonProps = { 
  children: React.ReactNode; 
  onClick?: () => void; 
  startContent?: React.ReactNode;
  isLoading?: boolean;
};
type AvatarProps = { alt: string; src?: string };

// Mock HeroUI dropdown components
jest.mock("@heroui/dropdown", () => ({
  // @ts-ignore - mock implementation
  Dropdown: function Dropdown({ children }: ChildrenProps) { 
    return <div data-testid="dropdown">{children}</div>; 
  },
  // @ts-ignore - mock implementation
  DropdownTrigger: function DropdownTrigger({ children }: ChildrenProps) { 
    return <div data-testid="dropdown-trigger">{children}</div>; 
  },
  // @ts-ignore - mock implementation
  DropdownMenu: function DropdownMenu({ children }: ChildrenProps) { 
    return <div data-testid="dropdown-menu">{children}</div>; 
  },
  // @ts-ignore - mock implementation
  DropdownItem: function DropdownItem({ children, onPress }: DropdownItemProps) { 
    return (
      <button data-testid="dropdown-item" onClick={onPress}>
        {children}
      </button>
    );
  },
}));

// Mock Button component
jest.mock("@heroui/button", () => ({
  // @ts-ignore - mock implementation
  Button: function Button({ children, onClick, startContent, isLoading }: ButtonProps) {
    return (
      <button data-testid="mock-button" onClick={onClick}>
        {startContent && <span>{startContent}</span>}
        {children}
      </button>
    );
  },
}));

// Mock Avatar component
jest.mock("@heroui/avatar", () => ({
  // @ts-ignore - mock implementation
  Avatar: function Avatar({ alt }: AvatarProps) { 
    return <div data-testid="avatar">{alt}</div>; 
  },
}));

describe("OrganizationSwitcher", () => {
  const mockRouter = {
    push: jest.fn(),
    pathname: "/",
  };

  const mockOrganizations = [
    {
      id: 1,
      name: "Organization 1",
      slug: "org-1",
      created_at: "2023-01-01",
      updated_at: "2023-01-01",
    },
    {
      id: 2,
      name: "Organization 2",
      slug: "org-2",
      logo_url: "https://example.com/logo.png",
      created_at: "2023-01-02",
      updated_at: "2023-01-02",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("renders loading state when isLoading is true", () => {
    (useOrganization as jest.Mock).mockReturnValue({
      organizations: [],
      currentOrganization: null,
      isLoading: true,
      error: null,
      setCurrentOrganizationId: jest.fn(),
      refreshOrganizations: jest.fn(),
    });

    render(<OrganizationSwitcher />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders organization list when data is loaded", () => {
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
    const triggerButton = screen.getByTestId("mock-button");

    expect(triggerButton).toHaveTextContent("Organization 1");
  });

  it("changes organization when clicked", async () => {
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

    // Find all dropdown items
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    
    // Find the Organization 2 item (second item in the list)
    const org2Item = dropdownItems.find(item => item.textContent === "Organization 2");
    
    // Click on Organization 2
    if (org2Item) {
      fireEvent.click(org2Item);
    }

    // Should call setCurrentOrganizationId with the correct ID
    expect(setCurrentOrganizationId).toHaveBeenCalledWith(2);
  });

  it("redirects when on organization-specific page", async () => {
    const setCurrentOrganizationId = jest.fn();
    const mockPush = jest.fn();

    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      pathname: "/organizations/[id]",
      push: mockPush,
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

    // Find all dropdown items
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    
    // Find the Organization 2 item (second item in the list)
    const org2Item = dropdownItems.find(item => item.textContent === "Organization 2");
    
    // Click on Organization 2
    if (org2Item) {
      fireEvent.click(org2Item);
    }

    // Should call router.push to redirect
    expect(mockPush).toHaveBeenCalledWith("/organizations/2");
  });

  it("navigates to create organization page", async () => {
    const mockPush = jest.fn();
    
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      push: mockPush,
    });
    
    (useOrganization as jest.Mock).mockReturnValue({
      organizations: mockOrganizations,
      currentOrganization: mockOrganizations[0],
      isLoading: false,
      error: null,
      setCurrentOrganizationId: jest.fn(),
      refreshOrganizations: jest.fn(),
    });

    render(<OrganizationSwitcher />);

    // Find all dropdown items
    const dropdownItems = screen.getAllByTestId("dropdown-item");
    
    // Find the Create Organization item (should be the last item)
    const createOrgItem = dropdownItems.find(item => item.textContent === "Create Organization");
    
    // Click on Create Organization
    if (createOrgItem) {
      fireEvent.click(createOrgItem);
    }

    // Should navigate to create organization page
    expect(mockPush).toHaveBeenCalledWith("/organizations/new");
  });
});
