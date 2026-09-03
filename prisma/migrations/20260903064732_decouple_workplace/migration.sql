-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_workplace_id_fkey";

-- AlterTable
ALTER TABLE "requests" ALTER COLUMN "workplace_id" DROP NOT NULL;
ALTER TABLE "requests" ADD COLUMN "workplace_number" VARCHAR(50);

-- Backfill существующих строк номером связанного рабочего места
UPDATE "requests" r
SET "workplace_number" = w."number"
FROM "workplaces" w
WHERE r."workplace_id" = w."id";

-- Заглушка для строк без связанного рабочего места (на случай null)
UPDATE "requests"
SET "workplace_number" = ''
WHERE "workplace_number" IS NULL;

ALTER TABLE "requests" ALTER COLUMN "workplace_number" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_workplace_id_fkey" FOREIGN KEY ("workplace_id") REFERENCES "workplaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;