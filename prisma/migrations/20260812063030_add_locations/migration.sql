/*
  Warnings:

  - You are about to drop the column `monitor_brand` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `monitor_serial` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `pc_brand` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `pc_serial` on the `workplaces` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `positions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "workplaces" DROP COLUMN "monitor_brand",
DROP COLUMN "monitor_serial",
DROP COLUMN "pc_brand",
DROP COLUMN "pc_serial",
ADD COLUMN     "location_id" INTEGER;

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");

-- AddForeignKey
ALTER TABLE "workplaces" ADD CONSTRAINT "workplaces_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
