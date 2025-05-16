import { UserModel } from "@/lib/auth";

export interface TeamModel {
  id: number;
  organization_id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberModel {
  id: number;
  team_id: number;
  user_id: number;
  role: string;
  user?: UserModel;
  created_at: string;
  updated_at: string;
  name?: string;
  email?: string;
  profile_picture_url?: string;
} 