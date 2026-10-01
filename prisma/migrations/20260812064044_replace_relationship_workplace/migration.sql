-- DropForeignKey
ALTER TABLE "workplaces" DROP CONSTRAINT "workplaces_location_id_fkey";

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "location_id" INTEGER;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workplaces" ADD CONSTRAINT "workplaces_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
