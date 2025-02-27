// Define a type based on the Prisma User model
export type CallCount = {
  call_count?: bigint; // Prisma may return BigInt
  caller?: string;
  team_name?: string;
};
