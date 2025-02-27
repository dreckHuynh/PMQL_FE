/*
  Warnings:

  - A unique constraint covering the columns `[team_name]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Team_team_name_key" ON "Team"("team_name");
