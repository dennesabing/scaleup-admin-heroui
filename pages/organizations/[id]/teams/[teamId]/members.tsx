import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { UserPlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { useOrganization } from "@/contexts/OrganizationContext";
import { useApiError } from "@/hooks/useApiError";
import { getTeam, getTeamMembers, addTeamMember, updateTeamMember, removeTeamMember } from "@/lib/services/teamService";
import { getOrganizationMembers } from "@/lib/services/organizationService";
import { TeamModel, TeamMemberModel } from "@/lib/team";
import { OrganizationMemberModel } from "@/lib/organization";

import AdminLayout from "@/layouts/admin";
import { Button } from "@heroui/button";
import Alert from "@/components/Alert";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import Select from "@/components/ui/Select";

export default function TeamMembersPage() {
  const router = useRouter();
  const { id, teamId } = router.query;
  const organizationId = id as string;
  const teamIdAsString = teamId as string;
  
  const { currentOrganization } = useOrganization();
  const [team, setTeam] = useState<TeamModel | null>(null);
  const [members, setMembers] = useState<TeamMemberModel[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMemberModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | string>("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberModel | null>(null);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  
  const { error, setError, clearError } = useApiError();
  
  useEffect(() => {
    if (organizationId && teamId) {
      loadData();
    }
  }, [organizationId, teamId]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const [teamData, membersData, orgMembersData] = await Promise.all([
        getTeam(organizationId, teamIdAsString),
        getTeamMembers(teamIdAsString),
        getOrganizationMembers(organizationId),
      ]);
      
      setTeam(teamData);
      setMembers(membersData);
      setOrganizationMembers(orgMembersData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load team data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddMember = async () => {
    if (!selectedUserId) return;
    
    try {
      setIsAddingMember(true);
      clearError();
      
      const newMember = await addTeamMember(
        teamIdAsString,
        selectedUserId,
        selectedRole
      );
      
      // Refresh member list
      const updatedMembers = await getTeamMembers(teamIdAsString);
      setMembers(updatedMembers);
      
      // Reset form
      setSelectedUserId("");
      setSelectedRole("member");
      setShowAddMemberModal(false);
    } catch (err) {
      console.error("Failed to add team member:", err);
      setError("Failed to add team member. Please try again later.");
    } finally {
      setIsAddingMember(false);
    }
  };
  
  const handleUpdateMemberRole = async (userId: number, newRole: string) => {
    try {
      await updateTeamMember(teamIdAsString, userId, newRole);
      
      // Update local state
      setMembers(members.map(member => 
        member.user_id === userId 
          ? { ...member, role: newRole } 
          : member
      ));
    } catch (err) {
      console.error("Failed to update member role:", err);
      setError("Failed to update member role. Please try again.");
    }
  };
  
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      setIsRemovingMember(true);
      clearError();
      
      await removeTeamMember(teamIdAsString, memberToRemove.user_id);
      
      // Update local state
      setMembers(members.filter(member => member.id !== memberToRemove.id));
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    } catch (err) {
      console.error("Failed to remove team member:", err);
      setError("Failed to remove team member. Please try again later.");
    } finally {
      setIsRemovingMember(false);
    }
  };
  
  // Get available organization members (not already in the team)
  const availableMembers = organizationMembers.filter(orgMember => 
    !members.some(teamMember => teamMember.user_id === orgMember.user_id)
  );
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner className="w-10 h-10" />
        </div>
      </AdminLayout>
    );
  }
  
  if (!team) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert type="error">Team not found or you don't have access.</Alert>
          <div className="mt-4">
            <Button onClick={() => router.back()} color="secondary">
              Go Back
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">
            {team.name} - Team Members
          </h1>
          <Button
            onClick={() => setShowAddMemberModal(true)}
            color="primary"
            className="flex items-center"
            disabled={availableMembers.length === 0}
          >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>
        
        {error && (
          <Alert type="error" className="mb-4" onDismiss={clearError}>
            {error}
          </Alert>
        )}
        
        {availableMembers.length === 0 && (
          <Alert type="warning" className="mb-4">
            All organization members are already in this team. Add more members to the organization first.
          </Alert>
        )}
        
        {members.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              This team doesn't have any members yet. Add your first team member to get started.
            </p>
            <Button
              onClick={() => setShowAddMemberModal(true)}
              color="primary"
              disabled={availableMembers.length === 0}
            >
              Add Team Member
            </Button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.user_id, e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setMemberToRemove(member);
                          setShowRemoveMemberModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 flex items-center justify-end w-full"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Team Member"
      >
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
              User <span className="text-red-500">*</span>
            </label>
            <select
              id="user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a user</option>
              {availableMembers.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user?.name || member.user?.email || `User #${member.user_id}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              color="secondary"
              onClick={() => setShowAddMemberModal(false)}
              disabled={isAddingMember}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleAddMember}
              disabled={isAddingMember || !selectedUserId}
              className="flex items-center"
            >
              {isAddingMember && <Spinner className="w-4 h-4 mr-2" />}
              Add to Team
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Remove Member Modal */}
      <Modal
        isOpen={showRemoveMemberModal}
        onClose={() => setShowRemoveMemberModal(false)}
        title="Remove Team Member"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to remove {memberToRemove?.user?.name || "this user"} from the team?
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              color="secondary"
              onClick={() => setShowRemoveMemberModal(false)}
              disabled={isRemovingMember}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
              className="flex items-center"
            >
              {isRemovingMember && <Spinner className="w-4 h-4 mr-2" />}
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
} 