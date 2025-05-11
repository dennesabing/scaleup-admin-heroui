import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { useOrganization } from "./OrganizationContext";

import { TeamModel } from "@/lib/team";
import { getOrganizationTeams } from "@/lib/services/teamService";

interface TeamContextType {
  teams: TeamModel[];
  currentTeam: TeamModel | null;
  isLoading: boolean;
  error: string | null;
  setCurrentTeamId: (id: number | null) => void;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const CURRENT_TEAM_KEY = "current_team_id";

export const TeamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { currentOrganization } = useOrganization();
  const [teams, setTeams] = useState<TeamModel[]>([]);
  const [currentTeam, setCurrentTeam] = useState<TeamModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = async () => {
    if (!currentOrganization) {
      setTeams([]);
      setCurrentTeam(null);
      setIsLoading(false);

      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const teamsData = await getOrganizationTeams(currentOrganization.id);

      setTeams(teamsData);

      // Try to set current team from localStorage or default to first
      const storedTeamId = localStorage.getItem(CURRENT_TEAM_KEY);

      if (
        storedTeamId &&
        teamsData.some((team) => team.id === parseInt(storedTeamId))
      ) {
        setCurrentTeam(
          teamsData.find((team) => team.id === parseInt(storedTeamId)) || null,
        );
      } else if (teamsData.length > 0) {
        setCurrentTeam(teamsData[0]);
        localStorage.setItem(CURRENT_TEAM_KEY, teamsData[0].id.toString());
      } else {
        setCurrentTeam(null);
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
      setError("Failed to load teams. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [currentOrganization]);

  const setCurrentTeamId = (id: number | null) => {
    if (id === null) {
      localStorage.removeItem(CURRENT_TEAM_KEY);
      setCurrentTeam(null);

      return;
    }

    const team = teams.find((t) => t.id === id);

    if (team) {
      localStorage.setItem(CURRENT_TEAM_KEY, id.toString());
      setCurrentTeam(team);
    }
  };

  const refreshTeams = async () => {
    await loadTeams();
  };

  const value = {
    teams,
    currentTeam,
    isLoading,
    error,
    setCurrentTeamId,
    refreshTeams,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => {
  const context = useContext(TeamContext);

  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }

  return context;
};
