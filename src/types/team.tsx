import { Prisma } from "@prisma/client";

// Define a type based on the Prisma User model
export type Team = Prisma.TeamGetPayload<{
  select: {
    id: true;
    team_name: true;
    created_at: true;
    created_by: true;
    updated_at: true;
    updated_by: true;
  };
}>;
