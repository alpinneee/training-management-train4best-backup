-- AlterTable
ALTER TABLE `usertype` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NULL DEFAULT 'Active';
