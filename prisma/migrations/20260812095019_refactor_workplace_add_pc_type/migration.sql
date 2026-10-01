/*
  Warnings:

  - You are about to drop the column `computer_type` on the `workplaces` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "workplaces" DROP COLUMN "computer_type",
ADD COLUMN     "pc_type_id" INTEGER;

-- CreateTable
CREATE TABLE "pc_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,

    CONSTRAINT "pc_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pc_types_name_key" ON "pc_types"("name");

-- AddForeignKey
ALTER TABLE "workplaces" ADD CONSTRAINT "workplaces_pc_type_id_fkey" FOREIGN KEY ("pc_type_id") REFERENCES "pc_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
