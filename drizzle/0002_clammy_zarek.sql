CREATE TABLE `cv_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cv_id` integer NOT NULL,
	`score` integer NOT NULL,
	`breakdown` text NOT NULL,
	`rules_version` text NOT NULL,
	`computed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cv_id`) REFERENCES `cvs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cv_scores_cv_idx` ON `cv_scores` (`cv_id`);--> statement-breakpoint
CREATE TABLE `cvs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text DEFAULT 'ats' NOT NULL,
	`source_profile_updated_at` integer,
	`sections` text NOT NULL,
	`target_job_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `cvs_user_idx` ON `cvs` (`user_id`);