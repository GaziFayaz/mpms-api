/*
  Warnings:

  - You are about to drop the column `file_url` on the `attachments` table. All the data in the column will be lost.
  - Added the required column `file_key` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "file_url",
ADD COLUMN     "file_key" TEXT NOT NULL;
