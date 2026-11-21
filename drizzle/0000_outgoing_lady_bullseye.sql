CREATE TABLE `curation_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` integer NOT NULL,
	`action` text NOT NULL,
	`note` text,
	`curator` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `curation_job_idx` ON `curation_log` (`job_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`company_initials` text NOT NULL,
	`category` text NOT NULL,
	`employment_type` text NOT NULL,
	`city` text NOT NULL,
	`province` text NOT NULL,
	`district` text,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`salary_min` integer,
	`salary_max` integer,
	`description` text NOT NULL,
	`requirements` text DEFAULT '[]' NOT NULL,
	`apply_channel` text NOT NULL,
	`apply_target` text NOT NULL,
	`source_name` text NOT NULL,
	`source_url` text,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`verified_at` integer,
	`expires_at` integer,
	`last_seen_at` integer,
	`is_direct_employer` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_slug_unique` ON `jobs` (`slug`);--> statement-breakpoint
CREATE INDEX `jobs_city_idx` ON `jobs` (`city`);--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`verification_status`);--> statement-breakpoint
CREATE INDEX `jobs_category_idx` ON `jobs` (`category`);--> statement-breakpoint
CREATE INDEX `jobs_geo_idx` ON `jobs` (`lat`,`lng`);