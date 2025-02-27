/*
  Warnings:

  - Made the column `created_at` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `Team` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Team` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_admin` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_team_lead` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_first_login` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Team_team_name_key";

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "is_admin" SET NOT NULL,
ALTER COLUMN "is_team_lead" SET NOT NULL,
ALTER COLUMN "is_first_login" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;
