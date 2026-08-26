CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`coach_id` text NOT NULL,
	`client_id` text,
	`action` text NOT NULL,
	`details` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`coach_id` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`start_weight_lb` real NOT NULL,
	`height_in` real,
	`date_of_birth` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_email_unique` ON `clients` (`email`);--> statement-breakpoint
CREATE TABLE `coaches` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coaches_email_unique` ON `coaches` (`email`);--> statement-breakpoint
CREATE TABLE `daily_checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`workout_done` integer,
	`walk_minutes` integer,
	`steps` integer,
	`protein_g` integer,
	`hydration_oz` integer,
	`mood` integer,
	`energy` integer,
	`sleep_hours` real,
	`cpap_hours` real,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `program_days` (
	`day_number` integer PRIMARY KEY NOT NULL,
	`workout` text NOT NULL,
	`phase` text NOT NULL,
	`week_number` integer NOT NULL,
	`is_deload` integer DEFAULT false NOT NULL,
	`day_label` text NOT NULL,
	`is_fasted_walk` integer DEFAULT false NOT NULL,
	`walk_minutes` integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weights` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`weight_lb` real NOT NULL,
	`waist_in` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
