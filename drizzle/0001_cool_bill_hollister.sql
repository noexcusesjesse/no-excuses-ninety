ALTER TABLE `clients` ADD `physician_cleared_extended` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `anchor_day` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `tre_days` text DEFAULT '[3,5]' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `reset_variant` text DEFAULT 'standard_24hr' NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_checkins` ADD `fast_type` text;--> statement-breakpoint
ALTER TABLE `daily_checkins` ADD `fast_start_ms` integer;--> statement-breakpoint
ALTER TABLE `daily_checkins` ADD `fast_end_ms` integer;--> statement-breakpoint
ALTER TABLE `daily_checkins` ADD `fast_duration_ms` integer;