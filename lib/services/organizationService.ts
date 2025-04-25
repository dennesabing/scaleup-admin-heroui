import axiosInstance from '../axios';
import { OrganizationModel, OrganizationMemberModel, OrganizationInvitationModel } from '@/types/organization';

const API_ENDPOINTS = {
  ORGANIZATIONS: '/organizations',
  ORGANIZATION: (id: number | string) => `/organizations/${id}`,
  ORGANIZATION_MEMBERS: (id: number | string) => `/organizations/${id}/members`,
  ORGANIZATION_MEMBER: (id: number | string, userId: number | string) => `/organizations/${id}/members/${userId}`,
  ORGANIZATION_INVITATIONS: (id: number | string) => `/organizations/${id}/invitations`,
  ORGANIZATION_INVITATION: (id: number | string, invitationId: number | string) => `/organizations/${id}/invitations/${invitationId}`,
  ORGANIZATION_ATTRIBUTES: (id: number | string) => `/organizations/${id}/attributes`,
  ORGANIZATION_ATTRIBUTE: (id: number | string, attribute: string) => `/organizations/${id}/attributes/${attribute}`,
};

/**
 * Get all organizations for the authenticated user
 */
export const getOrganizations = async (): Promise<OrganizationModel[]> => {
  const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATIONS);
  return response.data.data;
};

/**
 * Get a specific organization by ID
 */
export const getOrganization = async (id: number | string): Promise<OrganizationModel> => {
  const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION(id));
  return response.data.data;
};

/**
 * Create a new organization
 */
export const createOrganization = async (data: Partial<OrganizationModel>): Promise<OrganizationModel> => {
  const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATIONS, data);
  return response.data.data;
};

/**
 * Update an existing organization
 */
export const updateOrganization = async (id: number | string, data: Partial<OrganizationModel>): Promise<OrganizationModel> => {
  const response = await axiosInstance.put(API_ENDPOINTS.ORGANIZATION(id), data);
  return response.data.data;
};

/**
 * Delete an organization
 */
export const deleteOrganization = async (id: number | string): Promise<void> => {
  await axiosInstance.delete(API_ENDPOINTS.ORGANIZATION(id));
};

/**
 * Get all members of an organization
 */
export const getOrganizationMembers = async (organizationId: number | string): Promise<OrganizationMemberModel[]> => {
  const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION_MEMBERS(organizationId));
  return response.data.data;
};

/**
 * Add a user to an organization with a specific role
 */
export const addOrganizationMember = async (organizationId: number | string, userId: number | string, role: string): Promise<OrganizationMemberModel> => {
  const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION_MEMBERS(organizationId), { user_id: userId, role });
  return response.data.data;
};

/**
 * Update a member's role in an organization
 */
export const updateOrganizationMember = async (organizationId: number | string, userId: number | string, role: string): Promise<OrganizationMemberModel> => {
  const response = await axiosInstance.put(API_ENDPOINTS.ORGANIZATION_MEMBER(organizationId, userId), { role });
  return response.data.data;
};

/**
 * Remove a member from an organization
 */
export const removeOrganizationMember = async (organizationId: number | string, userId: number | string): Promise<void> => {
  await axiosInstance.delete(API_ENDPOINTS.ORGANIZATION_MEMBER(organizationId, userId));
};

/**
 * Create an invitation to join an organization
 */
export const createOrganizationInvitation = async (organizationId: number | string, email: string, role: string): Promise<OrganizationInvitationModel> => {
  const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION_INVITATIONS(organizationId), { email, role });
  return response.data.data;
};

/**
 * Cancel an organization invitation
 */
export const cancelOrganizationInvitation = async (organizationId: number | string, invitationId: number | string): Promise<void> => {
  await axiosInstance.delete(API_ENDPOINTS.ORGANIZATION_INVITATION(organizationId, invitationId));
};

/**
 * Accept an invitation to join an organization
 */
export const acceptInvitation = async (token: string): Promise<OrganizationMemberModel> => {
  const response = await axiosInstance.post(`/api/organization-invitations/${token}/accept`);
  return response.data.data;
};

/**
 * Get all attributes for an organization
 */
export const getOrganizationAttributes = async (organizationId: number | string): Promise<Record<string, any>> => {
  const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION_ATTRIBUTES(organizationId));
  return response.data.data;
};

/**
 * Create or update organization attributes
 */
export const createOrganizationAttributes = async (organizationId: number | string, attributes: Record<string, any>): Promise<Record<string, any>> => {
  const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION_ATTRIBUTES(organizationId), attributes);
  return response.data.data;
};

/**
 * Update a specific organization attribute
 */
export const updateOrganizationAttribute = async (organizationId: number | string, attribute: string, value: any): Promise<Record<string, any>> => {
  const response = await axiosInstance.put(API_ENDPOINTS.ORGANIZATION_ATTRIBUTE(organizationId, attribute), { value });
  return response.data.data;
};

/**
 * Delete a specific organization attribute
 */
export const deleteOrganizationAttribute = async (organizationId: number | string, attribute: string): Promise<void> => {
  await axiosInstance.delete(API_ENDPOINTS.ORGANIZATION_ATTRIBUTE(organizationId, attribute));
};

/**
 * Delete all attributes for an organization
 */
export const deleteAllOrganizationAttributes = async (organizationId: number | string): Promise<void> => {
  await axiosInstance.delete(API_ENDPOINTS.ORGANIZATION_ATTRIBUTES(organizationId));
};

/**
 * Get all invitations for an organization
 */
export const getOrganizationInvitations = async (organizationId: number | string): Promise<OrganizationInvitationModel[]> => {
  const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION_INVITATIONS(organizationId));
  return response.data.data;
};

/**
 * Resend an organization invitation
 */
export const resendOrganizationInvitation = async (organizationId: number | string, invitationId: number | string): Promise<OrganizationInvitationModel> => {
  const response = await axiosInstance.post(`${API_ENDPOINTS.ORGANIZATION_INVITATION(organizationId, invitationId)}/resend`);
  return response.data.data;
};