-- CreateTable
CREATE TABLE `institutions` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `timezone` VARCHAR(48) NOT NULL DEFAULT 'Asia/Almaty',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `institutions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `login` VARCHAR(100) NOT NULL,
    `displayName` VARCHAR(160) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `users_institutionId_status_idx`(`institutionId`, `status`),
    UNIQUE INDEX `users_institutionId_login_key`(`institutionId`, `login`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `code` ENUM('DEFECTOLOGIST', 'SUBJECT_TEACHER', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG', 'ADMINISTRATOR') NOT NULL,
    `labelKk` VARCHAR(100) NOT NULL,
    `labelRu` VARCHAR(100) NOT NULL,
    `description` VARCHAR(400) NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `userId` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NOT NULL,

    INDEX `user_roles_roleId_idx`(`roleId`),
    PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_sessions_tokenHash_key`(`tokenHash`),
    INDEX `user_sessions_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specialties` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `nameKk` VARCHAR(160) NOT NULL,
    `nameRu` VARCHAR(160) NOT NULL,

    INDEX `specialties_institutionId_idx`(`institutionId`),
    UNIQUE INDEX `specialties_institutionId_code_key`(`institutionId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_groups` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `specialtyId` CHAR(36) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `academicYear` VARCHAR(16) NOT NULL,

    INDEX `study_groups_institutionId_specialtyId_idx`(`institutionId`, `specialtyId`),
    UNIQUE INDEX `study_groups_institutionId_code_academicYear_key`(`institutionId`, `code`, `academicYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `nameKk` VARCHAR(160) NOT NULL,
    `nameRu` VARCHAR(160) NOT NULL,

    INDEX `subjects_institutionId_idx`(`institutionId`),
    UNIQUE INDEX `subjects_institutionId_code_key`(`institutionId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `groupId` CHAR(36) NOT NULL,
    `studentCode` VARCHAR(60) NOT NULL,
    `fullName` VARCHAR(160) NOT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `students_institutionId_groupId_status_idx`(`institutionId`, `groupId`, `status`),
    INDEX `students_institutionId_fullName_idx`(`institutionId`, `fullName`),
    UNIQUE INDEX `students_institutionId_studentCode_key`(`institutionId`, `studentCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_student_assignments` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `subjectId` CHAR(36) NULL,
    `assignedById` CHAR(36) NULL,
    `validFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validUntil` DATETIME(3) NULL,

    INDEX `user_student_assignments_institutionId_userId_validUntil_idx`(`institutionId`, `userId`, `validUntil`),
    INDEX `user_student_assignments_institutionId_studentId_subjectId_idx`(`institutionId`, `studentId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_support_profiles` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `createdById` CHAR(36) NOT NULL,
    `category` VARCHAR(60) NOT NULL,
    `description` TEXT NOT NULL,
    `reviewAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_support_profiles_institutionId_studentId_reviewAt_idx`(`institutionId`, `studentId`, `reviewAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `learning_goals` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `subjectId` CHAR(36) NOT NULL,
    `ownerId` CHAR(36) NOT NULL,
    `titleKk` VARCHAR(240) NOT NULL,
    `titleRu` VARCHAR(240) NOT NULL,
    `successCriteria` TEXT NOT NULL,
    `targetDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'ACHIEVED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `learning_goals_institutionId_studentId_status_idx`(`institutionId`, `studentId`, `status`),
    INDEX `learning_goals_institutionId_subjectId_status_idx`(`institutionId`, `subjectId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `observations` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `goalId` CHAR(36) NULL,
    `subjectId` CHAR(36) NULL,
    `authorId` CHAR(36) NOT NULL,
    `observedAt` DATETIME(3) NOT NULL,
    `context` VARCHAR(180) NULL,
    `observationText` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `observations_institutionId_studentId_observedAt_idx`(`institutionId`, `studentId`, `observedAt`),
    INDEX `observations_institutionId_goalId_observedAt_idx`(`institutionId`, `goalId`, `observedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recommendations` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `goalId` CHAR(36) NULL,
    `authorId` CHAR(36) NOT NULL,
    `domain` ENUM('DEFECTOLOGIST', 'SUBJECT_TEACHER', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG', 'ADMINISTRATOR') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `recommendations_institutionId_studentId_status_createdAt_idx`(`institutionId`, `studentId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recommendation_applications` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `recommendationId` CHAR(36) NOT NULL,
    `appliedById` CHAR(36) NOT NULL,
    `appliedAt` DATETIME(3) NOT NULL,
    `outcome` VARCHAR(300) NULL,
    `reflection` TEXT NULL,

    INDEX `recommendation_applications_institutionId_recommendationId_a_idx`(`institutionId`, `recommendationId`, `appliedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_sessions` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `goalId` CHAR(36) NOT NULL,
    `assessorId` CHAR(36) NOT NULL,
    `kind` ENUM('BASELINE', 'REASSESSMENT') NOT NULL,
    `assessedAt` DATETIME(3) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `assessment_sessions_institutionId_studentId_goalId_assessedA_idx`(`institutionId`, `studentId`, `goalId`, `assessedAt`),
    INDEX `assessment_sessions_institutionId_kind_assessedAt_idx`(`institutionId`, `kind`, `assessedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_results` (
    `id` CHAR(36) NOT NULL,
    `sessionId` CHAR(36) NOT NULL,
    `criterion` VARCHAR(120) NOT NULL,
    `score` DECIMAL(6, 2) NOT NULL,
    `scaleMin` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `scaleMax` DECIMAL(6, 2) NOT NULL DEFAULT 100,
    `evidence` TEXT NULL,

    UNIQUE INDEX `assessment_results_sessionId_criterion_key`(`sessionId`, `criterion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_plans` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `createdById` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NULL,
    `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `support_plans_institutionId_studentId_status_idx`(`institutionId`, `studentId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_plan_actions` (
    `id` CHAR(36) NOT NULL,
    `planId` CHAR(36) NOT NULL,
    `goalId` CHAR(36) NULL,
    `responsibleId` CHAR(36) NOT NULL,
    `titleKk` VARCHAR(200) NOT NULL,
    `titleRu` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `dueAt` DATETIME(3) NULL,
    `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `completedAt` DATETIME(3) NULL,
    `result` TEXT NULL,

    INDEX `support_plan_actions_planId_status_dueAt_idx`(`planId`, `status`, `dueAt`),
    INDEX `support_plan_actions_responsibleId_status_dueAt_idx`(`responsibleId`, `status`, `dueAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specialist_private_notes` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `authorId` CHAR(36) NOT NULL,
    `domain` ENUM('DEFECTOLOGIST', 'SUBJECT_TEACHER', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG', 'ADMINISTRATOR') NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `specialist_private_notes_institutionId_studentId_domain_crea_idx`(`institutionId`, `studentId`, `domain`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `private_note_access` (
    `noteId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `private_note_access_userId_idx`(`userId`),
    PRIMARY KEY (`noteId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collaboration_threads` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `collaboration_threads_institutionId_studentId_status_updated_idx`(`institutionId`, `studentId`, `status`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thread_members` (
    `threadId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `thread_members_userId_idx`(`userId`),
    PRIMARY KEY (`threadId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` CHAR(36) NOT NULL,
    `threadId` CHAR(36) NOT NULL,
    `authorId` CHAR(36) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_threadId_createdAt_idx`(`threadId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `library_items` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `createdById` CHAR(36) NOT NULL,
    `kind` ENUM('NORMATIVE', 'TEACHER_GUIDE', 'METHODICAL') NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `titleKk` VARCHAR(240) NOT NULL,
    `titleRu` VARCHAR(240) NOT NULL,
    `summaryKk` TEXT NULL,
    `summaryRu` TEXT NULL,
    `publishedAt` DATETIME(3) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `library_items_institutionId_kind_isPublished_idx`(`institutionId`, `kind`, `isPublished`),
    FULLTEXT INDEX `library_items_titleKk_titleRu_summaryKk_summaryRu_idx`(`titleKk`, `titleRu`, `summaryKk`, `summaryRu`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `library_files` (
    `id` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `uploadedById` CHAR(36) NOT NULL,
    `objectKey` VARCHAR(500) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(120) NOT NULL,
    `sizeBytes` BIGINT NOT NULL,
    `checksum` CHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `library_files_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `data_processing_records` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `studentId` CHAR(36) NOT NULL,
    `recordedById` CHAR(36) NOT NULL,
    `purposeCode` VARCHAR(80) NOT NULL,
    `legalBasis` VARCHAR(120) NOT NULL,
    `noticeVersion` VARCHAR(40) NULL,
    `evidenceRef` VARCHAR(255) NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validUntil` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `data_processing_records_institutionId_studentId_purposeCode__idx`(`institutionId`, `studentId`, `purposeCode`, `validUntil`, `revokedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `retention_policies` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `dataCategory` VARCHAR(80) NOT NULL,
    `retentionDays` INTEGER NULL,
    `triggerCode` VARCHAR(80) NOT NULL,
    `approvedBy` VARCHAR(160) NOT NULL,
    `approvedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `retention_policies_institutionId_dataCategory_triggerCode_key`(`institutionId`, `dataCategory`, `triggerCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NULL,
    `studentId` CHAR(36) NULL,
    `action` VARCHAR(60) NOT NULL,
    `recordType` VARCHAR(100) NOT NULL,
    `recordId` VARCHAR(64) NULL,
    `requestId` VARCHAR(80) NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_institutionId_occurredAt_idx`(`institutionId`, `occurredAt`),
    INDEX `audit_logs_institutionId_studentId_occurredAt_idx`(`institutionId`, `studentId`, `occurredAt`),
    INDEX `audit_logs_actorId_occurredAt_idx`(`actorId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `institutionId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `body` VARCHAR(500) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_readAt_createdAt_idx`(`userId`, `readAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialties` ADD CONSTRAINT `specialties_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_groups` ADD CONSTRAINT `study_groups_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `study_groups` ADD CONSTRAINT `study_groups_specialtyId_fkey` FOREIGN KEY (`specialtyId`) REFERENCES `specialties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `study_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_student_assignments` ADD CONSTRAINT `user_student_assignments_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_student_assignments` ADD CONSTRAINT `user_student_assignments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_student_assignments` ADD CONSTRAINT `user_student_assignments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_student_assignments` ADD CONSTRAINT `user_student_assignments_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_student_assignments` ADD CONSTRAINT `user_student_assignments_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_support_profiles` ADD CONSTRAINT `student_support_profiles_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_support_profiles` ADD CONSTRAINT `student_support_profiles_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_support_profiles` ADD CONSTRAINT `student_support_profiles_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_goals` ADD CONSTRAINT `learning_goals_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_goals` ADD CONSTRAINT `learning_goals_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_goals` ADD CONSTRAINT `learning_goals_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `learning_goals` ADD CONSTRAINT `learning_goals_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observations` ADD CONSTRAINT `observations_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observations` ADD CONSTRAINT `observations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observations` ADD CONSTRAINT `observations_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `learning_goals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observations` ADD CONSTRAINT `observations_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observations` ADD CONSTRAINT `observations_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `learning_goals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendation_applications` ADD CONSTRAINT `recommendation_applications_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendation_applications` ADD CONSTRAINT `recommendation_applications_recommendationId_fkey` FOREIGN KEY (`recommendationId`) REFERENCES `recommendations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recommendation_applications` ADD CONSTRAINT `recommendation_applications_appliedById_fkey` FOREIGN KEY (`appliedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_sessions` ADD CONSTRAINT `assessment_sessions_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_sessions` ADD CONSTRAINT `assessment_sessions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_sessions` ADD CONSTRAINT `assessment_sessions_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `learning_goals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_sessions` ADD CONSTRAINT `assessment_sessions_assessorId_fkey` FOREIGN KEY (`assessorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_results` ADD CONSTRAINT `assessment_results_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `assessment_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_plans` ADD CONSTRAINT `support_plans_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_plans` ADD CONSTRAINT `support_plans_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_plans` ADD CONSTRAINT `support_plans_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_plan_actions` ADD CONSTRAINT `support_plan_actions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `support_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_plan_actions` ADD CONSTRAINT `support_plan_actions_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `learning_goals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_plan_actions` ADD CONSTRAINT `support_plan_actions_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialist_private_notes` ADD CONSTRAINT `specialist_private_notes_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialist_private_notes` ADD CONSTRAINT `specialist_private_notes_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialist_private_notes` ADD CONSTRAINT `specialist_private_notes_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `private_note_access` ADD CONSTRAINT `private_note_access_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `specialist_private_notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `private_note_access` ADD CONSTRAINT `private_note_access_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collaboration_threads` ADD CONSTRAINT `collaboration_threads_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collaboration_threads` ADD CONSTRAINT `collaboration_threads_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thread_members` ADD CONSTRAINT `thread_members_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `collaboration_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thread_members` ADD CONSTRAINT `thread_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `collaboration_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_items` ADD CONSTRAINT `library_items_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_items` ADD CONSTRAINT `library_items_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_files` ADD CONSTRAINT `library_files_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `library_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_files` ADD CONSTRAINT `library_files_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `data_processing_records` ADD CONSTRAINT `data_processing_records_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `data_processing_records` ADD CONSTRAINT `data_processing_records_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `data_processing_records` ADD CONSTRAINT `data_processing_records_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `retention_policies` ADD CONSTRAINT `retention_policies_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
