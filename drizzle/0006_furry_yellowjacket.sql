ALTER TABLE `jobs` ADD `source_status` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `source_checked_at` integer;--> statement-breakpoint
ALTER TABLE `jobs` ADD `source_fail_count` integer DEFAULT 0 NOT NULL;