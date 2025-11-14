/*
  Warnings:

  - A unique constraint covering the columns `[team_id,name]` on the table `Projects` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Projects_team_id_name_key" ON "Projects"("team_id", "name");
