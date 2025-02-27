import { Prisma } from "@prisma/client";

// Define a type based on the Prisma User model
export type Customer = Prisma.CustomerGetPayload<{
  select: {
    id: true;
    full_name: true;
    year_of_birth: true;
    phone_number: true;
    note: true;
    role_note: true;
    status: true;
    team_id: true;
    created_at: true;
    created_by: true;
    updated_at: true;
    updated_by: true;
  };
}>;
