import { useEffect, useState } from "react";
import { NextPageWithLayout } from "@/pages/_app";
import AdminLayout from "@/layouts/admin";
import {
  Button,
} from "@heroui/button";
import {
  Card,
  CardBody
} from "@heroui/card";
import {
  Tab,
  Tabs
} from "@heroui/tabs";
import { 
  RefreshCw, 
  Users 
} from "@/components/icons";
import { useRouter } from "next/router";
import { TeamModel } from "@/lib/team";
import { getCurrentUser } from "@/lib/auth";
import { useAuth } from "@/lib/authMiddleware";
import { useOrganization } from "@/contexts/OrganizationContext";
import { getUserTeams } from "@/lib/services/teamService";
import { formatDate } from "@/lib/utils/dateFormatter";

const TeamsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { organizations: organizationsList } = useOrganization();
  
  // Get the current user info
  const currentUser = getCurrentUser();
  
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (currentUser && organizationsList?.length > 0) {
      loadUserTeams();
    }
  }, [currentUser, organizationsList]);
  
  const loadUserTeams = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Fetch teams for each organization the user is part of
      const teamsPromises = organizationsList?.map(async (org) => {
        try {
          const orgTeams = await getUserTeams(org.id, currentUser!.id);
          return orgTeams.map(team => ({
            ...team,
            organization: { id: org.id, name: org.name }
          }));
        } catch (err) {
          console.error(`Error loading teams for organization ${org.id}:`, err);
          return [];
        }
      }) || [];
      
      const teamsResults = await Promise.all(teamsPromises);
      const flattenedTeams = teamsResults.flat();
      
      setTeams(flattenedTeams);
    } catch (err: any) {
      setError("Failed to load teams");
      console.error("Error loading teams:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Teams</h1>
          <Button
            isIconOnly
            size="sm"
            title="Refresh"
            variant="light"
            onClick={loadUserTeams}
          >
            <RefreshCw size={18} />
          </Button>
        </div>
        
        {error && (
          <div className="bg-danger-100 text-danger p-4 rounded-lg">
            {error}
          </div>
        )}
        
        {teams.length === 0 ? (
          <div className="text-center p-8 bg-default-50 rounded-lg">
            <Users className="mx-auto mb-4 text-default-400" size={48} />
            <h3 className="text-lg font-semibold mb-2">No Teams Found</h3>
            <p className="text-default-500 mb-4">
              You don't have any teams yet. Teams help you organize members into groups with specific permissions and responsibilities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card
                key={`${team.organization.id}-${team.id}`}
                isPressable
                className="bg-default-50 p-4 rounded-lg border border-default-200 hover:border-primary transition-all cursor-pointer"
                onClick={() => router.push(`/teams/${team.id}`)}
              >
                <CardBody className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">{team.name}</h3>
                  </div>
                  <p className="text-default-500 text-sm mb-3">
                    {team.description || "No description"}
                  </p>
                  <div className="bg-default-100 rounded px-2 py-1 mb-3">
                    <p className="text-xs text-default-600">
                      Organization: {team.organization.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                      <Users className="text-default-400 mr-1" size={16} />
                      <span className="text-xs text-default-500">
                        Team
                      </span>
                    </div>
                    <span className="text-xs text-default-400">
                      Created {formatDate(team.created_at)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

TeamsPage.getLayout = (page: React.ReactElement) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export default TeamsPage; 