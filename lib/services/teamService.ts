import axiosInstance from "../axios";

import { TeamModel, TeamMemberModel } from "@/lib/team";

const API_ENDPOINTS = {
  ORGANIZATION_TEAMS: (organizationId: number | string) =>
    `/organizations/${organizationId}/teams`,
  ORGANIZATION_TEAM: (
    organizationId: number | string,
    teamId: number | string,
  ) => `/organizations/${organizationId}/teams/${teamId}`,
  TEAM_MEMBERS: (teamId: number | string) => `/teams/${teamId}/members`,
  TEAM_MEMBER: (teamId: number | string, userId: number | string) =>
    `/teams/${teamId}/members/${userId}`,
  USER_TEAMS: (organizationId: number | string, userId: number | string) =>
    `/organizations/${organizationId}/users/${userId}/teams`,
};

/**
 * Get all teams in an organization
 */
export const getOrganizationTeams = async (
  organizationId: number | string,
): Promise<TeamModel[]> => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.ORGANIZATION_TEAMS(organizationId),
  );

  return response.data.data;
};

/**
 * Get a specific team
 */
export const getTeam = async (
  organizationId: number | string,
  teamId: number | string,
): Promise<TeamModel> => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.ORGANIZATION_TEAM(organizationId, teamId),
  );

  return response.data.data;
};

/**
 * Create a new team in an organization
 */
export const createTeam = async (
  organizationId: number | string,
  data: Partial<TeamModel>,
): Promise<TeamModel> => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.ORGANIZATION_TEAMS(organizationId),
    data,
  );

  return response.data.data;
};

/**
 * Update an existing team
 */
export const updateTeam = async (
  organizationId: number | string,
  teamId: number | string,
  data: Partial<TeamModel>,
): Promise<TeamModel> => {
  const response = await axiosInstance.put(
    API_ENDPOINTS.ORGANIZATION_TEAM(organizationId, teamId),
    data,
  );

  return response.data.data;
};

/**
 * Delete a team
 */
export const deleteTeam = async (
  organizationId: number | string,
  teamId: number | string,
): Promise<void> => {
  await axiosInstance.delete(
    API_ENDPOINTS.ORGANIZATION_TEAM(organizationId, teamId),
  );
};

/**
 * Get all members of a team
 */
export const getTeamMembers = async (
  teamId: number | string,
): Promise<TeamMemberModel[]> => {
  const response = await axiosInstance.get(API_ENDPOINTS.TEAM_MEMBERS(teamId));

  return response.data.data;
};

/**
 * Add a user to a team with a specific role
 */
export const addTeamMember = async (
  teamId: number | string,
  userId: number | string,
  role: string,
): Promise<TeamMemberModel> => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.TEAM_MEMBERS(teamId),
    { user_id: userId, role },
  );

  return response.data.data;
};

/**
 * Update a member's role in a team
 */
export const updateTeamMember = async (
  teamId: number | string,
  userId: number | string,
  role: string,
): Promise<TeamMemberModel> => {
  const response = await axiosInstance.put(
    API_ENDPOINTS.TEAM_MEMBER(teamId, userId),
    { role },
  );

  return response.data.data;
};

/**
 * Remove a member from a team
 */
export const removeTeamMember = async (
  teamId: number | string,
  userId: number | string,
): Promise<void> => {
  await axiosInstance.delete(API_ENDPOINTS.TEAM_MEMBER(teamId, userId));
};

/**
 * Get all teams a user belongs to in an organization
 */
export const getUserTeams = async (
  organizationId: number | string,
  userId: number | string,
): Promise<TeamModel[]> => {
  const response = await axiosInstance.get(
    API_ENDPOINTS.USER_TEAMS(organizationId, userId),
  );

  return response.data.data;
};
