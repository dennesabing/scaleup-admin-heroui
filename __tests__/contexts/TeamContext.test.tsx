import { render, screen, act, waitFor } from "@testing-library/react";
import React from "react";

import { TeamProvider, useTeam } from "@/contexts/TeamContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { getOrganizationTeams } from "@/lib/services/teamService";

// Mock dependencies
jest.mock("@/lib/services/teamService", () => ({
  getOrganizationTeams: jest.fn(),
}));

jest.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: jest.fn(),
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

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Test component that uses the context
const TestComponent = () => {
  const { teams, currentTeam, isLoading, error, setCurrentTeamId } = useTeam();

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {currentTeam && <div>Current Team: {currentTeam.name}</div>}
      <div>Team Count: {teams.length}</div>
      <button onClick={() => setCurrentTeamId(2)}>Set Team 2</button>
      <button onClick={() => setCurrentTeamId(null)}>Clear Team</button>
    </div>
  );
};

describe("TeamContext", () => {
  const mockOrganization = {
    id: 1,
    name: "Organization 1",
    slug: "org-1",
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
  };

  const mockTeams = [
    {
      id: 1,
      organization_id: 1,
      name: "Team 1",
      slug: "team-1",
      created_at: "2023-01-01",
      updated_at: "2023-01-01",
    },
    {
      id: 2,
      organization_id: 1,
      name: "Team 2",
      slug: "team-2",
      created_at: "2023-01-02",
      updated_at: "2023-01-02",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Default mock implementation for useOrganization
    (useOrganization as jest.Mock).mockReturnValue({
      currentOrganization: mockOrganization,
    });
  });

  it("shows loading state and loads teams when organization is available", async () => {
    (getOrganizationTeams as jest.Mock).mockResolvedValue(mockTeams);

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>,
    );

    // Initial loading state
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // After loading
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByText("Team Count: 2")).toBeInTheDocument();
      expect(screen.getByText("Current Team: Team 1")).toBeInTheDocument();
    });

    // Should have called getOrganizationTeams with the current organization ID
    expect(getOrganizationTeams).toHaveBeenCalledWith(1);

    // Should set the current team in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "current_team_id",
      "1",
    );
  });

  it("does not load teams when no organization is selected", async () => {
    (useOrganization as jest.Mock).mockReturnValue({
      currentOrganization: null,
    });

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>,
    );

    // Should immediately show empty state without loading
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByText("Team Count: 0")).toBeInTheDocument();
    });

    // Should not have called getOrganizationTeams
    expect(getOrganizationTeams).not.toHaveBeenCalled();
  });

  it("handles errors when loading teams", async () => {
    (getOrganizationTeams as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>,
    );

    // Initial loading state
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // After error
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(
        screen.getByText(
          "Error: Failed to load teams. Please try again later.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("allows changing the current team", async () => {
    (getOrganizationTeams as jest.Mock).mockResolvedValue(mockTeams);

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>,
    );

    // Wait for teams to load
    await waitFor(() => {
      expect(screen.getByText("Current Team: Team 1")).toBeInTheDocument();
    });

    // Change current team
    act(() => {
      screen.getByText("Set Team 2").click();
    });

    // Should update the current team
    await waitFor(() => {
      expect(screen.getByText("Current Team: Team 2")).toBeInTheDocument();
    });

    // Should update localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "current_team_id",
      "2",
    );
  });

  it("allows clearing the current team", async () => {
    (getOrganizationTeams as jest.Mock).mockResolvedValue(mockTeams);

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>,
    );

    // Wait for teams to load
    await waitFor(() => {
      expect(screen.getByText("Current Team: Team 1")).toBeInTheDocument();
    });

    // Clear current team
    act(() => {
      screen.getByText("Clear Team").click();
    });

    // Should clear the current team
    await waitFor(() => {
      expect(screen.queryByText("Current Team:")).not.toBeInTheDocument();
    });

    // Should remove from localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("current_team_id");
  });

  it("restores current team from localStorage", async () => {
    localStorageMock.getItem.mockReturnValue("2");
    (getOrganizationTeams as jest.Mock).mockResolvedValue(mockTeams);

    render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>,
    );

    // After loading, should use the stored ID
    await waitFor(() => {
      expect(screen.getByText("Current Team: Team 2")).toBeInTheDocument();
    });

    // Should have checked localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith("current_team_id");
  });

  it("reloads teams when the current organization changes", async () => {
    // Initial setup with first organization
    const mockOrganization1 = { ...mockOrganization, id: 1 };

    (useOrganization as jest.Mock).mockReturnValue({
      currentOrganization: mockOrganization1,
    });
    (getOrganizationTeams as jest.Mock).mockResolvedValue(mockTeams);

    const { rerender } = render(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Team Count: 2")).toBeInTheDocument();
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Change organization
    const mockOrganization2 = { ...mockOrganization, id: 2 };

    (useOrganization as jest.Mock).mockReturnValue({
      currentOrganization: mockOrganization2,
    });
    const newTeams = [{ ...mockTeams[0], id: 3, name: "New Team" }];

    (getOrganizationTeams as jest.Mock).mockResolvedValue(newTeams);

    // Trigger rerender
    rerender(
      <TeamProvider>
        <TestComponent />
      </TeamProvider>,
    );

    // Should fetch teams for the new organization
    await waitFor(() => {
      expect(getOrganizationTeams).toHaveBeenCalledWith(2);
      expect(screen.getByText("Current Team: New Team")).toBeInTheDocument();
    });
  });
});
