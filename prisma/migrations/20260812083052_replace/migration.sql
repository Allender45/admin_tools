/*
  Warnings:

  - You are about to drop the column `floor` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `headphones_brand` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `headphones_model` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `hostname` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `keyboard_brand` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `keyboard_model` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `mac_address` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `monitor_model` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `mouse_brand` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `mouse_model` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `pc_model` on the `workplaces` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `workplaces` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "room" INTEGER;

-- AlterTable
ALTER TABLE "workplaces" DROP COLUMN "floor",
DROP COLUMN "headphones_brand",
DROP COLUMN "headphones_model",
DROP COLUMN "hostname",
DROP COLUMN "keyboard_brand",
DROP COLUMN "keyboard_model",
DROP COLUMN "mac_address",
DROP COLUMN "monitor_model",
DROP COLUMN "mouse_brand",
DROP COLUMN "mouse_model",
DROP COLUMN "pc_model",
DROP COLUMN "room",
ADD COLUMN     "headphones" VARCHAR(100),
ADD COLUMN     "keyboard" VARCHAR(100),
ADD COLUMN     "monitor" VARCHAR(100),
ADD COLUMN     "mouse" VARCHAR(100);
