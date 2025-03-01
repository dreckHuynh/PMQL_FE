export type Team = {
  id: number;
  team_name: string;
  created_at: Date;
  updated_at: Date;
  created_by?: number | null;
  updated_by?: number | null;
};
