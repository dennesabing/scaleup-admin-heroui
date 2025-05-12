import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

import { useOrganization } from "@/contexts/OrganizationContext";
import { getOrganizationTeams, createTeam } from "@/lib/services/teamService";
import { TeamModel } from "@/lib/team";

import MainLayout from "@/layouts/MainLayout";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";
import { useApiError } from "@/hooks/useApiError";

export default function TeamsPage() {
  const router = useRouter();
  const { id } = router.query;
  const organizationId = id as string;
  
  const { currentOrganization } = useOrganization();
  const [teams, setTeams] = useState<TeamModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { error, setError, clearError } = useApiError();
  
  useEffect(() => {
    if (organizationId) {
      loadTeams();
    }
  }, [organizationId]);
  
  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const teamsData = await getOrganizationTeams(organizationId);
      setTeams(teamsData);
    } catch (err) {
      console.error("Failed to load teams:", err);
      setError("Failed to load teams. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateTeam = () => {
    router.push(`/organizations/${organizationId}/teams/new`);
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">
            {currentOrganization ? currentOrganization.name : "Organization"} Teams
          </h1>
          <Button
            onClick={handleCreateTeam}
            className="flex items-center"
            color="primary"
            disabled={isCreating}
          >
            {isCreating ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <PlusIcon className="w-4 h-4 mr-2" />
            )}
            Create Team
          </Button>
        </div>
        
        {error && (
          <Alert type="error" className="mb-4" onDismiss={clearError}>
            {error}
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="w-8 h-8" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-medium text-gray-600">No teams yet</h2>
            <p className="text-gray-500 mt-2">
              Create a team to start collaborating with your team members.
            </p>
            <Button
              onClick={handleCreateTeam}
              className="mt-4"
              color="primary"
            >
              Create Your First Team
            </Button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {teams.map((team) => (
                <li key={team.id}>
                  <Link href={`/organizations/${organizationId}/teams/${team.id}`} passHref>
                    <div className="block hover:bg-gray-50 cursor-pointer">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {team.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-blue-600 truncate">
                                {team.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {team.description || "No description"}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Created on {new Date(team.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 