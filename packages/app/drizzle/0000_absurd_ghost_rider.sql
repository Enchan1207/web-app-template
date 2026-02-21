CREATE TABLE `auth_states` (
	`key` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`nonce` text NOT NULL,
	`code_verifier` text NOT NULL,
	`return_to` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`issued_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`idp_session_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`idp_iss` text NOT NULL,
	`idp_sub` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_idp_iss_idp_sub_unique` ON `users` (`idp_iss`,`idp_sub`);