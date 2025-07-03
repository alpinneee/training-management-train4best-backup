/*
  Warnings:

  - You are about to drop the column `capacity` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `instructorId` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `enrollment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseTypeId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_name` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userTypeId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `course` DROP FOREIGN KEY `Course_instructorId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollment` DROP FOREIGN KEY `Enrollment_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `enrollment` DROP FOREIGN KEY `Enrollment_userId_fkey`;

-- DropIndex
DROP INDEX `Course_instructorId_fkey` ON `course`;

-- AlterTable
ALTER TABLE `course` DROP COLUMN `capacity`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `description`,
    DROP COLUMN `endDate`,
    DROP COLUMN `instructorId`,
    DROP COLUMN `price`,
    DROP COLUMN `startDate`,
    DROP COLUMN `status`,
    DROP COLUMN `title`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `courseTypeId` VARCHAR(191) NOT NULL,
    ADD COLUMN `course_name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `createdAt`,
    DROP COLUMN `emailVerified`,
    DROP COLUMN `image`,
    DROP COLUMN `name`,
    DROP COLUMN `role`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `instructureId` VARCHAR(191) NULL,
    ADD COLUMN `last_login` DATETIME(3) NULL,
    ADD COLUMN `token` VARCHAR(191) NULL,
    ADD COLUMN `userTypeId` VARCHAR(191) NOT NULL,
    ADD COLUMN `username` VARCHAR(191) NOT NULL,
    MODIFY `password` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `enrollment`;

-- CreateTable
CREATE TABLE `UserType` (
    `id` VARCHAR(191) NOT NULL,
    `usertype` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Instructure` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `profiency` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstructureClass` (
    `id` VARCHAR(191) NOT NULL,
    `instructureId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participant` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NULL,
    `address` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `birth_date` DATETIME(3) NOT NULL,
    `job_title` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Class` (
    `id` VARCHAR(191) NOT NULL,
    `quota` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `start_reg_date` DATETIME(3) NOT NULL,
    `end_reg_date` DATETIME(3) NOT NULL,
    `duration_day` INTEGER NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `room` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseType` (
    `id` VARCHAR(191) NOT NULL,
    `course_type` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseRegistration` (
    `id` VARCHAR(191) NOT NULL,
    `reg_date` DATETIME(3) NOT NULL,
    `reg_status` VARCHAR(191) NOT NULL,
    `payment` DOUBLE NOT NULL,
    `payment_status` VARCHAR(191) NOT NULL,
    `payment_method` VARCHAR(191) NULL,
    `present_day` INTEGER NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ValueReport` (
    `id` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `value_type` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `instructureId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certification` (
    `id` VARCHAR(191) NOT NULL,
    `certificate_number` VARCHAR(191) NOT NULL,
    `issue_date` DATETIME(3) NOT NULL,
    `valid_date` DATETIME(3) NOT NULL,
    `file_pdf` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Certification_certificate_number_key`(`certificate_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_userTypeId_fkey` FOREIGN KEY (`userTypeId`) REFERENCES `UserType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_instructureId_fkey` FOREIGN KEY (`instructureId`) REFERENCES `Instructure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstructureClass` ADD CONSTRAINT `InstructureClass_instructureId_fkey` FOREIGN KEY (`instructureId`) REFERENCES `Instructure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstructureClass` ADD CONSTRAINT `InstructureClass_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_courseTypeId_fkey` FOREIGN KEY (`courseTypeId`) REFERENCES `CourseType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseRegistration` ADD CONSTRAINT `CourseRegistration_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseRegistration` ADD CONSTRAINT `CourseRegistration_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `Participant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValueReport` ADD CONSTRAINT `ValueReport_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `CourseRegistration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValueReport` ADD CONSTRAINT `ValueReport_instructureId_fkey` FOREIGN KEY (`instructureId`) REFERENCES `Instructure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certification` ADD CONSTRAINT `Certification_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `CourseRegistration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
