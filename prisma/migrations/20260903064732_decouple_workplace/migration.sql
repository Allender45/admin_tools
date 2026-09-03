/*
  Warnings:

  - Added the required column `workplace_number` to the `requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_workplace_id_fkey";

-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "workplace_number" VARCHAR(50) NOT NULL,
ALTER COLUMN "workplace_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_workplace_id_fkey" FOREIGN KEY ("workplace_id") REFERENCES "workplaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
