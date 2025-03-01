export type Customer = {
  id: number;
  full_name: string;
  year_of_birth: string;
  phone_number: string;
  note?: string | null;
  role_note?: string | null;
  status: string;
  team_id: number;
  team_name: string | null;
  created_at: Date;
  updated_at: Date;
  created_by?: number | null;
  updated_by?: number | null;
};
