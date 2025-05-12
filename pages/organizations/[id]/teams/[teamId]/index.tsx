import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { UserPlusIcon, Cog6ToothIcon, TrashIcon } from "@heroicons/react/24/outline";

import { useOrganization } from "@/contexts/OrganizationContext";
import { useApiError } from "@/hooks/useApiError";
import { getTeam, getTeamMembers, deleteTeam } from "@/lib/services/teamService";
import { TeamModel, TeamMemberModel } from "@/lib/team";

import MainLayout from "@/layouts/MainLayout";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";

export default function TeamDetailPage() {
  const router = useRouter();
  const { id, teamId } = router.query;
  const organizationId = id as string;
  const teamIdAsString = teamId as string;
  
  const { currentOrganization } = useOrganization();
  const [team, setTeam] = useState<TeamModel | null>(null);
  const [members, setMembers] = useState<TeamMemberModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { error, setError, clearError } = useApiError();
  
  useEffect(() => {
    if (organizationId && teamId) {
      loadTeamData();
    }
  }, [organizationId, teamId]);
  
  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const [teamData, membersData] = await Promise.all([
        getTeam(organizationId, teamIdAsString),
        getTeamMembers(teamIdAsString),
      ]);
      
      setTeam(teamData);
      setMembers(membersData);
    } catch (err) {
      console.error("Failed to load team data:", err);
      setError("Failed to load team data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteTeam = async () => {
    try {
      setIsDeleting(true);
      await deleteTeam(organizationId, teamIdAsString);
      router.push(`/organizations/${organizationId}/teams`);
    } catch (err) {
      console.error("Failed to delete team:", err);
      setError("Failed to delete team. Please try again later.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner className="w-10 h-10" />
        </div>
      </MainLayout>
    );
  }
  
  if (!team) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert type="error">Team not found or you don't have access.</Alert>
          <div className="mt-4">
            <Button onClick={() => router.back()} color="secondary">
              Go Back
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Team Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-gray-600 mt-1">{team.description || "No description"}</p>
          </div>
          <div className="flex space-x-3">
            <Button
              as={Link}
              href={`/organizations/${organizationId}/teams/${teamId}/members`}
              color="primary"
              className="flex items-center"
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Manage Members
            </Button>
            <Button
              as={Link}
              href={`/organizations/${organizationId}/teams/${teamId}/settings`}
              color="secondary"
              className="flex items-center"
            >
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              color="danger"
              className="flex items-center"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert type="error" className="mb-4" onDismiss={clearError}>
            {error}
          </Alert>
        )}
        
        {/* Team Members Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Team Members</h2>
          
          {members.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">
                This team doesn't have any members yet.
              </p>
              <Button
                as={Link}
                href={`/organizations/${organizationId}/teams/${teamId}/members`}
                color="primary"
                className="mt-4"
              >
                Add Members
              </Button>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {member.user ? (
                              member.user.name ? (
                                <span className="text-gray-500 font-medium">
                                  {member.user.name.slice(0, 2).toUpperCase()}
                                </span>
                              ) : (
                                <span className="text-gray-500 font-medium">
                                  {member.user.email.slice(0, 2).toUpperCase()}
                                </span>
                              )
                            ) : (
                              <span className="text-gray-500 font-medium">??</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.user?.name || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.user?.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Team"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the team "{team.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              color="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={handleDeleteTeam}
              disabled={isDeleting}
              className="flex items-center"
            >
              {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
              Delete Team
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
} 