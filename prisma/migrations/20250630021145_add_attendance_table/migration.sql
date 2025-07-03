-- CreateTable
CREATE TABLE `coursematerial` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `day` INTEGER NOT NULL,
    `size` INTEGER NULL,
    `isGoogleDrive` BOOLEAN NOT NULL DEFAULT false,
    `courseScheduleId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseMaterial_courseScheduleId_fkey`(`courseScheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    INDEX `attendance_registrationId_idx`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coursematerial` ADD CONSTRAINT `CourseMaterial_courseScheduleId_fkey` FOREIGN KEY (`courseScheduleId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `courseregistration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
