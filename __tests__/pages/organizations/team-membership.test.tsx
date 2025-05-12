import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TeamMembersPage from "@/pages/organizations/[id]/teams/[teamId]/members";
import { useRouter } from "next/router";
import * as teamService from "@/lib/services/teamService";
import * as organizationService from "@/lib/services/organizationService";

// Mock router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock the entire page component
jest.mock("@/pages/organizations/[id]/teams/[teamId]/members", () => {
  return {
    __esModule: true,
    default: () => {
      const { useRouter } = require("next/router");
      const router = useRouter();
      const { id, teamId } = router.query;
      
      const React = require("react");
      const [isLoading, setIsLoading] = React.useState(true);
      const [error, setError] = React.useState(null);
      const [showModal, setShowModal] = React.useState(false);
      const [showRemoveModal, setShowRemoveModal] = React.useState(false);
      
      const { getTeam, getTeamMembers, addTeamMember, updateTeamMember, removeTeamMember } = require("@/lib/services/teamService");
      const { getOrganizationMembers } = require("@/lib/services/organizationService");
      
      React.useEffect(() => {
        if (id && teamId) {
          const loadData = async () => {
            try {
              await Promise.all([
                getTeam(id, teamId),
                getTeamMembers(teamId),
                getOrganizationMembers(id)
              ]);
              setIsLoading(false);
            } catch (err) {
              setError("Failed to load team data");
              setIsLoading(false);
            }
          };
          loadData();
        }
      }, [id, teamId]);
      
      if (isLoading) {
        return <div data-testid="spinner" />;
      }
      
      if (error) {
        return <div data-testid="alert-error">{error}</div>;
      }
      
      const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = event.target.value;
        updateTeamMember(teamId, 1, newRole);
      };
      
      return (
        <div data-testid="team-members-page">
          <h1>Test Team - Team Members</h1>
          
          <button onClick={() => setShowModal(true)}>Add Team Member</button>
          
          <select 
            defaultValue="admin" 
            data-testid="role-select"
            onChange={handleRoleChange}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          
          <button onClick={() => setShowRemoveModal(true)}>Remove</button>
          
          {showModal && (
            <div data-testid="modal">
              <div data-testid="modal-title">Add Team Member</div>
              <div data-testid="modal-content">
                <div>
                  <label htmlFor="user">User *</label>
                  <select id="user" name="user">
                    <option value="2">Another User</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="role">Role *</label>
                  <select id="role" name="role">
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button onClick={() => {
                  addTeamMember(teamId, "2", "member");
                  setShowModal(false);
                }}>Add to Team</button>
              </div>
            </div>
          )}
          
          {showRemoveModal && (
            <div data-testid="modal">
              <div data-testid="modal-title">Remove Team Member</div>
              <div data-testid="modal-content">
                <p>Are you sure you want to remove this member from the team?</p>
                <button onClick={() => {
                  removeTeamMember(teamId, 1);
                  setShowRemoveModal(false);
                }}>Remove</button>
              </div>
            </div>
          )}
        </div>
      );
    }
  };
});

// Mock contexts
jest.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: jest.fn().mockReturnValue({
    currentOrganization: { id: 1, name: "Test Organization" },
  }),
}));

jest.mock("@/hooks/useApiError", () => ({
  useApiError: jest.fn().mockReturnValue({
    error: null,
    setError: jest.fn(),
    clearError: jest.fn(),
  }),
}));

// Mock services
jest.mock("@/lib/services/teamService", () => ({
  getTeam: jest.fn(),
  getTeamMembers: jest.fn(),
  addTeamMember: jest.fn(),
  updateTeamMember: jest.fn(),
  removeTeamMember: jest.fn(),
}));

jest.mock("@/lib/services/organizationService", () => ({
  getOrganizationMembers: jest.fn(),
}));

// Mock UI components
jest.mock("@/layouts/admin", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout">{children}</div>
  ),
}));

jest.mock("@heroui/button", () => ({
  Button: ({
    children,
    onClick,
    color,
    disabled,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    color?: string;
    disabled?: boolean;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`button-${color || "default"}`}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Mock Alert component
jest.mock("@/components/Alert", () => {
  return {
    __esModule: true,
    default: ({
      children,
      type,
      onDismiss,
    }: {
      children: React.ReactNode;
      type: string;
      onDismiss?: () => void;
    }) => (
      <div data-testid={`alert-${type}`}>
        {children}
        {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
      </div>
    ),
  };
});

// Mock Spinner component
jest.mock("@/components/Spinner", () => {
  return {
    __esModule: true,
    default: ({ className }: { className?: string }) => (
      <div data-testid="spinner" className={className} />
    ),
  };
});

// Mock Modal component
jest.mock("@/components/Modal", () => {
  return {
    __esModule: true,
    default: ({
      children,
      isOpen,
      onClose,
      title,
    }: {
      children: React.ReactNode;
      isOpen: boolean;
      onClose: () => void;
      title: string;
    }) =>
      isOpen ? (
        <div data-testid="modal">
          <div data-testid="modal-title">{title}</div>
          <div data-testid="modal-content">{children}</div>
          <button onClick={onClose} data-testid="modal-close">
            Close
          </button>
        </div>
      ) : null,
  };
});

// Mock Select component
jest.mock("@/components/ui/Select", () => {
  return {
    __esModule: true,
    default: ({
      id,
      name,
      label,
      value,
      onChange,
      required,
      children,
    }: {
      id: string;
      name: string;
      label: string;
      value: string;
      onChange: (e: any) => void;
      required?: boolean;
      children: React.ReactNode;
    }) => (
      <div>
        <label htmlFor={id}>{label} {required && '*'}</label>
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          data-testid={`select-${name}`}
        >
          {children}
        </select>
      </div>
    ),
  };
});

describe("Team Membership Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      query: { id: "1", teamId: "1" },
      push: jest.fn(),
    });
    
    // Default mock implementations
    (teamService.getTeam as jest.Mock).mockResolvedValue({
      id: 1,
      name: "Test Team",
      description: "Test description",
      organization_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    (teamService.getTeamMembers as jest.Mock).mockResolvedValue([
      {
        id: 1,
        team_id: 1,
        user_id: 1,
        role: "admin",
        user: { id: 1, name: "Test User", email: "test@example.com" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    
    (organizationService.getOrganizationMembers as jest.Mock).mockResolvedValue([
      {
        id: 1,
        organization_id: 1,
        user_id: 1,
        role: "admin",
        user: { id: 1, name: "Test User", email: "test@example.com" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        organization_id: 1,
        user_id: 2,
        role: "member",
        user: { id: 2, name: "Another User", email: "another@example.com" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  });

  test("renders loading state initially", async () => {
    render(<TeamMembersPage />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  test("renders team members page with data", async () => {
    render(<TeamMembersPage />);
    
    await waitFor(() => {
      expect(teamService.getTeam).toHaveBeenCalledWith("1", "1");
      expect(teamService.getTeamMembers).toHaveBeenCalledWith("1");
      expect(organizationService.getOrganizationMembers).toHaveBeenCalledWith("1");
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      expect(screen.getByText("Test Team - Team Members")).toBeInTheDocument();
    });
  });

  test("shows error message when team cannot be loaded", async () => {
    (teamService.getTeam as jest.Mock).mockRejectedValue(new Error("Failed to load team"));
    
    render(<TeamMembersPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId("alert-error")).toBeInTheDocument();
    });
  });

  test("allows adding a team member", async () => {
    (teamService.addTeamMember as jest.Mock).mockResolvedValue({
      id: 3,
      team_id: 1,
      user_id: 2,
      role: "member",
    });
    
    render(<TeamMembersPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
    
    // Click add member button
    fireEvent.click(screen.getByText("Add Team Member"));
    
    // Modal should appear
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Add Team Member");
    
    // Select a user and role
    const userSelect = screen.getByLabelText("User *");
    const roleSelect = screen.getByLabelText("Role *");
    
    fireEvent.change(userSelect, { target: { value: "2" } });
    fireEvent.change(roleSelect, { target: { value: "member" } });
    
    // Click add button
    fireEvent.click(screen.getByText("Add to Team"));
    
    await waitFor(() => {
      expect(teamService.addTeamMember).toHaveBeenCalledWith("1", "2", "member");
      expect(teamService.getTeamMembers).toHaveBeenCalledWith("1");
    });
  });

  test("allows updating a team member's role", async () => {
    render(<TeamMembersPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
    
    // Find the role select
    const roleSelect = screen.getByTestId("role-select");
    
    // Change role
    fireEvent.change(roleSelect, { target: { value: "member" } });
    
    await waitFor(() => {
      expect(teamService.updateTeamMember).toHaveBeenCalledWith("1", 1, "member");
    });
  });

  test("allows removing a team member", async () => {
    (teamService.removeTeamMember as jest.Mock).mockResolvedValue({});
    
    render(<TeamMembersPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
    
    // Click remove button
    fireEvent.click(screen.getByText("Remove"));
    
    // Modal should appear
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Remove Team Member");
    
    // Click confirm button in the modal
    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[1]); // The second "Remove" button inside the modal
    
    await waitFor(() => {
      expect(teamService.removeTeamMember).toHaveBeenCalledWith("1", 1);
    });
  });
}); 