CREATE TABLE `academic_years` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academic_years_name_unique` ON `academic_years` (`name`);--> statement-breakpoint
CREATE INDEX `academic_years_active_idx` ON `academic_years` (`is_active`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`details` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`account_holder` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bank_accounts_active_idx` ON `bank_accounts` (`is_active`);--> statement-breakpoint
CREATE TABLE `bill_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`default_amount` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bill_categories_code_unique` ON `bill_categories` (`code`);--> statement-breakpoint
CREATE INDEX `bill_categories_active_idx` ON `bill_categories` (`is_active`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`deadline` text,
	`grace_months` integer DEFAULT 3 NOT NULL,
	`allow_installment` integer DEFAULT true NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_deleted_idx` ON `events` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text,
	`amount` integer NOT NULL,
	`spent_at` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_id` text,
	`period_month` integer,
	`period_year` integer,
	`amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`due_date` text,
	`grace_until` text,
	`allow_installment` integer DEFAULT false NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_spp_unique` ON `invoices` (`student_id`,`period_year`,`period_month`) WHERE "invoices"."type" = 'spp';--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_event_unique` ON `invoices` (`student_id`,`event_id`) WHERE "invoices"."type" = 'event';--> statement-breakpoint
CREATE INDEX `invoices_student_deleted_idx` ON `invoices` (`student_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `invoices_type_period_idx` ON `invoices` (`type`,`period_year`,`period_month`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `parent_students` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`student_id` text NOT NULL,
	`relation` text,
	FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parent_students_parent_student_uq` ON `parent_students` (`parent_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `parents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`username` text,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`address` text,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `parents_user_idx` ON `parents` (`user_id`);--> statement-breakpoint
CREATE INDEX `parents_username_idx` ON `parents` (`username`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text,
	`student_id` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`infaq_amount` integer DEFAULT 0 NOT NULL,
	`method` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`proof_url` text,
	`note` text,
	`receipt_number` text,
	`paid_by` text,
	`confirmed_by` text,
	`confirmed_at` integer,
	`rejected_at` integer,
	`rejected_by` text,
	`reject_reason` text,
	`voided_at` integer,
	`voided_by` text,
	`void_reason` text,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`paid_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`rejected_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`voided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_receipt_number_unique` ON `payments` (`receipt_number`);--> statement-breakpoint
CREATE INDEX `payments_invoice_created_idx` ON `payments` (`invoice_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_status_deleted_idx` ON `payments` (`status`,`deleted_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_student_idx` ON `payments` (`student_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_paidby_pending_idx` ON `payments` (`paid_by`,`status`);--> statement-breakpoint
CREATE TABLE `school_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`name` text DEFAULT 'SPP Digital' NOT NULL,
	`short_name` text DEFAULT 'SPP Digital' NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`tagline` text,
	`bank_name` text,
	`bank_account_name` text,
	`bank_account_number` text,
	`qris_content` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_expires_idx` ON `sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `sessions_token_idx` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE TABLE `spp_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`academic_year` text NOT NULL,
	`grade_level` integer,
	`class_name` text,
	`amount` integer NOT NULL,
	`billing_day` integer DEFAULT 1 NOT NULL,
	`due_day` integer DEFAULT 10 NOT NULL,
	`late_fee` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`nis` text NOT NULL,
	`full_name` text NOT NULL,
	`gender` text,
	`class_name` text,
	`grade_level` integer,
	`cohort` text,
	`status` text DEFAULT 'active' NOT NULL,
	`guardian_phone` text,
	`deleted_at` integer,
	`deleted_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_nis_unique` ON `students` (`nis`);--> statement-breakpoint
CREATE INDEX `students_status_deleted_idx` ON `students` (`status`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `students_class_idx` ON `students` (`class_name`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_roles_user_role_uq` ON `user_roles` (`user_id`,`role`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text,
	`email` text,
	`password_hash` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_is_active_idx` ON `users` (`is_active`);