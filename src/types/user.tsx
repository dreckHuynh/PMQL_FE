import { Prisma } from "@prisma/client";

// Define a type based on the Prisma User model
export type User = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    is_admin: true;
    is_team_lead: true;
    team_id: true;
    created_at: true;
    created_by: true;
    updated_at: true;
    updated_by: true;
    name: true;
    is_fist_login: true;
  };
}>;
