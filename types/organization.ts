import { UserModel } from "@/lib/auth";

export interface OrganizationModel {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  attributes?: Record<string, any>;
}

export interface OrganizationMemberModel {
  id: number;
  organization_id: number;
  user_id: number;
  role: string;
  user?: UserModel;
  created_at: string;
  updated_at: string;
  is_current_user?: boolean;
}

export interface OrganizationInvitationModel {
  id: number;
  organization_id: number;
  email: string;
  token: string;
  role: string;
  status: "pending" | "accepted" | "expired";
  expires_at: string;
  created_at: string;
  updated_at: string;
  organization: OrganizationModel;
}
