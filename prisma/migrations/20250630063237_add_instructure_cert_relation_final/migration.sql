-- AlterTable
ALTER TABLE `certificate` ADD COLUMN `instructureId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Certificate_instructureId_fkey` ON `certificate`(`instructureId`);

-- AddForeignKey
ALTER TABLE `certificate` ADD CONSTRAINT `Certificate_instructureId_fkey` FOREIGN KEY (`instructureId`) REFERENCES `instructure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
