export type User = {
  id: number;
  name: string;
  username: string;
  password: string;
  is_admin: boolean;
  is_team_lead: boolean;
  team_id?: number | null;
  is_first_login: boolean;
  status: string;
  created_at: Date;
  created_by?: number | null;
  updated_at: Date;
  updated_by?: number | null;
};
